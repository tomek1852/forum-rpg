CREATE TYPE "StatValueType" AS ENUM ('NUMBER', 'TEXT');

CREATE TABLE "World" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "World_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "valueType" "StatValueType" NOT NULL DEFAULT 'NUMBER',
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "defaultNumericValue" INTEGER,
    "defaultTextValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "worldId" TEXT NOT NULL,

    CONSTRAINT "StatDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharacterStatValue" (
    "id" TEXT NOT NULL,
    "numericValue" INTEGER,
    "textValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "characterId" TEXT NOT NULL,
    "statDefinitionId" TEXT NOT NULL,

    CONSTRAINT "CharacterStatValue_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Character"
ADD COLUMN "worldId" TEXT;

CREATE UNIQUE INDEX "World_slug_key" ON "World"("slug");
CREATE UNIQUE INDEX "StatDefinition_worldId_key_key" ON "StatDefinition"("worldId", "key");
CREATE INDEX "StatDefinition_worldId_position_idx" ON "StatDefinition"("worldId", "position");
CREATE UNIQUE INDEX "CharacterStatValue_characterId_statDefinitionId_key" ON "CharacterStatValue"("characterId", "statDefinitionId");
CREATE INDEX "CharacterStatValue_characterId_idx" ON "CharacterStatValue"("characterId");
CREATE INDEX "CharacterStatValue_statDefinitionId_idx" ON "CharacterStatValue"("statDefinitionId");
CREATE INDEX "Character_worldId_idx" ON "Character"("worldId");

ALTER TABLE "Character"
ADD CONSTRAINT "Character_worldId_fkey"
FOREIGN KEY ("worldId") REFERENCES "World"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StatDefinition"
ADD CONSTRAINT "StatDefinition_worldId_fkey"
FOREIGN KEY ("worldId") REFERENCES "World"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterStatValue"
ADD CONSTRAINT "CharacterStatValue_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "Character"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterStatValue"
ADD CONSTRAINT "CharacterStatValue_statDefinitionId_fkey"
FOREIGN KEY ("statDefinitionId") REFERENCES "StatDefinition"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
