ALTER TABLE "Character"
ADD COLUMN "experiencePoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "heroPoints" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ProgressRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "expValue" INTEGER NOT NULL DEFAULT 0,
    "phValue" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressEntry" (
    "id" TEXT NOT NULL,
    "expDelta" INTEGER NOT NULL DEFAULT 0,
    "phDelta" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "characterId" TEXT NOT NULL,
    "grantedById" TEXT,
    "ruleId" TEXT,

    CONSTRAINT "ProgressEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgressRule_code_key" ON "ProgressRule"("code");
CREATE INDEX "ProgressEntry_characterId_createdAt_idx" ON "ProgressEntry"("characterId", "createdAt");
CREATE INDEX "ProgressEntry_grantedById_idx" ON "ProgressEntry"("grantedById");
CREATE INDEX "ProgressEntry_ruleId_idx" ON "ProgressEntry"("ruleId");

ALTER TABLE "ProgressEntry"
ADD CONSTRAINT "ProgressEntry_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "Character"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProgressEntry"
ADD CONSTRAINT "ProgressEntry_grantedById_fkey"
FOREIGN KEY ("grantedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProgressEntry"
ADD CONSTRAINT "ProgressEntry_ruleId_fkey"
FOREIGN KEY ("ruleId") REFERENCES "ProgressRule"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
