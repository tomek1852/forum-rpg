CREATE TYPE "SkillProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "NotificationType"
ADD VALUE IF NOT EXISTS 'SKILL_PROPOSAL_CREATED';

ALTER TYPE "NotificationType"
ADD VALUE IF NOT EXISTS 'SKILL_PROPOSAL_APPROVED';

ALTER TYPE "NotificationType"
ADD VALUE IF NOT EXISTS 'SKILL_PROPOSAL_REJECTED';

CREATE TABLE "SkillProposal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mechanics" TEXT,
    "costs" TEXT,
    "limitations" TEXT,
    "status" "SkillProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "SkillProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharacterSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mechanics" TEXT,
    "costs" TEXT,
    "limitations" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "approvedById" TEXT,
    "sourceProposalId" TEXT,

    CONSTRAINT "CharacterSkill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CharacterSkill_sourceProposalId_key" ON "CharacterSkill"("sourceProposalId");
CREATE INDEX "SkillProposal_characterId_status_createdAt_idx" ON "SkillProposal"("characterId", "status", "createdAt");
CREATE INDEX "SkillProposal_proposerId_status_createdAt_idx" ON "SkillProposal"("proposerId", "status", "createdAt");
CREATE INDEX "SkillProposal_reviewerId_idx" ON "SkillProposal"("reviewerId");
CREATE INDEX "CharacterSkill_characterId_grantedAt_idx" ON "CharacterSkill"("characterId", "grantedAt");
CREATE INDEX "CharacterSkill_approvedById_idx" ON "CharacterSkill"("approvedById");

ALTER TABLE "SkillProposal"
ADD CONSTRAINT "SkillProposal_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "Character"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillProposal"
ADD CONSTRAINT "SkillProposal_proposerId_fkey"
FOREIGN KEY ("proposerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillProposal"
ADD CONSTRAINT "SkillProposal_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharacterSkill"
ADD CONSTRAINT "CharacterSkill_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "Character"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterSkill"
ADD CONSTRAINT "CharacterSkill_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CharacterSkill"
ADD CONSTRAINT "CharacterSkill_sourceProposalId_fkey"
FOREIGN KEY ("sourceProposalId") REFERENCES "SkillProposal"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
