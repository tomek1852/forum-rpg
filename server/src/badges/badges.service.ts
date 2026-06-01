import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BadgeCondition, NotificationType } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { AwardBadgeDto } from "./dto/award-badge.dto";
import { CreateBadgeDto } from "./dto/create-badge.dto";

@Injectable()
export class BadgesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  async listAll() {
    const badges = await this.prisma.badge.findMany({
      orderBy: { createdAt: "asc" },
    });

    return { badges };
  }

  async listForCharacter(characterId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    });

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    const characterBadges = await this.prisma.characterBadge.findMany({
      where: { characterId },
      include: {
        badge: true,
        awardedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { awardedAt: "asc" },
    });

    return { badges: characterBadges };
  }

  async createBadge(dto: CreateBadgeDto) {
    const badge = await this.prisma.badge.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        condition: dto.condition,
        threshold: dto.threshold ?? null,
      },
    });

    return { badge };
  }

  async awardBadge(
    characterId: string,
    awardedById: string,
    dto: AwardBadgeDto,
  ) {
    const [character, badge] = await Promise.all([
      this.prisma.character.findUnique({
        where: { id: characterId },
        select: { id: true, name: true, ownerId: true },
      }),
      this.prisma.badge.findUnique({ where: { id: dto.badgeId } }),
    ]);

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    if (!badge) {
      throw new NotFoundException("Nie znaleziono odznaki.");
    }

    const existing = await this.prisma.characterBadge.findUnique({
      where: {
        characterId_badgeId: { characterId, badgeId: dto.badgeId },
      },
    });

    if (existing) {
      throw new ConflictException("Postać ma już tę odznakę.");
    }

    const characterBadge = await this.prisma.characterBadge.create({
      data: {
        characterId,
        badgeId: dto.badgeId,
        awardedById,
        note: dto.note?.trim() || null,
      },
      include: {
        badge: true,
        awardedBy: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    await this.notificationsService.createForUsers([
      {
        userId: character.ownerId,
        type: NotificationType.BADGE_AWARDED,
        title: "Nowa odznaka!",
        message: `Twoja postać ${character.name} otrzymała odznakę „${badge.name}".`,
        link: `/character/${characterId}`,
      },
    ]);

    return { badge: characterBadge };
  }

  async removeBadge(characterId: string, badgeId: string) {
    const characterBadge = await this.prisma.characterBadge.findUnique({
      where: { characterId_badgeId: { characterId, badgeId } },
    });

    if (!characterBadge) {
      throw new NotFoundException("Postać nie ma tej odznaki.");
    }

    await this.prisma.characterBadge.delete({
      where: { characterId_badgeId: { characterId, badgeId } },
    });

    return { message: "Odznaka została usunięta." };
  }

  async checkAndAward(characterId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        experiencePoints: true,
        badges: { select: { badgeId: true } },
      },
    });

    if (!character) return;

    const existingBadgeIds = new Set(character.badges.map((b) => b.badgeId));

    const allBadges = await this.prisma.badge.findMany({
      where: { condition: { not: BadgeCondition.CUSTOM } },
    });

    const toAward: string[] = [];

    for (const badge of allBadges) {
      if (existingBadgeIds.has(badge.id)) continue;

      const qualifies = await this.qualifiesForBadge(
        character.id,
        character.ownerId,
        character.experiencePoints,
        badge.condition,
        badge.threshold ?? undefined,
      );

      if (qualifies) {
        toAward.push(badge.id);
      }
    }

    if (toAward.length === 0) return;

    await this.prisma.characterBadge.createMany({
      data: toAward.map((badgeId) => ({ characterId, badgeId })),
      skipDuplicates: true,
    });

    const awardedBadges = allBadges.filter((b) => toAward.includes(b.id));

    await this.notificationsService.createForUsers(
      awardedBadges.map((badge) => ({
        userId: character.ownerId,
        type: NotificationType.BADGE_AWARDED,
        title: "Nowa odznaka!",
        message: `Twoja postać ${character.name} otrzymała odznakę „${badge.name}".`,
        link: `/character/${characterId}`,
      })),
    );
  }

  async checkAndAwardForUser(userId: string) {
    const characters = await this.prisma.character.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    await Promise.all(characters.map((c) => this.checkAndAward(c.id)));
  }

  private async qualifiesForBadge(
    characterId: string,
    ownerId: string,
    experiencePoints: number,
    condition: BadgeCondition,
    threshold?: number,
  ): Promise<boolean> {
    switch (condition) {
      case BadgeCondition.FIRST_POST: {
        const postCount = await this.prisma.forumPost.count({
          where: { authorId: ownerId },
        });
        return postCount >= 1;
      }
      case BadgeCondition.FIRST_CHARACTER: {
        const charCount = await this.prisma.character.count({
          where: { ownerId },
        });
        return charCount >= 1;
      }
      case BadgeCondition.EXP_100:
        return experiencePoints >= 100;
      case BadgeCondition.EXP_500:
        return experiencePoints >= 500;
      case BadgeCondition.EXP_1000:
        return experiencePoints >= 1000;
      case BadgeCondition.SKILL_APPROVED: {
        const skillCount = await this.prisma.characterSkill.count({
          where: { characterId },
        });
        return skillCount >= (threshold ?? 1);
      }
      case BadgeCondition.EVENT_PARTICIPANT: {
        const participation = await this.prisma.eventParticipation.count({
          where: { characterId, status: "APPROVED" },
        });
        return participation >= (threshold ?? 1);
      }
      case BadgeCondition.CUSTOM:
        return false;
    }
  }
}
