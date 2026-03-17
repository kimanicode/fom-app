import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithdrawalDto, UpdateProfileDto } from './users.dto';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
const ACTIVE_QUEST_WINDOW_MS = 60 * 60 * 1000;
const MIN_WITHDRAWAL_AMOUNT_CENTS = 10000;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private taxonomy: TaxonomyService) {}

  isProfileComplete(profile: {
    avatarUrl?: string | null;
    bio?: string | null;
    interests?: Array<unknown> | null;
  }) {
    return Boolean(
      profile.avatarUrl?.trim() &&
      profile.bio?.trim() &&
      (profile.interests?.length ?? 0) > 0,
    );
  }

  async findOrCreateUser(params: {
    supabaseAuthId: string;
    email?: string;
    name?: string;
    alias?: string;
    avatarUrl?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseAuthId: params.supabaseAuthId },
    });
    if (existing) return existing;

    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    return this.prisma.user.create({
      data: {
        supabaseAuthId: params.supabaseAuthId,
        email: params.email?.trim().toLowerCase() || `${params.supabaseAuthId}@supabase.local`,
        passwordHash,
        name: params.name?.trim() || null,
        alias: params.alias?.trim() || params.name?.trim() || null,
        avatarUrl: params.avatarUrl?.trim() || null,
      },
    });
  }

  private emptyWalletSnapshot() {
    return {
      currency: 'KES',
      totalEarnedCents: 0,
      pendingWithdrawalCents: 0,
      totalWithdrawnCents: 0,
      withdrawableCents: 0,
    };
  }

  private isPrismaConnectivityError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: unknown }).code;
    return code === 'P1001' || code === 'P1002' || code === 'P1017';
  }

  private async getWalletSnapshot(userId: string) {
    try {
      const [captured, pendingWithdrawals, paidWithdrawals] = await Promise.all([
        this.prisma.paymentTransaction.aggregate({
          where: { creatorId: userId, status: 'captured' },
          _sum: { creatorAmountCents: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: { creatorId: userId, status: 'pending' },
          _sum: { amountCents: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: { creatorId: userId, status: 'paid' },
          _sum: { amountCents: true },
        }),
      ]);

      const totalEarnedCents = captured._sum.creatorAmountCents ?? 0;
      const pendingWithdrawalCents = pendingWithdrawals._sum.amountCents ?? 0;
      const totalWithdrawnCents = paidWithdrawals._sum.amountCents ?? 0;
      const withdrawableCents = Math.max(totalEarnedCents - pendingWithdrawalCents - totalWithdrawnCents, 0);

      return {
        currency: 'KES',
        totalEarnedCents,
        pendingWithdrawalCents,
        totalWithdrawnCents,
        withdrawableCents,
      };
    } catch (error) {
      if (this.isPrismaConnectivityError(error)) {
        // Keep user/profile endpoints functional when DB connectivity briefly flakes.
        return this.emptyWalletSnapshot();
      }
      throw error;
    }
  }

  private async getProfileStats(userId: string) {
    const activeQuestCutoff = new Date(Date.now() - ACTIVE_QUEST_WINDOW_MS);
    const [completedQuestsCount, activeQuestsCount, ratings] = await Promise.all([
      this.prisma.questParticipant.count({
        where: {
          userId,
          instance: { status: 'completed' },
        },
      }),
      this.prisma.questParticipant.count({
        where: {
          userId,
          instance: {
            status: { not: 'completed' },
            startTime: { gte: activeQuestCutoff },
          },
        },
      }),
      this.prisma.rating.aggregate({
        where: {
          instance: {
            template: {
              creatorId: userId,
            },
          },
        },
        _avg: { rating: true },
      }),
    ]);

    return {
      completedQuestsCount,
      activeQuestsCount,
      averageRating: Number((ratings._avg.rating ?? 0).toFixed(1)),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: { include: { tag: true } },
        preferenceProfile: true,
      },
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
      selectedCategoryIds: user.preferenceProfile?.selectedCategoryIds ?? [],
      selectedSubcategoryIds: user.preferenceProfile?.selectedSubcategoryIds ?? [],
      selectedInterestIds: user.preferenceProfile?.selectedInterestIds ?? user.interests.map((i) => i.tagId),
      intentTags: user.preferenceProfile?.intentTags ?? [],
      vibePreferences: user.preferenceProfile?.vibePreferences ?? [],
      audienceAffinities: user.preferenceProfile?.audienceAffinities ?? [],
      locationPreferences: user.preferenceProfile?.locationPreferences ?? [],
      timePreferences: user.preferenceProfile?.timePreferences ?? [],
      pricePreferences: user.preferenceProfile?.pricePreferences ?? [],
      stats: await this.getProfileStats(user.id),
      creatorWallet: await this.getWalletSnapshot(user.id),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existingProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferenceProfile: true,
        interests: {
          where: { source: 'explicit' },
          select: { tagId: true },
        },
      },
    });

    if (!existingProfile) throw new NotFoundException('User not found');

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

    const selectedCategoryIds = dto.selectedCategoryIds ?? existingProfile.preferenceProfile?.selectedCategoryIds ?? [];
    const selectedSubcategoryIds =
      dto.selectedSubcategoryIds ?? existingProfile.preferenceProfile?.selectedSubcategoryIds ?? [];
    const selectedInterestIds =
      dto.selectedInterestIds ??
      dto.interests ??
      existingProfile.preferenceProfile?.selectedInterestIds ??
      existingProfile.interests.map((interest) => interest.tagId);
    const intentTags = dto.intentTags ?? existingProfile.preferenceProfile?.intentTags ?? [];
    const vibePreferences = dto.vibePreferences ?? existingProfile.preferenceProfile?.vibePreferences ?? [];
    const audienceAffinities = dto.audienceAffinities ?? existingProfile.preferenceProfile?.audienceAffinities ?? [];
    const locationPreferences = dto.locationPreferences ?? existingProfile.preferenceProfile?.locationPreferences ?? [];
    const timePreferences = dto.timePreferences ?? existingProfile.preferenceProfile?.timePreferences ?? [];
    const pricePreferences = dto.pricePreferences ?? existingProfile.preferenceProfile?.pricePreferences ?? [];

    await this.prisma.userInterest.deleteMany({ where: { userId, source: 'explicit' } });
    if (selectedInterestIds.length) {
      await this.prisma.userInterest.createMany({
        data: selectedInterestIds.map((tagId) => ({ userId, tagId, source: 'explicit', weight: 1 })),
        skipDuplicates: true,
      });
    }

    await this.prisma.userPreferenceProfile.upsert({
      where: { userId },
      update: {
        selectedCategoryIds,
        selectedSubcategoryIds,
        selectedInterestIds,
        intentTags,
        vibePreferences,
        audienceAffinities,
        locationPreferences,
        timePreferences,
        pricePreferences,
      },
      create: {
        userId,
        selectedCategoryIds,
        selectedSubcategoryIds,
        selectedInterestIds,
        intentTags,
        vibePreferences,
        audienceAffinities,
        locationPreferences,
        timePreferences,
        pricePreferences,
      },
    });

    return this.getMe(user.id);
  }

  async listInterests() {
    return this.taxonomy.listLeafInterests();
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

  async listCreated(userId: string) {
    const created = await this.prisma.questTemplate.findMany({
      where: { creatorId: userId },
      include: {
        location: true,
        instances: {
          include: {
            participants: true,
          },
        },
        payments: {
          where: { status: 'captured' },
          select: { id: true, payerId: true, amountCents: true, creatorAmountCents: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return created.map((quest) => {
      const joinedCount = quest.instances.reduce((acc, instance) => acc + instance.participants.length, 0);
      const uniquePaidUsers = new Set(quest.payments.map((p) => p.payerId));
      const paidCount = uniquePaidUsers.size;
      const paidAmountCents = quest.payments.reduce((acc, payment) => acc + payment.amountCents, 0);
      const creatorEarningsCents = quest.payments.reduce((acc, payment) => acc + payment.creatorAmountCents, 0);

      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        imageUrl: quest.imageUrl,
        vibeTag: quest.vibeTag,
        startTime: quest.startTime,
        maxParticipants: quest.maxParticipants,
        cost: quest.cost,
        costAmountCents: quest.costAmountCents,
        currency: quest.currency || 'KES',
        location: quest.location,
        metadata: {
          joinedCount,
          paidCount,
          paidAmountCents,
          creatorEarningsCents,
        },
      };
    });
  }

  async getWallet(userId: string) {
    try {
      const wallet = await this.getWalletSnapshot(userId);
      const recentWithdrawals = await this.prisma.withdrawalRequest.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      return { ...wallet, recentWithdrawals };
    } catch (error) {
      if (this.isPrismaConnectivityError(error)) {
        return { ...this.emptyWalletSnapshot(), recentWithdrawals: [] };
      }
      throw error;
    }
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    if (dto.amountCents < MIN_WITHDRAWAL_AMOUNT_CENTS) {
      throw new BadRequestException('Minimum withdrawal amount is KSh 100.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const [captured, pendingWithdrawals, paidWithdrawals] = await Promise.all([
        tx.paymentTransaction.aggregate({
          where: { creatorId: userId, status: 'captured' },
          _sum: { creatorAmountCents: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: { creatorId: userId, status: 'pending' },
          _sum: { amountCents: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: { creatorId: userId, status: 'paid' },
          _sum: { amountCents: true },
        }),
      ]);

      const totalEarnedCents = captured._sum.creatorAmountCents ?? 0;
      const pendingWithdrawalCents = pendingWithdrawals._sum.amountCents ?? 0;
      const totalWithdrawnCents = paidWithdrawals._sum.amountCents ?? 0;
      const withdrawableCents = Math.max(totalEarnedCents - pendingWithdrawalCents - totalWithdrawnCents, 0);

      if (dto.amountCents > withdrawableCents) {
        throw new BadRequestException('Insufficient creator balance for this withdrawal request.');
      }

      const request = await tx.withdrawalRequest.create({
        data: {
          creatorId: userId,
          amountCents: dto.amountCents,
          destination: dto.destination,
          currency: 'KES',
          status: 'pending',
        },
      });

      return { request };
    });

    return {
      request: result.request,
      wallet: await this.getWalletSnapshot(userId),
    };
  }
}
