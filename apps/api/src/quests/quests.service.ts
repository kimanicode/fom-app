import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestDto, JoinQuestDto } from './quests.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { QuestEnrichmentService } from './quest-enrichment.service';

const MAX_RADIUS_KM = 50;
const MAX_RECOMMENDATIONS = 50;
const QUEST_EXPIRY_WINDOW_MS = 60 * 60 * 1000;

type QuestEnrichmentSource = {
  id: string;
  title: string;
  description: string;
  vibeTag: string;
  cost: string;
  costAmountCents: number;
  currency: string;
  location: {
    placeName: string;
    category?: string | null;
  };
};

type QuestContentUpdate = Partial<{
  title: string;
  description: string;
  vibeTag: string;
  cost: string;
  costAmountCents: number;
  currency: string;
}>;

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
  if (max <= 0) return 0;
  return Math.min(value / max, 1);
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function cosineSimilarity(left: Map<string, number>, right: Map<string, number>) {
  if (left.size === 0 || right.size === 0) return 0;

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const [, value] of left) {
    leftNorm += value * value;
  }

  for (const [, value] of right) {
    rightNorm += value * value;
  }

  const [small, large] = left.size < right.size ? [left, right] : [right, left];
  for (const [token, value] of small) {
    const other = large.get(token);
    if (other) dot += value * other;
  }

  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function toVector(tokens: string[]) {
  const vector = new Map<string, number>();
  for (const token of tokens) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
}

@Injectable()
export class QuestsService implements OnModuleInit {
  private platformFeeBps!: number;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private questEnrichment: QuestEnrichmentService,
  ) {}

  onModuleInit() {
    this.platformFeeBps = this.parsePlatformFeeBps();
  }

  private calculateMetadataQualityScore(dto: CreateQuestDto) {
    const signals = [
      dto.title.trim(),
      dto.description.trim(),
      dto.imageUrl,
      dto.location.placeName,
      dto.vibeTag,
      dto.costType ?? (dto.costAmountCents && dto.costAmountCents > 0 ? 'paid' : 'free'),
    ].filter(Boolean).length;

    return Number(Math.min(signals / 6, 1).toFixed(3));
  }

  private queueQuestEnrichment(template: QuestEnrichmentSource) {
    void this.questEnrichment.enrichQuest(template.id, {
      title: template.title,
      description: template.description,
      vibeTag: template.vibeTag,
      cost: template.cost,
      costAmountCents: template.costAmountCents,
      currency: template.currency,
      location: {
        placeName: template.location.placeName,
        category: template.location.category,
      },
    });
  }

  private shouldTriggerEnrichmentForUpdate(existing: QuestEnrichmentSource, updates: QuestContentUpdate) {
    if (updates.title !== undefined && updates.title !== existing.title) return true;
    if (updates.description !== undefined && updates.description !== existing.description) return true;
    if (updates.vibeTag !== undefined && updates.vibeTag !== existing.vibeTag) return true;

    const nextCost = updates.cost ?? existing.cost;
    const nextCostAmountCents = updates.costAmountCents ?? existing.costAmountCents;
    const nextCurrency = updates.currency ?? existing.currency;

    return (
      nextCost !== existing.cost ||
      nextCostAmountCents !== existing.costAmountCents ||
      nextCurrency !== existing.currency
    );
  }

  private parsePlatformFeeBps() {
    const raw = process.env.PLATFORM_FEE_BPS?.trim();
    if (!raw) {
      throw new Error('PLATFORM_FEE_BPS must be configured with a value between 0 and 10000.');
    }

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 10000) {
      throw new Error('PLATFORM_FEE_BPS must be a number between 0 and 10000.');
    }

    return value;
  }

  private getPlatformFeeBps() {
    if (this.platformFeeBps === undefined) {
      this.platformFeeBps = this.parsePlatformFeeBps();
    }
    return this.platformFeeBps;
  }

  async create(userId: string, dto: CreateQuestDto) {
    const costType = dto.costType ?? (dto.costAmountCents && dto.costAmountCents > 0 ? 'paid' : 'free');
    const amountCents = costType === 'paid' ? dto.costAmountCents ?? 0 : 0;
    if (costType === 'paid' && amountCents <= 0) {
      throw new BadRequestException('Paid quests must have an amount greater than 0.');
    }
    const currency = (dto.currency || 'KES').toUpperCase();
    const startTime = new Date(dto.startTime);
    const locationId = randomUUID();
    const templateId = randomUUID();
    const instanceId = randomUUID();
    const participantId = randomUUID();
    const metadataQualityScore = this.calculateMetadataQualityScore(dto);

    const operations: any[] = [
      this.prisma.location.create({
        data: {
          id: locationId,
          placeName: dto.location.placeName,
          lat: dto.location.lat,
          lng: dto.location.lng,
          category: dto.location.category,
        },
      }),
      this.prisma.questTemplate.create({
        data: {
          id: templateId,
          creatorId: userId,
          title: dto.title,
          description: dto.description,
          vibeTag: dto.vibeTag,
          imageUrl: dto.imageUrl,
          locationId,
          startTime,
          durationMinutes: dto.durationMinutes,
          maxParticipants: dto.maxParticipants,
          cost: costType,
          costAmountCents: amountCents,
          currency,
          intentTags: [],
          vibeTags: [dto.vibeTag],
          audienceTags: [],
          locationTags: [],
          timeTags: [],
          priceTag: costType === 'paid' ? 'midrange' : 'free',
          metadataQualityScore,
        },
      }),
      this.prisma.questInstance.create({
        data: {
          id: instanceId,
          templateId,
          creatorId: userId,
          startTime,
          durationMinutes: dto.durationMinutes,
          locationId,
          status: 'scheduled',
        },
      }),
      this.prisma.questParticipant.create({
        data: {
          id: participantId,
          instanceId,
          userId,
          role: 'creator',
        },
      }),
    ];

    await this.prisma.$transaction(operations);

    const [template, instance] = await Promise.all([
      this.prisma.questTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: { interestTags: { include: { tag: true } }, categoryTag: true, subcategoryTag: true, location: true },
      }),
      this.prisma.questInstance.findUniqueOrThrow({ where: { id: instanceId } }),
    ]);

    await this.notifications.create(userId, {
      type: 'quest_created',
      title: 'Quest created',
      body: `Your quest "${template.title}" is live.`,
      data: { questId: template.id },
    });

    this.queueQuestEnrichment({
      id: template.id,
      title: template.title,
      description: template.description,
      vibeTag: template.vibeTag,
      cost: template.cost,
      costAmountCents: template.costAmountCents,
      currency: template.currency,
      location: {
        placeName: template.location.placeName,
        category: template.location.category,
      },
    });

    return { template, instance };
  }

  async list(lat?: number, lng?: number, radiusKm = 10, userId?: string) {
    const radius = Math.min(radiusKm, MAX_RADIUS_KM);
    const activeQuestCutoff = new Date(Date.now() - QUEST_EXPIRY_WINDOW_MS);

    const templates = await this.prisma.questTemplate.findMany({
      where: {
        startTime: { gte: activeQuestCutoff },
      },
      include: {
        location: true,
        creator: true,
        saves: true,
        interestTags: { include: { tag: true } },
        categoryTag: true,
        subcategoryTag: true,
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
      .map((template) => {
        const t = template as typeof template & {
          enrichedCategory?: string | null;
          audienceType?: string | null;
          energyLevel?: string | null;
          indoorOutdoor?: string | null;
          enrichmentTags?: string[];
        };

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          vibeTag: t.vibeTag,
          createdAt: t.createdAt,
          startTime: t.startTime,
          durationMinutes: t.durationMinutes,
          maxParticipants: t.maxParticipants,
          cost: t.cost,
          costAmountCents: t.costAmountCents,
          currency: t.currency,
          category: t.categoryTag,
          subcategory: t.subcategoryTag,
          interestTags: t.interestTags.map((tag) => tag.tag),
          intentTags: t.intentTags,
          vibeTags: t.vibeTags.length ? t.vibeTags : [t.vibeTag],
          audienceTags: t.audienceTags,
          locationTags: t.locationTags,
          timeTags: t.timeTags,
          priceTag: t.priceTag,
          enrichedCategory: t.enrichedCategory ?? null,
          audienceType: t.audienceType ?? null,
          energyLevel: t.energyLevel ?? null,
          indoorOutdoor: t.indoorOutdoor ?? null,
          enrichmentTags: t.enrichmentTags ?? [],
          metadataQualityScore: t.metadataQualityScore,
          location: t.location,
          savesCount: t.saves.length,
          participantsCount: t.instances.reduce((acc, i) => acc + i.participants.length, 0),
        };
      });
  }

  async getById(id: string) {
    const template = await this.prisma.questTemplate.findUnique({
      where: { id },
      include: {
        location: true,
        creator: true,
        interestTags: { include: { tag: true } },
        categoryTag: true,
        subcategoryTag: true,
        instances: { include: { participants: true } },
      },
    });
    if (!template) throw new NotFoundException('Quest not found');
    return template;
  }

  async recommend(userId: string, lat?: number, lng?: number, take = 20) {
    const requestedTake = Number.isFinite(take) ? take : 20;
    const clampedTake = Math.min(Math.max(1, requestedTake), MAX_RECOMMENDATIONS);
    const activeQuestCutoff = new Date(Date.now() - QUEST_EXPIRY_WINDOW_MS);

    const [
      interests,
      saves,
      joinedParticipants,
      blocked,
      candidates,
      allSaves,
      allJoinedParticipants,
    ] = await Promise.all([
      this.prisma.userInterest.findMany({
        where: { userId },
        include: { tag: true },
      }),
      this.prisma.save.findMany({
        where: { userId },
        select: { questId: true },
      }),
      this.prisma.questParticipant.findMany({
        where: { userId },
        include: { instance: { select: { templateId: true } } },
      }),
      this.prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      this.prisma.questTemplate.findMany({
        where: { startTime: { gte: activeQuestCutoff } },
        include: {
          location: true,
          creator: true,
          saves: true,
          instances: { include: { participants: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 250,
      }),
      this.prisma.save.findMany({
        select: { userId: true, questId: true },
      }),
      this.prisma.questParticipant.findMany({
        where: { instance: { templateId: { not: null } } },
        include: { instance: { select: { templateId: true } } },
      }),
    ]);

    const blockedIds = new Set(blocked.map((item) => item.blockedId));
    const savedQuestIds = new Set(saves.map((item) => item.questId));
    const joinedQuestIds = new Set(
      joinedParticipants
        .map((item) => item.instance.templateId)
        .filter((templateId): templateId is string => Boolean(templateId)),
    );

    const userEventHistory = new Set([...savedQuestIds, ...joinedQuestIds]);

    const interestTokens = interests.flatMap((item) => tokenize(item.tag.name));
    const userVector = toVector(interestTokens);

    const interactionRows: Array<{ userId: string; questId: string }> = [];

    for (const row of allSaves) {
      interactionRows.push({ userId: row.userId, questId: row.questId });
    }

    for (const row of allJoinedParticipants) {
      if (row.instance.templateId) {
        interactionRows.push({ userId: row.userId, questId: row.instance.templateId });
      }
    }

    const questToUsers = new Map<string, Set<string>>();
    for (const row of interactionRows) {
      const users = questToUsers.get(row.questId) ?? new Set<string>();
      users.add(row.userId);
      questToUsers.set(row.questId, users);
    }

    const now = Date.now();
    const maxPopularity = Math.max(
      ...candidates.map(
        (quest) =>
          quest.saves.length +
          quest.instances.reduce((sum, instance) => sum + instance.participants.length, 0),
      ),
      1,
    );

    const scored = candidates
      .filter((quest) => !blockedIds.has(quest.creatorId))
      .filter((quest) => quest.creatorId !== userId)
      .filter((quest) => !joinedQuestIds.has(quest.id))
      .map((quest) => {
        const questTokens = tokenize(
          `${quest.title} ${quest.description} ${quest.vibeTag} ${quest.location.placeName} ${quest.location.category ?? ''}`,
        );
        const questVector = toVector(questTokens);
        const contentScore = cosineSimilarity(userVector, questVector);

        const collaborativeComponents: number[] = [];
        const questUsers = questToUsers.get(quest.id) ?? new Set<string>();
        for (const historyQuestId of userEventHistory) {
          const historyUsers = questToUsers.get(historyQuestId) ?? new Set<string>();
          if (historyUsers.size === 0 || questUsers.size === 0) continue;

          let sharedUsers = 0;
          const [smaller, larger] =
            historyUsers.size < questUsers.size
              ? [historyUsers, questUsers]
              : [questUsers, historyUsers];

          for (const uid of smaller) {
            if (larger.has(uid)) sharedUsers++;
          }

          if (sharedUsers > 0) {
            collaborativeComponents.push(sharedUsers / Math.sqrt(historyUsers.size * questUsers.size));
          }
        }

        const collaborativeScore =
          collaborativeComponents.length > 0
            ? collaborativeComponents.reduce((sum, value) => sum + value, 0) / collaborativeComponents.length
            : 0;

        const popularity =
          quest.saves.length +
          quest.instances.reduce((sum, instance) => sum + instance.participants.length, 0);
        const popularityScore = normalize(popularity, maxPopularity);
        const hoursUntilStart = Math.max((quest.startTime.getTime() - now) / (1000 * 60 * 60), 0);
        const recencyScore = normalize(1 / (1 + hoursUntilStart / 24), 1);
        const distanceScore =
          lat !== undefined && lng !== undefined
            ? normalize(1 / (1 + haversineKm(lat, lng, quest.location.lat, quest.location.lng)), 1)
            : 0;

        const hasLocation = lat !== undefined && lng !== undefined;
        const score = hasLocation
          ? 0.4 * contentScore + 0.3 * collaborativeScore + 0.1 * popularityScore + 0.1 * recencyScore + 0.1 * distanceScore
          : 0.5 * contentScore + 0.35 * collaborativeScore + 0.05 * popularityScore + 0.1 * recencyScore;

        return {
          score,
          quest,
          relevance: {
            content: Number(contentScore.toFixed(4)),
            collaborative: Number(collaborativeScore.toFixed(4)),
            popularity: Number(popularityScore.toFixed(4)),
            recency: Number(recencyScore.toFixed(4)),
            distance: Number(distanceScore.toFixed(4)),
          },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, clampedTake);

    return scored.map((item) => ({
      id: item.quest.id,
      title: item.quest.title,
      description: item.quest.description,
      vibeTag: item.quest.vibeTag,
      startTime: item.quest.startTime,
      durationMinutes: item.quest.durationMinutes,
      maxParticipants: item.quest.maxParticipants,
      cost: item.quest.cost,
      costAmountCents: item.quest.costAmountCents,
      currency: item.quest.currency,
      location: item.quest.location,
      creator: {
        id: item.quest.creator.id,
        name: item.quest.creator.name,
        alias: item.quest.creator.alias,
        avatarUrl: item.quest.creator.avatarUrl,
      },
      saved: savedQuestIds.has(item.quest.id),
      score: Number(item.score.toFixed(4)),
      relevance: item.relevance,
    }));
  }

  async join(templateId: string, userId: string, dto?: JoinQuestDto) {
    const [template, joiningUser] = await Promise.all([
      this.prisma.questTemplate.findUnique({ where: { id: templateId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, alias: true, name: true, email: true },
      }),
    ]);
    if (!template) throw new NotFoundException('Quest not found');
    if (!joiningUser) throw new NotFoundException('User not found');

    const activeQuestCutoff = new Date(Date.now() - QUEST_EXPIRY_WINDOW_MS);
    if (template.startTime < activeQuestCutoff) {
      throw new BadRequestException('This quest has expired and can no longer be joined.');
    }

    if (template.creatorId === userId) {
      throw new BadRequestException('Quest creators cannot join their own quest.');
    }

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

    const existingParticipant = await this.prisma.questParticipant.findUnique({
      where: { instanceId_userId: { instanceId: instance.id, userId } },
    });
    if (existingParticipant) {
      throw new ConflictException('You already joined this quest.');
    }

    if (instance.participants.length >= template.maxParticipants) {
      throw new BadRequestException('Quest is full');
    }

    const isPaidQuest = template.cost === 'paid' && template.costAmountCents > 0;
    if (isPaidQuest && template.creatorId !== userId) {
      if (!dto?.paymentMethod) {
        throw new BadRequestException('Payment method is required to join this paid quest.');
      }

      const feeBps = this.getPlatformFeeBps();
      const platformFeeCents = Math.max(0, Math.floor((template.costAmountCents * feeBps) / 10000));
      const creatorAmountCents = Math.max(0, template.costAmountCents - platformFeeCents);

      try {
        await this.prisma.$transaction(async (tx) => {
          const payment = await tx.paymentTransaction.create({
            data: {
              questId: template.id,
              questInstanceId: instance.id,
              payerId: userId,
              creatorId: template.creatorId,
              amountCents: template.costAmountCents,
              platformFeeCents,
              creatorAmountCents,
              currency: template.currency || 'KES',
              status: 'pending',
              paymentMethod: dto.paymentMethod,
            } as any,
          });

          await tx.questParticipant.create({
            data: { instanceId: instance.id, userId },
          });

          await tx.paymentTransaction.update({
            where: { id: payment.id },
            data: { status: 'captured' },
          });
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictException('Payment for this quest has already been recorded.');
          }
          if (error.code === 'P2003') {
            throw new BadRequestException('Unable to complete the payment for this quest.');
          }
        }
        throw error;
      }
    } else {
      await this.prisma.questParticipant.create({
        data: { instanceId: instance.id, userId },
      });
    }

    await this.prisma.userBehaviorSignal.create({
      data: {
        userId,
        questId: template.id,
        signalType: 'joined',
        strength: 1,
        context: { paymentRequired: isPaidQuest },
      },
    });

    if (isPaidQuest) {
      await this.prisma.userBehaviorSignal.create({
        data: {
          userId,
          questId: template.id,
          signalType: 'paid',
          strength: 1.2,
        },
      });
    }

    await this.notifications.create(userId, {
      type: 'quest_joined',
      title: 'Quest joined',
      body: `You're in for "${template.title}".`,
      data: { questId: template.id, instanceId: instance.id },
    });

    if (template.creatorId !== userId) {
      const joinerLabel =
        joiningUser.alias?.trim() ||
        joiningUser.name?.trim() ||
        joiningUser.email.split('@')[0] ||
        'Someone';

      await this.notifications.create(template.creatorId, {
        type: 'quest_participant_joined',
        title: 'New participant',
        body: `${joinerLabel} joined your quest "${template.title}".`,
        data: { questId: template.id, instanceId: instance.id, userId: joiningUser.id },
      });
    }

    return { instanceId: instance.id };
  }

  async save(templateId: string, userId: string) {
    const existing = await this.prisma.save.findUnique({
      where: { questId_userId: { questId: templateId, userId } },
    });
    if (existing) {
      await this.prisma.save.delete({ where: { id: existing.id } });
      await this.prisma.userBehaviorSignal.create({
        data: {
          userId,
          questId: templateId,
          signalType: 'dismissed',
          strength: 0.35,
        },
      });
      return { saved: false };
    }
    await this.prisma.save.create({ data: { questId: templateId, userId } });
    await this.prisma.userBehaviorSignal.create({
      data: {
        userId,
        questId: templateId,
        signalType: 'saved',
        strength: 0.8,
      },
    });
    return { saved: true };
  }
}
