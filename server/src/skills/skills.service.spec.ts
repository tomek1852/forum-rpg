import { ForbiddenException } from "@nestjs/common";
import { NotificationType, SkillProposalStatus } from "@prisma/client";
import { SkillsService } from "./skills.service";

describe("SkillsService", () => {
  const prisma = {
    character: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    skillProposal: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    characterSkill: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const notificationsService = {
    createForUsers: jest.fn(),
  };

  const activityLog = { log: jest.fn() };

  let service: SkillsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SkillsService(prisma as never, notificationsService as never, activityLog as never);
  });

  it("creates a skill proposal for the character owner", async () => {
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      name: "Aster",
      ownerId: "user-1",
    });
    prisma.skillProposal.findFirst.mockResolvedValueOnce(null);
    prisma.skillProposal.create.mockResolvedValueOnce({
      id: "proposal-1",
      name: "Strzał cienia",
      description: "Ukryty atak z dystansu.",
      mechanics: null,
      costs: null,
      limitations: null,
      status: SkillProposalStatus.PENDING,
      reviewerComment: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterId: "char-1",
      proposerId: "user-1",
      reviewerId: null,
      character: {
        id: "char-1",
        name: "Aster",
        ownerId: "user-1",
      },
      proposer: {
        id: "user-1",
        username: "aster",
        displayName: null,
      },
      reviewer: null,
      createdSkill: null,
    });
    prisma.user.findMany.mockResolvedValueOnce([{ id: "gm-1" }]);

    const result = await service.createProposal("user-1", {
      characterId: "char-1",
      name: "Strzał cienia",
      description: "Ukryty atak z dystansu.",
    });

    expect(result.proposal.name).toBe("Strzał cienia");
    expect(notificationsService.createForUsers).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "gm-1",
        type: NotificationType.SKILL_PROPOSAL_CREATED,
      }),
    ]);
  });

  it("blocks creating a proposal for another player's character", async () => {
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      name: "Aster",
      ownerId: "user-2",
    });

    await expect(
      service.createProposal("user-1", {
        characterId: "char-1",
        name: "Strzał cienia",
        description: "Ukryty atak z dystansu.",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("approves a proposal and creates a character skill", async () => {
    prisma.skillProposal.findUnique.mockResolvedValueOnce({
      id: "proposal-1",
      name: "Strzał cienia",
      description: "Ukryty atak z dystansu.",
      mechanics: "Rzut na Zręczność.",
      costs: null,
      limitations: null,
      status: SkillProposalStatus.PENDING,
      reviewerComment: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterId: "char-1",
      proposerId: "user-1",
      reviewerId: null,
      character: {
        id: "char-1",
        name: "Aster",
        ownerId: "user-1",
      },
      proposer: {
        id: "user-1",
        username: "aster",
        displayName: null,
      },
      reviewer: null,
      createdSkill: null,
    });

    prisma.$transaction.mockImplementationOnce(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback({
        ...prisma,
        characterSkill: {
          findFirst: jest.fn().mockResolvedValueOnce(null),
          create: jest.fn().mockResolvedValueOnce({
            id: "skill-1",
          }),
        },
        skillProposal: {
          ...prisma.skillProposal,
          update: jest.fn().mockResolvedValueOnce({
            id: "proposal-1",
            name: "Strzał cienia",
            description: "Ukryty atak z dystansu.",
            mechanics: "Rzut na Zręczność.",
            costs: null,
            limitations: null,
            status: SkillProposalStatus.APPROVED,
            reviewerComment: "Pasuje do świata.",
            reviewedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            characterId: "char-1",
            proposerId: "user-1",
            reviewerId: "gm-1",
            character: {
              id: "char-1",
              name: "Aster",
              ownerId: "user-1",
            },
            proposer: {
              id: "user-1",
              username: "aster",
              displayName: null,
            },
            reviewer: {
              id: "gm-1",
              username: "gm",
              displayName: "MG",
            },
            createdSkill: {
              id: "skill-1",
            },
          }),
        },
      } as never),
    );

    const result = await service.reviewProposal(
      "proposal-1",
      { userId: "gm-1", role: "GM" },
      { status: SkillProposalStatus.APPROVED, reviewerComment: "Pasuje do świata." },
    );

    expect(result.proposal.status).toBe(SkillProposalStatus.APPROVED);
    expect(notificationsService.createForUsers).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "user-1",
        type: NotificationType.SKILL_PROPOSAL_APPROVED,
      }),
    ]);
  });
});
