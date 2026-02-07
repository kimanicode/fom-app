import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestDto, RedoQuestDto } from './quests.dto';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_RADIUS_KM = 50;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class QuestsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async create(userId: string, dto: CreateQuestDto) {
    const location = await this.prisma.location.create({
      data: {
        placeName: dto.location.placeName,
        lat: dto.location.lat,
        lng: dto.location.lng,
        category: dto.location.category,
      },
    });

    const template = await this.prisma.questTemplate.create({
      data: {
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        vibeTag: dto.vibeTag,
        imageUrl: dto.imageUrl,
        locationId: location.id,
        startTime: new Date(dto.startTime),
        durationMinutes: dto.durationMinutes,
        maxParticipants: dto.maxParticipants,
        cost: 'free',
      },
    });

    await this.notifications.create(userId, {
      type: 'quest_created',
      title: 'Quest created',
      body: `Your quest "${template.title}" is live.`,
      data: { questId: template.id },
    });

    const instance = await this.prisma.questInstance.create({
      data: {
        templateId: template.id,
        startTime: template.startTime,
        durationMinutes: template.durationMinutes,
        locationId: template.locationId,
        status: 'scheduled',
      },
    });

    return { template, instance };
  }

  async list(lat?: number, lng?: number, radiusKm = 10, userId?: string) {
    const radius = Math.min(radiusKm, MAX_RADIUS_KM);

    const templates = await this.prisma.questTemplate.findMany({
      include: {
        location: true,
        creator: true,
        instances: { include: { participants: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 100,
    });

    const blockedIds = userId
      ? (
          await this.prisma.block.findMany({
            where: { blockerId: userId },
            select: { blockedId: true },
          })
        ).map((b) => b.blockedId)
      : [];

    return templates
      .filter((t) => (lat && lng ? haversineKm(lat, lng, t.location.lat, t.location.lng) <= radius : true))
      .filter((t) => !blockedIds.includes(t.creatorId))
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        vibeTag: t.vibeTag,
        startTime: t.startTime,
        durationMinutes: t.durationMinutes,
        maxParticipants: t.maxParticipants,
        cost: t.cost,
        location: t.location,
        participantsCount: t.instances.reduce((acc, i) => acc + i.participants.length, 0),
      }));
  }

  async getById(id: string) {
    const template = await this.prisma.questTemplate.findUnique({
      where: { id },
      include: {
        location: true,
        creator: true,
        instances: { include: { participants: true } },
      },
    });
    if (!template) throw new NotFoundException('Quest not found');
    return template;
  }

  async join(templateId: string, userId: string) {
    const template = await this.prisma.questTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Quest not found');

    let instance = await this.prisma.questInstance.findFirst({
      where: { templateId, startTime: template.startTime },
      include: { participants: true },
    });
    if (!instance) {
      instance = await this.prisma.questInstance.create({
        data: {
          templateId,
          startTime: template.startTime,
          durationMinutes: template.durationMinutes,
          locationId: template.locationId,
          status: 'scheduled',
        },
        include: { participants: true },
      });
    }

    if (instance.participants.length >= template.maxParticipants) {
      throw new BadRequestException('Quest is full');
    }

    await this.prisma.questParticipant.upsert({
      where: { instanceId_userId: { instanceId: instance.id, userId } },
      update: {},
      create: { instanceId: instance.id, userId },
    });

    await this.notifications.create(userId, {
      type: 'quest_joined',
      title: 'Quest joined',
      body: `You're in for "${template.title}".`,
      data: { questId: template.id, instanceId: instance.id },
    });

    return { instanceId: instance.id };
  }

  async save(templateId: string, userId: string) {
    await this.prisma.save.upsert({
      where: { questId_userId: { questId: templateId, userId } },
      update: {},
      create: { questId: templateId, userId },
    });
    return { ok: true };
  }

  async redo(templateId: string, userId: string, dto: RedoQuestDto) {
    const template = await this.prisma.questTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Quest not found');

    const instance = await this.prisma.questInstance.create({
      data: {
        templateId,
        creatorId: userId,
        startTime: new Date(dto.startTime),
        durationMinutes: template.durationMinutes,
        locationId: template.locationId,
        status: 'scheduled',
      },
    });

    return instance;
  }
}
