import { z } from 'zod';

export const interestTagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(32),
});

export const userProfileSchema = z.object({
  name: z.string().min(2).max(64),
  alias: z.string().min(2).max(32).optional(),
  ageRange: z.enum(['18-24', '25-34', '35-44', '45-54', '55+']),
  interests: z.array(z.string().uuid()).min(1),
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
  vibeTag: z.enum(['chill', 'active', 'creative', 'curious']),
  location: locationSchema,
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(360),
  maxParticipants: z.number().int().min(1).max(50),
  cost: z.literal('free').default('free'),
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
export type CheckinInput = z.infer<typeof checkinSchema>;
export type CompleteInput = z.infer<typeof completeSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
