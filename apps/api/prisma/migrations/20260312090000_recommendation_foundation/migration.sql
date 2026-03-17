-- Extend InterestTag into a nested taxonomy and generalized tag catalog.
ALTER TABLE "InterestTag"
ADD COLUMN "slug" TEXT,
ADD COLUMN "group" TEXT NOT NULL DEFAULT 'interest',
ADD COLUMN "level" TEXT,
ADD COLUMN "parentId" TEXT,
ADD COLUMN "metadata" JSONB;

UPDATE "InterestTag"
SET "slug" = lower(replace("name", ' ', '-'))
WHERE "slug" IS NULL;

ALTER TABLE "InterestTag"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "InterestTag_slug_key" ON "InterestTag"("slug");
CREATE UNIQUE INDEX "InterestTag_group_name_parentId_key" ON "InterestTag"("group", "name", "parentId");
ALTER TABLE "InterestTag" ADD CONSTRAINT "InterestTag_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "InterestTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserInterest"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'explicit',
ADD COLUMN "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "QuestTemplate"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "subcategoryId" TEXT,
ADD COLUMN "intentTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "vibeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "audienceTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "locationTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "timeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "priceTag" TEXT,
ADD COLUMN "metadataQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "QuestTemplate" ADD CONSTRAINT "QuestTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InterestTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuestTemplate" ADD CONSTRAINT "QuestTemplate_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "InterestTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "QuestInterest" (
  "id" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL DEFAULT 'creator',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestInterest_questId_tagId_key" ON "QuestInterest"("questId", "tagId");
CREATE INDEX "QuestInterest_tagId_questId_idx" ON "QuestInterest"("tagId", "questId");
ALTER TABLE "QuestInterest" ADD CONSTRAINT "QuestInterest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "QuestTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestInterest" ADD CONSTRAINT "QuestInterest_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "InterestTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserPreferenceProfile" (
  "userId" TEXT NOT NULL,
  "selectedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "selectedSubcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "selectedInterestIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "intentTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "vibePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "audienceAffinities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "locationPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "timePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "pricePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPreferenceProfile_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserPreferenceProfile" ADD CONSTRAINT "UserPreferenceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserBehaviorSignal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT,
  "signalType" TEXT NOT NULL,
  "strength" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBehaviorSignal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserBehaviorSignal_userId_createdAt_idx" ON "UserBehaviorSignal"("userId", "createdAt");
CREATE INDEX "UserBehaviorSignal_questId_signalType_idx" ON "UserBehaviorSignal"("questId", "signalType");
ALTER TABLE "UserBehaviorSignal" ADD CONSTRAINT "UserBehaviorSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBehaviorSignal" ADD CONSTRAINT "UserBehaviorSignal_questId_fkey" FOREIGN KEY ("questId") REFERENCES "QuestTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
