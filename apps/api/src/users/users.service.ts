import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { tag: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      alias: user.alias,
      ageRange: user.ageRange,
      city: user.city,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      interests: user.interests.map((i) => i.tag),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        alias: dto.alias,
        ageRange: dto.ageRange,
        city: dto.city,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
      },
    });

    await this.prisma.userInterest.deleteMany({ where: { userId } });
    if (dto.interests?.length) {
      await this.prisma.userInterest.createMany({
        data: dto.interests.map((tagId) => ({ userId, tagId })),
        skipDuplicates: true,
      });
    }

    return this.getMe(user.id);
  }

  async listInterests() {
    return this.prisma.interestTag.findMany({ orderBy: { name: 'asc' } });
  }

  async listSaved(userId: string) {
    const saves = await this.prisma.save.findMany({
      where: { userId },
      include: { quest: { include: { location: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return saves.map((s) => s.quest);
  }

  async listJoined(userId: string) {
    const now = new Date();
    const participants = await this.prisma.questParticipant.findMany({
      where: { userId },
      include: {
        instance: {
          include: {
            template: { include: { location: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return participants
      .filter((p) => {
        const start = p.instance.startTime;
        const expire = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        return now <= expire;
      })
      .map((p) => ({
        instanceId: p.instanceId,
        quest: p.instance.template,
        startTime: p.instance.startTime,
        durationMinutes: p.instance.durationMinutes,
      }));
  }
}
