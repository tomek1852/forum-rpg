import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CharactersService } from "./characters.service";

describe("CharactersService", () => {
  const prisma = {
    $transaction: jest.fn(),
    world: {
      findUnique: jest.fn(),
    },
    character: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    progressRule: {
      findUnique: jest.fn(),
    },
    progressEntry: {
      findMany: jest.fn(),
    },
  };

  const activityLog = { log: jest.fn() };

  let service: CharactersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CharactersService(prisma as never, activityLog as never);
  });

  it("creates a character for the owner", async () => {
    prisma.world.findUnique.mockResolvedValueOnce({
      id: "world-1",
      isActive: true,
      statDefinitions: [],
    });
    prisma.character.create.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-1",
      name: "Aster",
    });
    prisma.character.findUniqueOrThrow.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-1",
      name: "Aster",
      world: {
        id: "world-1",
        name: "Arbor",
        slug: "arbor",
      },
      statValues: [],
    });

    const result = await service.create("user-1", {
      name: "Aster",
      summary: "Scout",
      worldId: "world-1",
    });

    expect(prisma.character.create).toHaveBeenCalled();
    expect(result.character.name).toBe("Aster");
  });

  it("blocks updating someone else's character", async () => {
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-2",
      isPublic: true,
    });

    await expect(
      service.update("char-1", "user-1", {
        summary: "Updated",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("throws when character does not exist", async () => {
    prisma.character.findUnique.mockResolvedValueOnce(null);

    await expect(service.getById("missing", "user-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("allows a GM to view a private character", async () => {
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-1",
      isPublic: false,
      statValues: [],
    });

    const result = await service.getById("char-1", "gm-1", "GM");

    expect(result.character.id).toBe("char-1");
  });

  it("grants progress and updates character counters", async () => {
    const tx = {
      character: {
        findUnique: jest.fn().mockResolvedValueOnce({ id: "char-1" }),
        update: jest.fn().mockResolvedValueOnce({
          id: "char-1",
          ownerId: "user-1",
          name: "Aster",
          experiencePoints: 5,
          heroPoints: 1,
          statValues: [],
        }),
      },
      progressEntry: {
        create: jest.fn().mockResolvedValueOnce({
          id: "progress-1",
          characterId: "char-1",
          expDelta: 5,
          phDelta: 1,
          reason: "Sesja",
        }),
      },
    };
    prisma.$transaction.mockImplementationOnce((callback) => callback(tx));

    const result = await service.grantProgress(
      "char-1",
      { userId: "gm-1", role: "GM" },
      {
        expDelta: 5,
        phDelta: 1,
        reason: "Sesja",
      },
    );

    expect(tx.progressEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          characterId: "char-1",
          grantedById: "gm-1",
          expDelta: 5,
          phDelta: 1,
          reason: "Sesja",
        }),
      }),
    );
    expect(tx.character.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          experiencePoints: { increment: 5 },
          heroPoints: { increment: 1 },
        },
      }),
    );
    expect(result.character.experiencePoints).toBe(5);
  });

  it("returns rankings sorted by EXP and PH", async () => {
    prisma.character.findMany.mockResolvedValueOnce([
      {
        id: "char-2",
        name: "Bastion",
        experiencePoints: 12,
        heroPoints: 5,
        world: {
          id: "world-1",
          name: "Arbor",
          slug: "arbor",
        },
      },
      {
        id: "char-1",
        name: "Aster",
        experiencePoints: 12,
        heroPoints: 3,
        world: {
          id: "world-1",
          name: "Arbor",
          slug: "arbor",
        },
      },
      {
        id: "char-3",
        name: "Cinder",
        experiencePoints: 8,
        heroPoints: 9,
        world: {
          id: "world-2",
          name: "Nox",
          slug: "nox",
        },
      },
    ]);

    const result = await service.listRankings({ worldId: "world-1" });

    expect(prisma.character.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          worldId: "world-1",
        },
        orderBy: [{ experiencePoints: "desc" }, { heroPoints: "desc" }, { name: "asc" }],
      }),
    );
    expect(result.rankings).toEqual([
      expect.objectContaining({
        position: 1,
        characterId: "char-2",
        experiencePoints: 12,
        heroPoints: 5,
      }),
      expect.objectContaining({
        position: 2,
        characterId: "char-1",
        experiencePoints: 12,
        heroPoints: 3,
      }),
      expect.objectContaining({
        position: 3,
        characterId: "char-3",
        experiencePoints: 8,
        heroPoints: 9,
      }),
    ]);
  });

  it("reflects updated counters in rankings after granting progress", async () => {
    const tx = {
      character: {
        findUnique: jest.fn().mockResolvedValueOnce({ id: "char-1" }),
        update: jest.fn().mockResolvedValueOnce({
          id: "char-1",
          ownerId: "user-1",
          name: "Aster",
          experiencePoints: 6,
          heroPoints: 2,
          statValues: [],
        }),
      },
      progressEntry: {
        create: jest.fn().mockResolvedValueOnce({
          id: "progress-1",
          characterId: "char-1",
          expDelta: 4,
          phDelta: 2,
          reason: "Sesja",
        }),
      },
    };
    prisma.$transaction.mockImplementationOnce((callback) => callback(tx));
    prisma.character.findMany.mockResolvedValueOnce([
      {
        id: "char-1",
        name: "Aster",
        experiencePoints: 6,
        heroPoints: 2,
        world: {
          id: "world-1",
          name: "Arbor",
          slug: "arbor",
        },
      },
      {
        id: "char-2",
        name: "Bastion",
        experiencePoints: 5,
        heroPoints: 4,
        world: {
          id: "world-1",
          name: "Arbor",
          slug: "arbor",
        },
      },
    ]);

    await service.grantProgress(
      "char-1",
      { userId: "gm-1", role: "GM" },
      {
        expDelta: 4,
        phDelta: 2,
        reason: "Sesja",
      },
    );

    const result = await service.listRankings();

    expect(result.rankings[0]).toEqual(
      expect.objectContaining({
        position: 1,
        characterId: "char-1",
        experiencePoints: 6,
        heroPoints: 2,
      }),
    );
  });

  it("returns progress history for the character owner", async () => {
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-1",
    });
    prisma.progressEntry.findMany.mockResolvedValueOnce([
      {
        id: "progress-1",
        characterId: "char-1",
        expDelta: 3,
        phDelta: 0,
        reason: "Aktywna gra",
      },
    ]);

    const result = await service.listProgressHistory("char-1", {
      userId: "user-1",
      role: "PLAYER",
    });

    expect(prisma.progressEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { characterId: "char-1" },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(result.entries).toHaveLength(1);
  });

  it("blocks progress grants from regular players", async () => {
    await expect(
      service.grantProgress(
        "char-1",
        { userId: "user-1", role: "PLAYER" },
        {
          expDelta: 1,
          reason: "Sesja",
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks progress history for other players", async () => {
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-2",
    });

    await expect(
      service.listProgressHistory("char-1", {
        userId: "user-1",
        role: "PLAYER",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
