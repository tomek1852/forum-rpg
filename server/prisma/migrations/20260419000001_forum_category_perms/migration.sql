ALTER TABLE "ForumCategory" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ForumCategory" ADD COLUMN "allowedRoles" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "ForumCategory" ADD COLUMN "createdById" TEXT;

ALTER TABLE "ForumCategory"
ADD CONSTRAINT "ForumCategory_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
