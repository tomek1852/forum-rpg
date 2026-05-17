-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('ONLINE', 'AWAY', 'OFFLINE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "presenceStatus" "PresenceStatus" NOT NULL DEFAULT 'OFFLINE';
