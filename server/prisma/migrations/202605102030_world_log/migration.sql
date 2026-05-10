CREATE TABLE "WorldLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "WorldLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorldLog_worldId_createdAt_idx" ON "WorldLog"("worldId", "createdAt");

CREATE INDEX "WorldLog_authorId_createdAt_idx" ON "WorldLog"("authorId", "createdAt");

ALTER TABLE "WorldLog"
ADD CONSTRAINT "WorldLog_worldId_fkey"
FOREIGN KEY ("worldId") REFERENCES "World"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorldLog"
ADD CONSTRAINT "WorldLog_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
