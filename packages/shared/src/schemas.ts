import { z } from 'zod';

export const interestTagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(32),
  slug: z.string().min(2).optional(),
  group: z.string().optional(),
  level: z.enum(['category', 'subcategory', 'interest']).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const taxonomyNodeSchema: z.ZodType<{
  id?: string;
  name: string;
  slug?: string;
  group?: string;
  level?: 'category' | 'subcategory' | 'interest' | null;
  children?: any[];
}> = z.lazy(() =>
  z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2).max(64),
    slug: z.string().min(2).optional(),
    group: z.string().optional(),
    level: z.enum(['category', 'subcategory', 'interest']).nullable().optional(),
    children: z.array(taxonomyNodeSchema).default([]),
  }),
);

export const taxonomyResponseSchema = z.object({
  interestTree: z.array(taxonomyNodeSchema),
  groups: z.record(z.array(interestTagSchema)),
  defaults: z.object({
    suggestedCategorySlugs: z.array(z.string()),
  }),
});

export const userProfileSchema = z.object({
  name: z.string().min(2).max(64),
  alias: z.string().min(2).max(32).optional(),
  ageRange: z.enum(['18-24', '25-34', '35-44', '45-54', '55+']),
  interests: z.array(z.string().uuid()).default([]),
  selectedCategoryIds: z.array(z.string().uuid()).default([]),
  selectedSubcategoryIds: z.array(z.string().uuid()).default([]),
  selectedInterestIds: z.array(z.string().uuid()).default([]),
  intentTags: z.array(z.string()).default([]),
  vibePreferences: z.array(z.string()).default([]),
  audienceAffinities: z.array(z.string()).default([]),
  locationPreferences: z.array(z.string()).default([]),
  timePreferences: z.array(z.string()).default([]),
  pricePreferences: z.array(z.string()).default([]),
  city: z.string().min(2).max(64),
  bio: z.string().max(240).optional(),
  avatarUrl: z.string().url().optional(),
});

export const locationSchema = z.object({
  placeName: z.string().min(2).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.string().min(2).max(64).optional(),
});

export const questCreateSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().min(10).max(600),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  interestIds: z.array(z.string().uuid()).default([]),
  intentTags: z.array(z.string()).default([]),
  vibeTags: z.array(z.string()).default([]),
  audienceTags: z.array(z.string()).default([]),
  locationTags: z.array(z.string()).default([]),
  timeTags: z.array(z.string()).default([]),
  priceTag: z.string().optional(),
  vibeTag: z.enum(['chill', 'active', 'creative', 'curious']),
  location: locationSchema,
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(360),
  maxParticipants: z.number().int().min(1).max(50),
  cost: z.literal('free').default('free'),
});

export const recommendationBreakdownSchema = z.object({
  explicitInterest: z.number(),
  inferredInterest: z.number(),
  intent: z.number(),
  vibe: z.number(),
  audience: z.number(),
  location: z.number(),
  time: z.number(),
  price: z.number(),
  freshness: z.number(),
  quality: z.number(),
  diversityPenalty: z.number(),
  duplicatePenalty: z.number(),
  total: z.number(),
});

export const recommendationEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  score: z.number(),
  scoreBreakdown: recommendationBreakdownSchema,
  explanation: z.array(z.string()),
});

export const questRedoSchema = z.object({
  startTime: z.string().datetime(),
});

export const checkinSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timestamp: z.string().datetime().optional(),
});

export const completeSchema = z.object({
  timestamp: z.string().datetime().optional(),
});

export const postCreateSchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(['photo', 'video']),
  durationSeconds: z.number().int().min(15).max(60).optional(),
  caption: z.string().max(240).optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(['user', 'quest', 'post']),
  targetId: z.string().uuid(),
  reason: z.string().min(4).max(240),
});

export const blockSchema = z.object({
  blockedId: z.string().uuid(),
});

export const feedQuerySchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(1).max(200).optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type QuestCreateInput = z.infer<typeof questCreateSchema>;
export type TaxonomyResponse = z.infer<typeof taxonomyResponseSchema>;
export type RecommendationEvent = z.infer<typeof recommendationEventSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type CompleteInput = z.infer<typeof completeSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
