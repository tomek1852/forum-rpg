import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const CACHE_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class RankingsService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getWorldRankings() {
    const cached = this.getCache<ReturnType<typeof this.buildWorldRankings>>("worlds");
    if (cached) return cached;

    const worlds = await this.prisma.world.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        characters: {
          where: { isPublic: true },
          select: {
            experiencePoints: true,
            heroPoints: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = this.buildWorldRankings(worlds);
    this.setCache("worlds", result);
    return result;
  }

  private buildWorldRankings(
    worlds: Array<{
      id: string;
      name: string;
      slug: string;
      characters: Array<{ experiencePoints: number; heroPoints: number; updatedAt: Date }>;
    }>,
  ) {
    const entries = worlds.map((world) => {
      const chars = world.characters;
      const totalExp = chars.reduce((sum, c) => sum + c.experiencePoints, 0);
      const lastActivityAt =
        chars.length > 0
          ? new Date(Math.max(...chars.map((c) => c.updatedAt.getTime()))).toISOString()
          : null;

      return {
        worldId: world.id,
        name: world.name,
        slug: world.slug,
        activeCharacterCount: chars.length,
        totalExp,
        lastActivityAt,
      };
    });

    return { worlds: entries };
  }

  private getCache<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private setCache<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}
