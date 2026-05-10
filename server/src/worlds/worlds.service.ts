import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, StatValueType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStatDefinitionDto } from "./dto/create-stat-definition.dto";
import { CreateWorldDto } from "./dto/create-world.dto";

const worldInclude = {
  statDefinitions: {
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.WorldInclude;

@Injectable()
export class WorldsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listWorlds() {
    const worlds = await this.prisma.world.findMany({
      where: { isActive: true },
      include: worldInclude,
      orderBy: [{ name: "asc" }],
    });

    return { worlds };
  }

  async getWorld(worldId: string) {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      include: worldInclude,
    });

    if (!world || !world.isActive) {
      throw new NotFoundException("Nie znaleziono swiata.");
    }

    return { world };
  }

  async createWorld(dto: CreateWorldDto) {
    const slug = this.normalizeSlug(dto.slug || dto.name);

    try {
      const world = await this.prisma.world.create({
        data: {
          name: dto.name.trim(),
          slug,
          summary: dto.summary?.trim() || null,
          description: dto.description?.trim() || null,
        },
        include: worldInclude,
      });

      return {
        message: "Swiat zostal utworzony.",
        world,
      };
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        throw new ConflictException("Swiat z taka nazwa techniczna juz istnieje.");
      }

      throw error;
    }
  }

  async createStatDefinition(worldId: string, dto: CreateStatDefinitionDto) {
    const world = await this.prisma.world.findUnique({
      where: { id: worldId },
      select: { id: true, isActive: true },
    });

    if (!world || !world.isActive) {
      throw new NotFoundException("Nie znaleziono swiata.");
    }

    this.assertDefinitionConstraints(dto);

    try {
      const statDefinition = await this.prisma.statDefinition.create({
        data: {
          worldId,
          key: dto.key.trim().toLowerCase(),
          label: dto.label.trim(),
          description: dto.description?.trim() || null,
          valueType: dto.valueType ?? StatValueType.NUMBER,
          minValue: dto.minValue ?? null,
          maxValue: dto.maxValue ?? null,
          defaultNumericValue: dto.defaultNumericValue ?? null,
          defaultTextValue: dto.defaultTextValue?.trim() || null,
          isRequired: dto.isRequired ?? false,
          isActive: dto.isActive ?? true,
          position: dto.position ?? 0,
        },
      });

      return {
        message: "Statystyka zostala dodana do swiata.",
        statDefinition,
      };
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        throw new ConflictException("W tym swiecie istnieje juz statystyka o takim kluczu.");
      }

      throw error;
    }
  }

  private normalizeSlug(input: string) {
    const slug = input
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    if (!slug) {
      throw new BadRequestException("Nie udalo sie wygenerowac poprawnego sluga swiata.");
    }

    return slug;
  }

  private assertDefinitionConstraints(dto: CreateStatDefinitionDto) {
    const valueType = dto.valueType ?? StatValueType.NUMBER;

    if (dto.minValue !== undefined && dto.maxValue !== undefined && dto.minValue > dto.maxValue) {
      throw new BadRequestException("Minimalna wartosc nie moze byc wieksza od maksymalnej.");
    }

    if (valueType === StatValueType.NUMBER) {
      if (dto.defaultTextValue) {
        throw new BadRequestException("Statystyka liczbowa nie moze miec domyslnej wartosci tekstowej.");
      }

      if (
        dto.defaultNumericValue !== undefined &&
        dto.minValue !== undefined &&
        dto.defaultNumericValue < dto.minValue
      ) {
        throw new BadRequestException("Domyslna wartosc jest mniejsza od minimum.");
      }

      if (
        dto.defaultNumericValue !== undefined &&
        dto.maxValue !== undefined &&
        dto.defaultNumericValue > dto.maxValue
      ) {
        throw new BadRequestException("Domyslna wartosc jest wieksza od maksimum.");
      }

      return;
    }

    if (dto.minValue !== undefined || dto.maxValue !== undefined || dto.defaultNumericValue !== undefined) {
      throw new BadRequestException("Statystyka tekstowa nie moze miec ograniczen liczbowych.");
    }
  }

  private isUniqueConstraint(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
