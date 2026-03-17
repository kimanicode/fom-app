DO $$
BEGIN
  CREATE TYPE "InterestLevel" AS ENUM ('category', 'subcategory', 'interest');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "InterestSource" AS ENUM ('explicit', 'inferred');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BehaviorSignalType" AS ENUM ('viewed', 'saved', 'joined', 'paid', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "InterestTag"
ALTER COLUMN "level" TYPE "InterestLevel"
USING CASE
  WHEN "level" IS NULL THEN NULL
  ELSE "level"::"InterestLevel"
END;

ALTER TABLE "UserInterest"
ALTER COLUMN "source" DROP DEFAULT;

ALTER TABLE "UserInterest"
ALTER COLUMN "source" TYPE "InterestSource"
USING "source"::"InterestSource";

ALTER TABLE "UserInterest"
ALTER COLUMN "source" SET DEFAULT 'explicit';

ALTER TABLE "UserBehaviorSignal"
ALTER COLUMN "signalType" TYPE "BehaviorSignalType"
USING "signalType"::"BehaviorSignalType";
