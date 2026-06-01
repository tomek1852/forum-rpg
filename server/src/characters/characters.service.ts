import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Character, Prisma, SkillProposalStatus, StatValueType } from "@prisma/client";
import { ActivityLogService } from "../activity-log/activity-log.service";
import { PrismaService } from "../prisma/prisma.service";
import { AddProgressDto } from "./dto/add-progress.dto";
import { CharacterRankingQueryDto } from "./dto/character-ranking-query.dto";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { CharacterStatValueInputDto } from "./dto/character-stat-value-input.dto";
import { UpdateCharacterDto } from "./dto/update-character.dto";

const characterInclude = {
  world: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  statValues: {
    include: {
      statDefinition: true,
    },
  },
  skills: {
    orderBy: [{ grantedAt: "desc" }],
  },
  skillProposals: {
    include: {
      proposer: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  },
} satisfies Prisma.CharacterInclude;

const progressEntryInclude = {
  grantedBy: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
  rule: true,
} satisfies Prisma.ProgressEntryInclude;

@Injectable()
export class CharactersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ActivityLogService) private readonly activityLog: ActivityLogService,
  ) {}

  async create(ownerId: string, dto: CreateCharacterDto) {
    const preparedStats = await this.prepareStatValues(dto.worldId, dto.statValues);

    const createdCharacter = await this.prisma.character.create({
      data: {
        ...this.mapCreateInput(ownerId, dto),
        worldId: dto.worldId,
        statsJson: preparedStats.statsJson,
        statValues: {
          create: preparedStats.createInputs,
        },
      },
    });

    const character = await this.prisma.character.findUniqueOrThrow({
      where: { id: createdCharacter.id },
      include: characterInclude,
    });

    return {
      character: this.serializeCharacter(character, {
        includeProposals: true,
      }),
    };
  }

  async listMine(ownerId: string) {
    const characters = await this.prisma.character.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      include: characterInclude,
    });

    return {
      characters: characters.map((character) =>
        this.serializeCharacter(character, { includeProposals: true }),
      ),
    };
  }

  async listByOwner(ownerId: string) {
    const characters = await this.prisma.character.findMany({
      where: {
        ownerId,
        isPublic: true,
      },
      orderBy: { updatedAt: "desc" },
      include: characterInclude,
    });

    return {
      characters: characters.map((character) =>
        this.serializeCharacter(character, { includeProposals: false }),
      ),
    };
  }

  async listRankings(query: CharacterRankingQueryDto = {}) {
    const characters = await this.prisma.character.findMany({
      where: {
        isPublic: true,
        ...(query.worldId ? { worldId: query.worldId } : {}),
      },
      select: {
        id: true,
        name: true,
        experiencePoints: true,
        heroPoints: true,
        world: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ experiencePoints: "desc" }, { heroPoints: "desc" }, { name: "asc" }],
    });

    return {
      rankings: characters.map((character, index) => ({
        position: index + 1,
        characterId: character.id,
        name: character.name,
        world: character.world,
        experiencePoints: character.experiencePoints,
        heroPoints: character.heroPoints,
      })),
    };
  }

  async getById(characterId: string, requesterId?: string, requesterRole?: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: characterInclude,
    });

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    const canManageProgress = this.canManageProgress(requesterRole);

    if (!character.isPublic && character.ownerId !== requesterId && !canManageProgress) {
      throw new ForbiddenException("Ta postac nie jest publiczna.");
    }

    const includeProposals = character.ownerId === requesterId || canManageProgress;

    return {
      character: this.serializeCharacter(character, {
        includeProposals,
      }),
    };
  }

  async update(characterId: string, ownerId: string, dto: UpdateCharacterDto) {
    const character = await this.assertOwnership(characterId, ownerId);
    const nextWorldId = dto.worldId ?? character.worldId;
    const shouldRefreshStats = Boolean(dto.worldId || dto.statValues);

    if (!nextWorldId) {
      throw new BadRequestException("Wybierz swiat postaci.");
    }

    const preparedStats = shouldRefreshStats
      ? await this.prepareStatValues(nextWorldId, dto.statValues)
      : null;

    const updatedCharacter = await this.prisma.character.update({
      where: { id: character.id },
      data: {
        ...this.mapUpdateInput(dto),
        ...(dto.worldId ? { worldId: dto.worldId } : {}),
        ...(preparedStats
          ? {
              statsJson: preparedStats.statsJson,
              statValues: {
                deleteMany: {},
                create: preparedStats.createInputs,
              },
            }
          : {}),
      },
      include: characterInclude,
    });

    return {
      character: this.serializeCharacter(updatedCharacter, {
        includeProposals: true,
      }),
    };
  }

  async grantProgress(
    characterId: string,
    grantor: { userId: string; role?: string },
    dto: AddProgressDto,
  ) {
    if (!this.canManageProgress(grantor.role)) {
      throw new ForbiddenException("Tylko MG lub administrator moze przyznawac progres.");
    }

    const rule = dto.ruleId
      ? await this.prisma.progressRule.findUnique({
          where: { id: dto.ruleId },
        })
      : null;

    if (dto.ruleId && (!rule || !rule.isActive)) {
      throw new BadRequestException("Wybrana regula progresu nie istnieje lub jest nieaktywna.");
    }

    const expDelta = dto.expDelta ?? rule?.expValue ?? 0;
    const phDelta = dto.phDelta ?? rule?.phValue ?? 0;
    const reason = dto.reason?.trim() || rule?.label?.trim();
    const note = dto.note?.trim() || null;

    if (expDelta <= 0 && phDelta <= 0) {
      throw new BadRequestException("Przyznaj co najmniej 1 punkt EXP lub PH.");
    }

    if (!reason) {
      throw new BadRequestException("Podaj powod przyznania progresu.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.findUnique({
        where: { id: characterId },
        select: { id: true },
      });

      if (!character) {
        throw new NotFoundException("Nie znaleziono postaci.");
      }

      const entry = await tx.progressEntry.create({
        data: {
          characterId: character.id,
          grantedById: grantor.userId,
          ruleId: rule?.id ?? null,
          expDelta,
          phDelta,
          reason,
          note,
        },
        include: progressEntryInclude,
      });

      const updatedCharacter = await tx.character.update({
        where: { id: character.id },
        data: {
          experiencePoints: { increment: expDelta },
          heroPoints: { increment: phDelta },
        },
        include: characterInclude,
      });

      return { entry, character: updatedCharacter };
    });

    await this.activityLog.log(
      grantor.userId,
      "character.grant_progress",
      "character",
      characterId,
      { expDelta, phDelta, reason },
    );

    return {
      message: "Progres zostal przyznany.",
      entry: result.entry,
      character: this.serializeCharacter(result.character, {
        includeProposals: true,
      }),
    };
  }

  async listProgressHistory(
    characterId: string,
    requester: { userId: string; role?: string },
  ) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    if (character.ownerId !== requester.userId && !this.canManageProgress(requester.role)) {
      throw new ForbiddenException("Historia progresu jest dostepna tylko dla wlasciciela, MG i admina.");
    }

    const entries = await this.prisma.progressEntry.findMany({
      where: { characterId },
      include: progressEntryInclude,
      orderBy: { createdAt: "desc" },
    });

    return { entries };
  }

  private canManageProgress(role?: string) {
    return role === "GM" || role === "ADMIN";
  }

  private async assertOwnership(characterId: string, ownerId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    if (character.ownerId !== ownerId) {
      throw new ForbiddenException("Mozesz edytowac tylko swoje postacie.");
    }

    return character;
  }

  private mapCreateInput(ownerId: string, dto: CreateCharacterDto) {
    return {
      ownerId,
      name: dto.name.trim(),
      title: dto.title?.trim() || null,
      summary: dto.summary?.trim() || null,
      biography: dto.biography?.trim() || null,
      appearance: dto.appearance?.trim() || null,
      avatarUrl: dto.avatarUrl?.trim() || null,
      isPublic: dto.isPublic ?? true,
    };
  }

  private mapUpdateInput(dto: UpdateCharacterDto) {
    return {
      name: dto.name?.trim(),
      title: dto.title?.trim() || null,
      summary: dto.summary?.trim() || null,
      biography: dto.biography?.trim() || null,
      appearance: dto.appearance?.trim() || null,
      avatarUrl: dto.avatarUrl?.trim() || null,
      isPublic: dto.isPublic,
    } satisfies Partial<Character>;
  }

  private async prepareStatValues(
    worldId: string,
    inputs: CharacterStatValueInputDto[] | undefined,
  ) {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      include: {
        statDefinitions: {
          where: { isActive: true },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!world || !world.isActive) {
      throw new BadRequestException("Wybierz istniejacy swiat dla postaci.");
    }

    const inputMap = new Map(inputs?.map((item) => [item.statDefinitionId, item]) ?? []);
    const createInputs: Prisma.CharacterStatValueCreateWithoutCharacterInput[] = [];
    const statsJson: Record<string, string | number> = {};

    for (const input of inputs ?? []) {
      if (!world.statDefinitions.some((definition) => definition.id === input.statDefinitionId)) {
        throw new BadRequestException("Jedna ze statystyk nie nalezy do wybranego swiata.");
      }
    }

    for (const definition of world.statDefinitions) {
      const input = inputMap.get(definition.id);

      if (definition.valueType === StatValueType.NUMBER) {
        const numericValue = input?.numericValue ?? definition.defaultNumericValue ?? null;

        if (numericValue === null) {
          if (definition.isRequired) {
            throw new BadRequestException(
              `Statystyka "${definition.label}" jest wymagana dla tej postaci.`,
            );
          }

          continue;
        }

        if (definition.minValue !== null && numericValue < definition.minValue) {
          throw new BadRequestException(
            `Statystyka "${definition.label}" nie moze byc mniejsza niz ${definition.minValue}.`,
          );
        }

        if (definition.maxValue !== null && numericValue > definition.maxValue) {
          throw new BadRequestException(
            `Statystyka "${definition.label}" nie moze byc wieksza niz ${definition.maxValue}.`,
          );
        }

        createInputs.push({
          numericValue,
          statDefinition: {
            connect: { id: definition.id },
          },
        });
        statsJson[definition.key] = numericValue;
        continue;
      }

      const textValue = (input?.textValue ?? definition.defaultTextValue ?? "").trim();

      if (!textValue) {
        if (definition.isRequired) {
          throw new BadRequestException(
            `Statystyka "${definition.label}" jest wymagana dla tej postaci.`,
          );
        }

        continue;
      }

      createInputs.push({
        textValue,
        statDefinition: {
          connect: { id: definition.id },
        },
      });
      statsJson[definition.key] = textValue;
    }

    return { createInputs, statsJson };
  }

  private sortStatValues<T extends { statValues?: Array<{ statDefinition: { position: number; label: string } }> }>(
    character: T,
  ) {
    if (!character.statValues) {
      return character;
    }

    return {
      ...character,
      statValues: [...character.statValues].sort((left, right) => {
        if (left.statDefinition.position === right.statDefinition.position) {
          return left.statDefinition.label.localeCompare(right.statDefinition.label, "pl");
        }

        return left.statDefinition.position - right.statDefinition.position;
      }),
    };
  }

  private serializeCharacter<
    T extends {
      statValues?: Array<{ statDefinition: { position: number; label: string } }>;
      skills?: Array<{ grantedAt: Date | string }>;
      skillProposals?: Array<{ status: SkillProposalStatus; createdAt: Date | string }>;
    },
  >(character: T, options: { includeProposals: boolean }) {
    const withSortedStats = this.sortStatValues(character);
    const skills = [...(withSortedStats.skills ?? [])].sort((left, right) =>
      String(right.grantedAt).localeCompare(String(left.grantedAt)),
    );
    const visibleProposals = options.includeProposals
      ? [...(withSortedStats.skillProposals ?? [])].sort((left, right) =>
          String(right.createdAt).localeCompare(String(left.createdAt)),
        )
      : [];

    return {
      ...withSortedStats,
      skills,
      skillProposals: visibleProposals,
    };
  }
}
