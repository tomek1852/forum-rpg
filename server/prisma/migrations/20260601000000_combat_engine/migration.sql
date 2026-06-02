-- CreateEnum
CREATE TYPE "CombatStatus" AS ENUM ('PREPARING', 'ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CombatActionType" AS ENUM ('ATTACK', 'DEFEND', 'SKILL', 'ITEM', 'PASS');

-- CreateEnum
CREATE TYPE "CharacterConditionType" AS ENUM ('POISONED', 'STUNNED', 'BURNING', 'BLESSED', 'CURSED', 'CUSTOM');

-- CreateTable
CREATE TABLE "CombatEncounter" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CombatStatus" NOT NULL DEFAULT 'PREPARING',
    "roundNumber" INTEGER NOT NULL DEFAULT 0,
    "gmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CombatEncounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatParticipant" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "initiative" INTEGER,
    "hp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "turnOrder" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatAction" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionType" "CombatActionType" NOT NULL,
    "targetId" TEXT,
    "description" TEXT,
    "rollResult" INTEGER,
    "damage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombatAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatEffect" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "appliedAt" INTEGER NOT NULL,
    "sourceActionId" TEXT,

    CONSTRAINT "CombatEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterCondition" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "condition" "CharacterConditionType" NOT NULL,
    "label" TEXT,
    "encounterId" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CombatEncounter_worldId_status_createdAt_idx" ON "CombatEncounter"("worldId", "status", "createdAt");
CREATE INDEX "CombatEncounter_gmId_createdAt_idx" ON "CombatEncounter"("gmId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CombatParticipant_encounterId_characterId_key" ON "CombatParticipant"("encounterId", "characterId");
CREATE INDEX "CombatParticipant_encounterId_turnOrder_idx" ON "CombatParticipant"("encounterId", "turnOrder");

-- CreateIndex
CREATE INDEX "CombatAction_encounterId_roundNumber_createdAt_idx" ON "CombatAction"("encounterId", "roundNumber", "createdAt");
CREATE INDEX "CombatAction_actorId_createdAt_idx" ON "CombatAction"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "CombatEffect_participantId_idx" ON "CombatEffect"("participantId");

-- CreateIndex
CREATE INDEX "CharacterCondition_characterId_condition_idx" ON "CharacterCondition"("characterId", "condition");
CREATE INDEX "CharacterCondition_encounterId_idx" ON "CharacterCondition"("encounterId");

-- AddForeignKey
ALTER TABLE "CombatEncounter" ADD CONSTRAINT "CombatEncounter_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CombatEncounter" ADD CONSTRAINT "CombatEncounter_gmId_fkey" FOREIGN KEY ("gmId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatParticipant" ADD CONSTRAINT "CombatParticipant_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "CombatEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CombatParticipant" ADD CONSTRAINT "CombatParticipant_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "CombatEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatEffect" ADD CONSTRAINT "CombatEffect_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "CombatParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CombatEffect" ADD CONSTRAINT "CombatEffect_sourceActionId_fkey" FOREIGN KEY ("sourceActionId") REFERENCES "CombatAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCondition" ADD CONSTRAINT "CharacterCondition_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
