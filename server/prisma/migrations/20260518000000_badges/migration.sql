-- CreateEnum
CREATE TYPE "BadgeCondition" AS ENUM ('FIRST_POST', 'FIRST_CHARACTER', 'EXP_100', 'EXP_500', 'EXP_1000', 'SKILL_APPROVED', 'EVENT_PARTICIPANT', 'CUSTOM');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BADGE_AWARDED';

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "condition" "BadgeCondition" NOT NULL,
    "threshold" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterBadge" (
    "id" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "characterId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedById" TEXT,

    CONSTRAINT "CharacterBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterBadge_characterId_badgeId_key" ON "CharacterBadge"("characterId", "badgeId");

-- CreateIndex
CREATE INDEX "CharacterBadge_characterId_idx" ON "CharacterBadge"("characterId");

-- CreateIndex
CREATE INDEX "CharacterBadge_badgeId_idx" ON "CharacterBadge"("badgeId");

-- AddForeignKey
ALTER TABLE "CharacterBadge" ADD CONSTRAINT "CharacterBadge_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterBadge" ADD CONSTRAINT "CharacterBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterBadge" ADD CONSTRAINT "CharacterBadge_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
