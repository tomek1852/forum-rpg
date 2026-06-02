import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CombatStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCombatDto } from "./dto/create-combat.dto";
import { SetInitiativeDto } from "./dto/set-initiative.dto";
import { ListCombatQueryDto } from "./dto/list-combat-query.dto";

const HP_FALLBACK = 100;
const HP_STAT_KEYS = ["hp", "HP", "zdrowie"];

const participantInclude = {
  character: { select: { id: true, name: true, avatarUrl: true, ownerId: true } },
  effects: true,
} as const;

const encounterInclude = {
  participants: { include: participantInclude, orderBy: { turnOrder: "asc" as const } },
  gm: { select: { id: true, username: true, displayName: true } },
} as const;

@Injectable()
export class CombatService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async resolveMaxHp(characterId: string): Promise<number> {
    const statValues = await this.prisma.characterStatValue.findMany({
      where: { characterId },
      include: { statDefinition: true },
    });

    const hpEntry = statValues.find((sv) =>
      HP_STAT_KEYS.includes(sv.statDefinition.key.toLowerCase()),
    );

    return hpEntry?.numericValue ?? HP_FALLBACK;
  }

  async create(gmId: string, dto: CreateCombatDto) {
    const world = await this.prisma.world.findUnique({ where: { id: dto.worldId } });
    if (!world) throw new NotFoundException("Świat nie istnieje.");

    const characters = await this.prisma.character.findMany({
      where: { id: { in: dto.characterIds } },
    });

    if (characters.length !== dto.characterIds.length) {
      throw new BadRequestException("Niektóre postacie nie istnieją.");
    }

    const encounter = await this.prisma.combatEncounter.create({
      data: {
        title: dto.title,
        worldId: dto.worldId,
        gmId,
        participants: {
          create: await Promise.all(
            dto.characterIds.map(async (characterId) => {
              const maxHp = await this.resolveMaxHp(characterId);
              return { characterId, hp: maxHp, maxHp };
            }),
          ),
        },
      },
      include: encounterInclude,
    });

    return { encounter };
  }

  async setInitiative(gmId: string, encounterId: string, dto: SetInitiativeDto) {
    const encounter = await this.getEncounterOrThrow(encounterId);
    this.assertGm(encounter, gmId);

    for (const entry of dto.entries) {
      await this.prisma.combatParticipant.updateMany({
        where: { encounterId, characterId: entry.characterId },
        data: { initiative: entry.initiative },
      });
    }

    const sorted = await this.prisma.combatParticipant.findMany({
      where: { encounterId },
      orderBy: { initiative: "desc" },
    });

    for (let i = 0; i < sorted.length; i++) {
      await this.prisma.combatParticipant.update({
        where: { id: sorted[i].id },
        data: { turnOrder: i + 1 },
      });
    }

    return this.getById(encounterId);
  }

  async start(gmId: string, encounterId: string) {
    const encounter = await this.getEncounterOrThrow(encounterId);
    this.assertGm(encounter, gmId);

    if (encounter.status !== CombatStatus.PREPARING) {
      throw new BadRequestException("Starcie nie jest w fazie przygotowania.");
    }

    const updated = await this.prisma.combatEncounter.update({
      where: { id: encounterId },
      data: { status: CombatStatus.ACTIVE, roundNumber: 1 },
      include: encounterInclude,
    });

    return { encounter: updated };
  }

  async list(query: ListCombatQueryDto) {
    const encounters = await this.prisma.combatEncounter.findMany({
      where: {
        ...(query.worldId ? { worldId: query.worldId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        gm: { select: { id: true, username: true, displayName: true } },
        _count: { select: { participants: true } },
      },
    });

    return { encounters };
  }

  async getById(encounterId: string) {
    const encounter = await this.prisma.combatEncounter.findUnique({
      where: { id: encounterId },
      include: encounterInclude,
    });

    if (!encounter) throw new NotFoundException("Starcie nie istnieje.");
    return { encounter };
  }

  private async getEncounterOrThrow(encounterId: string) {
    const encounter = await this.prisma.combatEncounter.findUnique({
      where: { id: encounterId },
    });
    if (!encounter) throw new NotFoundException("Starcie nie istnieje.");
    return encounter;
  }

  private assertGm(encounter: { gmId: string }, userId: string) {
    if (encounter.gmId !== userId) {
      throw new ForbiddenException("Tylko GM może zarządzać tym starciem.");
    }
  }
}
