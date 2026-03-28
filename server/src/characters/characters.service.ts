import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Character } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateCharacterDto } from "./dto/update-character.dto";

@Injectable()
export class CharactersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateCharacterDto) {
    const character = await this.prisma.character.create({
      data: this.mapCreateInput(ownerId, dto),
    });

    return { character };
  }

  async listMine(ownerId: string) {
    const characters = await this.prisma.character.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });

    return { characters };
  }

  async listByOwner(ownerId: string) {
    const characters = await this.prisma.character.findMany({
      where: {
        ownerId,
        isPublic: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return { characters };
  }

  async getById(characterId: string, requesterId?: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    if (!character.isPublic && character.ownerId !== requesterId) {
      throw new ForbiddenException("Ta postac nie jest publiczna.");
    }

    return { character };
  }

  async update(characterId: string, ownerId: string, dto: UpdateCharacterDto) {
    const character = await this.assertOwnership(characterId, ownerId);
    const updatedCharacter = await this.prisma.character.update({
      where: { id: character.id },
      data: this.mapUpdateInput(dto),
    });

    return { character: updatedCharacter };
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
      statsJson: dto.statsJson ?? {},
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
      statsJson: dto.statsJson,
      isPublic: dto.isPublic,
    } satisfies Partial<Character>;
  }
}
