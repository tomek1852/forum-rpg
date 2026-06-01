import { ConflictException, NotFoundException } from "@nestjs/common";
import { BadgeCondition } from "@prisma/client";
import { BadgesService } from "./badges.service";

const notificationsService = { createForUsers: jest.fn() };

function makePrisma() {
  return {
    badge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    characterBadge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    forumPost: { count: jest.fn() },
    characterSkill: { count: jest.fn() },
    eventParticipation: { count: jest.fn() },
  };
}

describe("BadgesService", () => {
  let service: BadgesService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    service = new BadgesService(prisma as never, notificationsService as never);
  });

  describe("checkAndAward - FIRST_POST", () => {
    it("awards FIRST_POST badge after first forum post", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({
        id: "char-1",
        name: "Hero",
        ownerId: "user-1",
        experiencePoints: 0,
        badges: [],
      });

      const firstPostBadge = {
        id: "badge-fp",
        name: "Pierwszy post",
        condition: BadgeCondition.FIRST_POST,
        threshold: null,
      };

      prisma.badge.findMany.mockResolvedValueOnce([firstPostBadge]);
      prisma.forumPost.count.mockResolvedValueOnce(1);
      prisma.characterBadge.createMany.mockResolvedValueOnce({ count: 1 });
      notificationsService.createForUsers.mockResolvedValueOnce(undefined);

      await service.checkAndAward("char-1");

      expect(prisma.characterBadge.createMany).toHaveBeenCalledWith({
        data: [{ characterId: "char-1", badgeId: "badge-fp" }],
        skipDuplicates: true,
      });
      expect(notificationsService.createForUsers).toHaveBeenCalled();
    });

    it("does not award FIRST_POST when no posts exist", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({
        id: "char-1",
        name: "Hero",
        ownerId: "user-1",
        experiencePoints: 0,
        badges: [],
      });

      prisma.badge.findMany.mockResolvedValueOnce([
        {
          id: "badge-fp",
          name: "Pierwszy post",
          condition: BadgeCondition.FIRST_POST,
          threshold: null,
        },
      ]);
      prisma.forumPost.count.mockResolvedValueOnce(0);

      await service.checkAndAward("char-1");

      expect(prisma.characterBadge.createMany).not.toHaveBeenCalled();
    });
  });

  describe("checkAndAward - EXP_100", () => {
    it("awards EXP_100 when experiencePoints >= 100", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({
        id: "char-1",
        name: "Hero",
        ownerId: "user-1",
        experiencePoints: 150,
        badges: [],
      });

      const expBadge = {
        id: "badge-exp100",
        name: "100 EXP",
        condition: BadgeCondition.EXP_100,
        threshold: null,
      };

      prisma.badge.findMany.mockResolvedValueOnce([expBadge]);
      prisma.characterBadge.createMany.mockResolvedValueOnce({ count: 1 });
      notificationsService.createForUsers.mockResolvedValueOnce(undefined);

      await service.checkAndAward("char-1");

      expect(prisma.characterBadge.createMany).toHaveBeenCalledWith({
        data: [{ characterId: "char-1", badgeId: "badge-exp100" }],
        skipDuplicates: true,
      });
    });

    it("does not award EXP_100 when experiencePoints < 100", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({
        id: "char-1",
        name: "Hero",
        ownerId: "user-1",
        experiencePoints: 50,
        badges: [],
      });

      prisma.badge.findMany.mockResolvedValueOnce([
        {
          id: "badge-exp100",
          name: "100 EXP",
          condition: BadgeCondition.EXP_100,
          threshold: null,
        },
      ]);

      await service.checkAndAward("char-1");

      expect(prisma.characterBadge.createMany).not.toHaveBeenCalled();
    });
  });

  describe("no duplicates", () => {
    it("does not award a badge the character already has", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({
        id: "char-1",
        name: "Hero",
        ownerId: "user-1",
        experiencePoints: 200,
        badges: [{ badgeId: "badge-exp100" }],
      });

      prisma.badge.findMany.mockResolvedValueOnce([
        {
          id: "badge-exp100",
          name: "100 EXP",
          condition: BadgeCondition.EXP_100,
          threshold: null,
        },
      ]);

      await service.checkAndAward("char-1");

      expect(prisma.characterBadge.createMany).not.toHaveBeenCalled();
    });
  });

  describe("awardBadge (GM/ADMIN manual CUSTOM)", () => {
    it("allows awarding a CUSTOM badge with a note", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({
        id: "char-1",
        name: "Hero",
        ownerId: "user-1",
      });

      prisma.badge.findUnique.mockResolvedValueOnce({
        id: "badge-custom",
        name: "Odznaka specjalna",
        condition: BadgeCondition.CUSTOM,
      });

      prisma.characterBadge.findUnique.mockResolvedValueOnce(null);

      const created = {
        id: "cb-1",
        characterId: "char-1",
        badgeId: "badge-custom",
        awardedAt: new Date(),
        note: "Za heroizm",
        badge: { id: "badge-custom", name: "Odznaka specjalna" },
        awardedBy: { id: "gm-1", username: "gm", displayName: "GM" },
      };

      prisma.characterBadge.create.mockResolvedValueOnce(created);
      notificationsService.createForUsers.mockResolvedValueOnce(undefined);

      const result = await service.awardBadge("char-1", "gm-1", {
        badgeId: "badge-custom",
        note: "Za heroizm",
      });

      expect(result.badge.note).toBe("Za heroizm");
      expect(prisma.characterBadge.create).toHaveBeenCalled();
    });

    it("throws ConflictException when badge already awarded", async () => {
      prisma.character.findUnique.mockResolvedValueOnce({ id: "char-1", name: "Hero", ownerId: "user-1" });
      prisma.badge.findUnique.mockResolvedValueOnce({ id: "badge-custom", name: "Custom" });
      prisma.characterBadge.findUnique.mockResolvedValueOnce({ id: "cb-1" });

      await expect(
        service.awardBadge("char-1", "gm-1", { badgeId: "badge-custom" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("throws NotFoundException for unknown character", async () => {
      prisma.character.findUnique.mockResolvedValueOnce(null);
      prisma.badge.findUnique.mockResolvedValueOnce({ id: "badge-custom" });

      await expect(
        service.awardBadge("unknown", "gm-1", { badgeId: "badge-custom" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
