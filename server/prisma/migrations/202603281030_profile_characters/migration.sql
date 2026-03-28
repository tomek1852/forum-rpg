CREATE TYPE "AccountStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'BLOCKED');

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'GM';

ALTER TABLE "User"
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE TABLE "Character" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  "summary" TEXT,
  "biography" TEXT,
  "appearance" TEXT,
  "avatarUrl" TEXT,
  "statsJson" JSONB,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerId" TEXT NOT NULL,
  CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Character_ownerId_idx" ON "Character"("ownerId");

ALTER TABLE "Character"
  ADD CONSTRAINT "Character_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
