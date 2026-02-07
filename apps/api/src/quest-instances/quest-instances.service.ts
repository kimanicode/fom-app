import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckinDto, CompleteDto, PostCreateDto, RatingDto } from './quest-instances.dto';
import { NotificationsService } from '../notifications/notifications.service';

const CHECKIN_RADIUS_METERS = 200;
const CHECKIN_WINDOW_MINUTES = 60;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class QuestInstancesService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async checkin(instanceId: string, userId: string, dto: CheckinDto) {
    const instance = await this.prisma.questInstance.findUnique({
      where: { id: instanceId },
      include: { location: true },
    });
    if (!instance) throw new NotFoundException('Quest instance not found');

    const participant = await this.prisma.questParticipant.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!participant) throw new BadRequestException('Join the quest first');

    const now = new Date();
    const windowStart = new Date(instance.startTime.getTime() - CHECKIN_WINDOW_MINUTES * 60 * 1000);
    const windowEnd = new Date(instance.startTime.getTime() + CHECKIN_WINDOW_MINUTES * 60 * 1000);
    if (now < windowStart || now > windowEnd) {
      throw new BadRequestException('Check-in outside allowed time window');
    }

    const distance = haversineMeters(dto.lat, dto.lng, instance.location.lat, instance.location.lng);
    if (distance > CHECKIN_RADIUS_METERS) {
      throw new BadRequestException('Check-in outside allowed radius');
    }

    return this.prisma.checkin.upsert({
      where: { instanceId_userId: { instanceId, userId } },
      update: { lat: dto.lat, lng: dto.lng },
      create: { instanceId, userId, lat: dto.lat, lng: dto.lng },
    });
  }

  async complete(instanceId: string, userId: string, _dto: CompleteDto) {
    const checkin = await this.prisma.checkin.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!checkin) throw new BadRequestException('Check-in required');

    const instance = await this.prisma.questInstance.update({
      where: { id: instanceId },
      data: { status: 'completed' },
    });

    await this.notifications.create(userId, {
      type: 'quest_completed',
      title: 'Quest completed',
      body: `You completed a quest. Post your story now.`,
      data: { instanceId },
    });

    return instance;
  }

  async createPost(instanceId: string, userId: string, dto: PostCreateDto) {
    const instance = await this.prisma.questInstance.findUnique({
      where: { id: instanceId },
      include: { location: true },
    });
    if (!instance) throw new NotFoundException('Quest instance not found');
    if (instance.status !== 'completed') throw new BadRequestException('Quest not completed');

    const checkin = await this.prisma.checkin.findUnique({
      where: { instanceId_userId: { instanceId, userId } },
    });
    if (!checkin) throw new BadRequestException('Check-in required');

    const post = await this.prisma.post.create({
      data: {
        instanceId,
        userId,
        locationId: instance.locationId,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        durationSeconds: dto.durationSeconds,
        caption: dto.caption,
      },
    });

    await this.notifications.create(userId, {
      type: 'story_posted',
      title: 'Story posted',
      body: 'Your quest story is live.',
      data: { instanceId, postId: post.id },
    });

    return post;
  }

  async rate(instanceId: string, userId: string, dto: RatingDto) {
    return this.prisma.rating.upsert({
      where: { instanceId_userId: { instanceId, userId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: { instanceId, userId, rating: dto.rating, comment: dto.comment },
    });
  }
}
