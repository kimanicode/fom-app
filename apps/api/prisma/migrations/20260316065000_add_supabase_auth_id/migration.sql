ALTER TABLE "User"
ADD COLUMN "supabaseAuthId" TEXT;

UPDATE "User"
SET "supabaseAuthId" = "id"
WHERE "supabaseAuthId" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "supabaseAuthId" SET NOT NULL;

CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");
