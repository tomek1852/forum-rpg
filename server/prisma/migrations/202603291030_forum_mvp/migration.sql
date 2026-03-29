CREATE TABLE "ForumCategory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastPostAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "quotePostId" TEXT,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ForumThread_categoryId_lastPostAt_idx" ON "ForumThread"("categoryId", "lastPostAt");
CREATE INDEX "ForumThread_authorId_idx" ON "ForumThread"("authorId");
CREATE INDEX "ForumPost_threadId_createdAt_idx" ON "ForumPost"("threadId", "createdAt");
CREATE INDEX "ForumPost_authorId_idx" ON "ForumPost"("authorId");
CREATE INDEX "ForumPost_quotePostId_idx" ON "ForumPost"("quotePostId");

ALTER TABLE "ForumThread"
ADD CONSTRAINT "ForumThread_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumThread"
ADD CONSTRAINT "ForumThread_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumPost"
ADD CONSTRAINT "ForumPost_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumPost"
ADD CONSTRAINT "ForumPost_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForumPost"
ADD CONSTRAINT "ForumPost_quotePostId_fkey"
FOREIGN KEY ("quotePostId") REFERENCES "ForumPost"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "ForumCategory" ("id", "title", "description", "color", "position", "createdAt", "updatedAt")
VALUES
  ('3b6651a3-c8d1-4d4b-8cb5-f4a9f74e3fd1', 'Ogloszenia', 'Informacje organizacyjne, zmiany i komunikaty dla graczy.', '#9d3d2d', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d77af6f7-b6f7-4ddf-9db5-26fb8a0b40f5', 'Kroniki swiata', 'Glowne watki fabularne, zapiski i os czasu wydarzen.', '#80552f', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('315d7728-e6d4-454f-a7d7-f06f303ac220', 'Tawerna', 'Rozmowy poza sesja, luzniejsze sceny i integracja spolecznosci.', '#4f6d5d', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
