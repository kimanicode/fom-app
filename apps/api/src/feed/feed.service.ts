import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

function normalize(value: number, max: number) {
  if (max === 0) return 0;
  return Math.min(value / max, 1);
}

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getStories() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.post.findMany({
      where: { createdAt: { gte: since } },
      include: {
        user: true,
        location: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getFeed(userId?: string, lat?: number, lng?: number) {
    const interests = userId
      ? await this.prisma.userInterest.findMany({ where: { userId }, include: { tag: true } })
      : [];
    const interestNames = interests.map((i) => i.tag.name.toLowerCase());

    const blockedIds = userId
      ? (
          await this.prisma.block.findMany({
            where: { blockerId: userId },
            select: { blockedId: true },
          })
        ).map((b) => b.blockedId)
      : [];

    const quests = await this.prisma.questTemplate.findMany({
      include: {
        location: true,
        instances: true,
        saves: true,
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    });

    const posts = await this.prisma.post.findMany({
      include: {
        location: true,
        likes: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = Date.now();
    const maxQuestParticipants = Math.max(...quests.map((q) => q.maxParticipants), 1);
    const maxQuestInstances = Math.max(...quests.map((q) => q.instances.length), 1);
    const maxPostLikes = Math.max(...posts.map((p) => p.likes.length), 1);

    const scoredQuests = quests
      .filter((q) => !blockedIds.includes(q.creatorId))
      .map((q) => {
        const text = `${q.title} ${q.description}`.toLowerCase();
        const overlapCount = interestNames.filter((name) => text.includes(name)).length;
        const interestOverlap = normalize(overlapCount, Math.max(interestNames.length, 1));
        const distanceScore = lat && lng ? normalize(1 / (1 + haversineKm(lat, lng, q.location.lat, q.location.lng)), 1) : 0;
        const recencyScore = normalize(1 / (1 + Math.abs(q.startTime.getTime() - now) / (1000 * 60 * 60)), 1);
        const popularityScore = normalize(q.maxParticipants, maxQuestParticipants);
        const redoScore = normalize(q.instances.length, maxQuestInstances);

        const score = 0.3 * interestOverlap + 0.2 * distanceScore + 0.25 * recencyScore + 0.15 * popularityScore + 0.1 * redoScore;
        return { type: 'quest' as const, score, data: q };
      });

    const scoredPosts = posts
      .filter((p) => !blockedIds.includes(p.userId))
      .map((p) => {
        const distanceScore = lat && lng ? normalize(1 / (1 + haversineKm(lat, lng, p.location.lat, p.location.lng)), 1) : 0;
        const recencyScore = normalize(1 / (1 + (now - p.createdAt.getTime()) / (1000 * 60 * 60)), 1);
        const popularityScore = normalize(p.likes.length, maxPostLikes) * 0.2;
        const score = 0.35 * distanceScore + 0.45 * recencyScore + 0.2 * popularityScore;
        return { type: 'post' as const, score, data: p };
      });

    const merged = [...scoredQuests, ...scoredPosts].sort((a, b) => b.score - a.score);
    return merged.slice(0, 50);
  }
}
