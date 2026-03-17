import { Injectable } from '@nestjs/common';
import { BehaviorSignalType, InterestSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendedQuestResult, RecommendationScoreBreakdown } from './recommendations.types';

const QUEST_EXPIRY_WINDOW_MS = 60 * 60 * 1000;

function normalize(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(value / max, 1);
}

function overlap(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const count = left.filter((value) => rightSet.has(value)).length;
  return count / Math.max(left.length, right.length);
}

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

function inferTimeTag(date: Date) {
  const hour = date.getHours();
  if (hour < 9) return 'early_morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'late_night';
}

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async trackBehavior(userId: string, questId: string, signalType: BehaviorSignalType, strength = 1, context?: Record<string, unknown>) {
    await this.prisma.userBehaviorSignal.create({
      data: {
        userId,
        questId,
        signalType,
        strength,
        context: context as Prisma.InputJsonValue | undefined,
      },
    });

    const quest = await this.prisma.questTemplate.findUnique({
      where: { id: questId },
      include: { interestTags: true, categoryTag: true, subcategoryTag: true },
    });

    if (!quest) return { tracked: true };

    const interestIds = new Set<string>(quest.interestTags.map((tag) => tag.tagId));
    if (quest.categoryId) interestIds.add(quest.categoryId);
    if (quest.subcategoryId) interestIds.add(quest.subcategoryId);

    if (interestIds.size > 0) {
      const behaviorWeight = signalType === 'dismissed' ? -0.35 : signalType === 'viewed' ? 0.2 : signalType === 'saved' ? 0.8 : signalType === 'joined' ? 1 : 1.2;
      for (const tagId of interestIds) {
        await this.prisma.userInterest.upsert({
          where: { userId_tagId: { userId, tagId } },
          update: {
            weight: { increment: behaviorWeight * strength },
            source: InterestSource.inferred,
          },
          create: {
            userId,
            tagId,
            weight: Math.max(0.1, behaviorWeight * strength),
            source: InterestSource.inferred,
          },
        });
      }
    }

    return { tracked: true };
  }

  async getRecommendedQuests(userId: string, lat?: number, lng?: number, take = 20): Promise<RecommendedQuestResult[]> {
    const activeQuestCutoff = new Date(Date.now() - QUEST_EXPIRY_WINDOW_MS);
    const [profile, interests, blocked, saved, joined, quests] = await Promise.all([
      this.prisma.userPreferenceProfile.findUnique({ where: { userId } }),
      this.prisma.userInterest.findMany({ where: { userId }, include: { tag: true } }),
      this.prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
      this.prisma.save.findMany({ where: { userId }, select: { questId: true } }),
      this.prisma.questParticipant.findMany({ where: { userId }, include: { instance: { select: { templateId: true } } } }),
      this.prisma.questTemplate.findMany({
        where: { startTime: { gte: activeQuestCutoff } },
        include: {
          location: true,
          creator: true,
          saves: true,
          instances: { include: { participants: true } },
          interestTags: { include: { tag: true } },
          categoryTag: true,
          subcategoryTag: true,
        },
        orderBy: { startTime: 'asc' },
        take: 250,
      }),
    ]);

    const blockedIds = new Set(blocked.map((item) => item.blockedId));
    const excludedQuestIds = new Set([
      ...saved.map((item) => item.questId),
      ...joined.map((item) => item.instance.templateId).filter((id): id is string => Boolean(id)),
    ]);

    const explicitInterestIds = interests.filter((item) => item.source === 'explicit').map((item) => item.tagId);
    const inferredInterestIds = interests.filter((item) => item.source === 'inferred' || item.weight > 1).map((item) => item.tagId);
    const profileCategories = profile?.selectedCategoryIds ?? [];
    const profileSubcategories = profile?.selectedSubcategoryIds ?? [];
    const profileInterests = profile?.selectedInterestIds ?? explicitInterestIds;

    const maxPopularity = Math.max(
      1,
      ...quests.map((quest) => quest.saves.length + quest.instances.reduce((sum, instance) => sum + instance.participants.length, 0)),
    );

    const scored = quests
      .filter((quest) => !blockedIds.has(quest.creatorId))
      .filter((quest) => !excludedQuestIds.has(quest.id))
      .map((item) => {
        const quest = item as typeof item & {
          enrichedCategory?: string | null;
          audienceType?: string | null;
          energyLevel?: string | null;
          indoorOutdoor?: string | null;
          enrichmentTags?: string[];
        };
        const questInterestIds = quest.interestTags.map((tag) => tag.tagId);
        if (quest.categoryId) questInterestIds.push(quest.categoryId);
        if (quest.subcategoryId) questInterestIds.push(quest.subcategoryId);

        const explicitInterest = Math.max(
          overlap(profileInterests, questInterestIds),
          overlap(profileCategories, quest.categoryId ? [quest.categoryId] : []),
          overlap(profileSubcategories, quest.subcategoryId ? [quest.subcategoryId] : []),
        );
        const inferredInterest = overlap(inferredInterestIds, questInterestIds);
        const intent = overlap(profile?.intentTags ?? [], quest.intentTags);
        const vibe = overlap(profile?.vibePreferences ?? [], quest.vibeTags.length ? quest.vibeTags : [quest.vibeTag]);
        const audience = Math.max(
          overlap(profile?.audienceAffinities ?? [], quest.audienceTags),
          overlap(profile?.audienceAffinities ?? [], quest.audienceType ? [quest.audienceType] : []),
        );
        const locationMatch = Math.max(
          overlap(profile?.locationPreferences ?? [], quest.locationTags),
          overlap(profile?.locationPreferences ?? [], quest.indoorOutdoor ? [quest.indoorOutdoor] : []),
        );
        const proximity =
          lat !== undefined && lng !== undefined
            ? normalize(1 / (1 + haversineKm(lat, lng, quest.location.lat, quest.location.lng)), 1)
            : 0;
        const location = Math.max(locationMatch, proximity);
        const derivedTimeTag = inferTimeTag(quest.startTime);
        const time = Math.max(overlap(profile?.timePreferences ?? [], quest.timeTags), overlap(profile?.timePreferences ?? [], [derivedTimeTag]));
        const price = overlap(profile?.pricePreferences ?? [], quest.priceTag ? [quest.priceTag] : [quest.cost === 'paid' ? 'midrange' : 'free']);
        const enrichmentInterest = Math.max(
          overlap(profileInterests, quest.enrichmentTags ?? []),
          overlap(profileCategories, quest.enrichedCategory ? [quest.enrichedCategory] : []),
        );
        const freshness = normalize(1 / (1 + Math.max((Date.now() - quest.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0)), 1);
        const quality = normalize(
          quest.metadataQualityScore +
            quest.saves.length +
            quest.instances.reduce((sum, instance) => sum + instance.participants.length, 0),
          maxPopularity + 1,
        );

        const totalBeforeRerank =
          explicitInterest * 0.25 +
          enrichmentInterest * 0.1 +
          inferredInterest * 0.12 +
          intent * 0.12 +
          vibe * 0.08 +
          audience * 0.06 +
          location * 0.15 +
          time * 0.08 +
          price * 0.05 +
          freshness * 0.04 +
          quality * 0.05;

        const breakdown: RecommendationScoreBreakdown = {
          explicitInterest,
          inferredInterest,
          intent,
          vibe,
          audience,
          location,
          time,
          price,
          freshness,
          quality,
          diversityPenalty: 0,
          duplicatePenalty: 0,
          total: totalBeforeRerank,
        };

        breakdown.total = Number((breakdown.total || 0).toFixed(6));

        return {
          quest,
          breakdown,
          explanation: [
            explicitInterest > 0 ? 'Matches your selected interests.' : '',
            enrichmentInterest > 0 ? 'Aligned with inferred quest metadata.' : '',
            inferredInterest > 0 ? 'Aligned with interests inferred from your activity.' : '',
            location > 0.4 ? 'Close to your preferred area.' : '',
            time > 0.2 ? 'Fits your usual time preferences.' : '',
            quality > 0.35 ? 'Strong event quality and engagement signals.' : '',
          ].filter(Boolean),
        };
      })
      .sort((left, right) => right.breakdown.total - left.breakdown.total);

    const selected: typeof scored = [];
    const seenCategoryIds = new Map<string, number>();
    const seenKeys = new Set<string>();

    for (const entry of scored) {
      if (selected.length >= take) break;
      const categoryKey = entry.quest.categoryId || entry.quest.subcategoryId || 'uncategorized';
      const duplicateKey = `${entry.quest.title.toLowerCase()}::${entry.quest.location.placeName.toLowerCase()}`;
      if (seenKeys.has(duplicateKey)) {
        entry.breakdown.duplicatePenalty = 0.08;
        entry.breakdown.total -= entry.breakdown.duplicatePenalty;
        continue;
      }
      const seenCount = seenCategoryIds.get(categoryKey) ?? 0;
      if (seenCount >= 2) {
        entry.breakdown.diversityPenalty = 0.05 * seenCount;
        entry.breakdown.total -= entry.breakdown.diversityPenalty;
      }
      seenKeys.add(duplicateKey);
      seenCategoryIds.set(categoryKey, seenCount + 1);
      selected.push(entry);
    }

    return selected
      .sort((left, right) => right.breakdown.total - left.breakdown.total)
      .map((entry) => ({
        id: entry.quest.id,
        title: entry.quest.title,
        description: entry.quest.description,
        score: Number(entry.breakdown.total.toFixed(4)),
        scoreBreakdown: {
          ...entry.breakdown,
          total: Number(entry.breakdown.total.toFixed(4)),
        },
        explanation: entry.explanation,
      }));
  }
}
