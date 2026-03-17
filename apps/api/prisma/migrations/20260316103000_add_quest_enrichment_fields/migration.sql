ALTER TABLE "QuestTemplate"
ADD COLUMN "enrichedCategory" TEXT,
ADD COLUMN "audienceType" TEXT,
ADD COLUMN "energyLevel" TEXT,
ADD COLUMN "indoorOutdoor" TEXT,
ADD COLUMN "enrichmentTags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
