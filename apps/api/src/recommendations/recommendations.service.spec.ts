import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  let prisma: any;
  let service: RecommendationsService;

  beforeEach(() => {
    prisma = {
      userPreferenceProfile: { findUnique: jest.fn() },
      userInterest: { findMany: jest.fn() },
      block: { findMany: jest.fn() },
      save: { findMany: jest.fn() },
      questParticipant: { findMany: jest.fn() },
      questTemplate: { findMany: jest.fn() },
    };
    service = new RecommendationsService(prisma);
  });

  function makeQuest(overrides: Record<string, any> = {}) {
    return {
      id: 'quest-1',
      title: 'Sunrise Hike',
      description: 'Beautiful morning hike',
      creatorId: 'creator-1',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      vibeTag: 'active',
      vibeTags: ['active'],
      intentTags: [],
      audienceTags: [],
      locationTags: [],
      timeTags: [],
      priceTag: 'free',
      metadataQualityScore: 0.5,
      categoryId: 'cat-1',
      subcategoryId: null,
      cost: 'free',
      costAmountCents: 0,
      currency: 'KES',
      location: {
        lat: -1.286,
        lng: 36.817,
        placeName: 'Nairobi',
        category: 'outdoors',
      },
      creator: {
        id: 'creator-1',
        name: 'Creator',
        alias: 'creator',
        avatarUrl: null,
      },
      saves: [],
      instances: [],
      interestTags: [],
      categoryTag: null,
      subcategoryTag: null,
      ...overrides,
    };
  }

  function primeBaseMocks(overrides: Record<string, any> = {}) {
    prisma.userPreferenceProfile.findUnique.mockResolvedValue(overrides.profile ?? null);
    prisma.userInterest.findMany.mockResolvedValue(overrides.interests ?? []);
    prisma.block.findMany.mockResolvedValue(overrides.blocked ?? []);
    prisma.save.findMany
      .mockResolvedValueOnce(overrides.saved ?? [])
      .mockResolvedValueOnce(overrides.allSaves ?? []);
    prisma.questParticipant.findMany
      .mockResolvedValueOnce(overrides.joined ?? [])
      .mockResolvedValueOnce(overrides.allJoined ?? []);
    prisma.questTemplate.findMany.mockResolvedValue(overrides.quests ?? []);
  }

  it('scores a quest with matching category/tags higher than one with no overlap', async () => {
    primeBaseMocks({
      profile: {
        userId: 'user-1',
        selectedCategoryIds: ['cat-1'],
        selectedSubcategoryIds: [],
        selectedInterestIds: ['interest-1'],
        intentTags: [],
        vibePreferences: ['active'],
        audienceAffinities: [],
        locationPreferences: [],
        timePreferences: [],
        pricePreferences: ['free'],
      },
      interests: [{ tagId: 'interest-1', source: 'explicit', weight: 1, tag: { name: 'Hiking' } }],
      quests: [
        makeQuest({
          id: 'match',
          title: 'Hiking with friends',
          categoryId: 'cat-1',
          interestTags: [{ tagId: 'interest-1', tag: { id: 'interest-1', name: 'Hiking' } }],
        }),
        makeQuest({
          id: 'no-match',
          title: 'Indoor chess',
          categoryId: 'cat-2',
          vibeTag: 'chill',
          vibeTags: ['chill'],
          interestTags: [{ tagId: 'interest-2', tag: { id: 'interest-2', name: 'Chess' } }],
        }),
      ],
    });

    const results = await service.getRecommendedQuests('user-1');

    expect(results[0].id).toBe('match');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('returns a valid list when the user has no preference profile', async () => {
    primeBaseMocks({
      profile: null,
      interests: [],
      quests: [
        makeQuest({ id: 'quest-a' }),
        makeQuest({ id: 'quest-b', title: 'Coffee walk', creatorId: 'creator-2', creator: { id: 'creator-2', name: 'B', alias: 'b', avatarUrl: null } }),
      ],
    });

    const results = await service.getRecommendedQuests('user-1');

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        score: expect.any(Number),
      }),
    );
  });

  it('uses current enriched audience and vibe fields in scoring', async () => {
    primeBaseMocks({
      profile: {
        userId: 'user-1',
        selectedCategoryIds: [],
        selectedSubcategoryIds: [],
        selectedInterestIds: [],
        intentTags: [],
        vibePreferences: ['creative'],
        audienceAffinities: ['friends'],
        locationPreferences: [],
        timePreferences: [],
        pricePreferences: [],
      },
      interests: [],
      quests: [
        makeQuest({
          id: 'aligned',
          vibeTag: 'creative',
          vibeTags: ['creative'],
          audienceTags: ['friends'],
        }),
        makeQuest({
          id: 'unaligned',
          title: 'Other quest',
          creatorId: 'creator-2',
          creator: { id: 'creator-2', name: 'Other', alias: 'other', avatarUrl: null },
          vibeTag: 'active',
          vibeTags: ['active'],
          audienceTags: ['professionals'],
        }),
      ],
    });

    const results = await service.getRecommendedQuests('user-1');

    expect(results[0].id).toBe('aligned');
    expect(results[0].scoreBreakdown.vibe).toBeGreaterThan(results[1].scoreBreakdown.vibe);
    expect(results[0].scoreBreakdown.audience).toBeGreaterThan(results[1].scoreBreakdown.audience);
  });
});
