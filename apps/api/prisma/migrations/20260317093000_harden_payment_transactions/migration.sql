ALTER TABLE "PaymentTransaction"
ADD COLUMN "questInstanceId" TEXT;

UPDATE "PaymentTransaction" pt
SET "questInstanceId" = qi."id"
FROM "QuestInstance" qi
WHERE qi."templateId" = pt."questId"
  AND pt."questInstanceId" IS NULL;

ALTER TABLE "PaymentTransaction"
ALTER COLUMN "questInstanceId" SET NOT NULL;

ALTER TABLE "PaymentTransaction"
ADD CONSTRAINT "PaymentTransaction_questInstanceId_fkey"
FOREIGN KEY ("questInstanceId") REFERENCES "QuestInstance"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PaymentTransaction_questInstanceId_payerId_key"
ON "PaymentTransaction"("questInstanceId", "payerId");
