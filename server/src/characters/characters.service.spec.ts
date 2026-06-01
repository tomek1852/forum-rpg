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
  const badgesService = { checkAndAward: jest.fn().mockResolvedValue(undefined) };

  let service: CharactersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CharactersService(prisma as never, activityLog as never, badgesService as never);
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
        avatarUrl: null,
        experiencePoints: 12,
        heroPoints: 5,
        createdAt: new Date("2024-01-02"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
      {
        id: "char-1",
        name: "Aster",
        avatarUrl: null,
        experiencePoints: 12,
        heroPoints: 3,
        createdAt: new Date("2024-01-01"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
      {
        id: "char-3",
        name: "Cinder",
        avatarUrl: null,
        experiencePoints: 8,
        heroPoints: 9,
        createdAt: new Date("2024-01-03"),
        world: { id: "world-2", name: "Nox", slug: "nox" },
      },
    ]);

    const result = await service.listRankings({ worldId: "world-1" });

    expect(prisma.character.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          worldId: "world-1",
        },
        orderBy: [{ experiencePoints: "desc" }, { heroPoints: "desc" }, { id: "asc" }],
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
        avatarUrl: null,
        experiencePoints: 6,
        heroPoints: 2,
        createdAt: new Date("2024-01-01"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
      {
        id: "char-2",
        name: "Bastion",
        avatarUrl: null,
        experiencePoints: 5,
        heroPoints: 4,
        createdAt: new Date("2024-01-02"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
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

  it("sorts rankings by heroPoints when sortBy=heroPoints", async () => {
    prisma.character.findMany.mockResolvedValueOnce([
      {
        id: "char-b",
        name: "Bastion",
        avatarUrl: null,
        experiencePoints: 5,
        heroPoints: 10,
        createdAt: new Date("2024-01-02"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
      {
        id: "char-a",
        name: "Aster",
        avatarUrl: null,
        experiencePoints: 20,
        heroPoints: 3,
        createdAt: new Date("2024-01-01"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
    ]);

    const result = await service.listRankings({ sortBy: "heroPoints" });

    expect(prisma.character.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ heroPoints: "desc" }, { experiencePoints: "desc" }, { id: "asc" }],
      }),
    );
    expect(result.rankings[0].characterId).toBe("char-b");
    expect(result.rankings[0].position).toBe(1);
    expect(result.rankings[1].characterId).toBe("char-a");
  });

  it("filters rankings by worldId", async () => {
    prisma.character.findMany.mockResolvedValueOnce([
      {
        id: "char-1",
        name: "Aster",
        avatarUrl: null,
        experiencePoints: 10,
        heroPoints: 2,
        createdAt: new Date("2024-01-01"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
    ]);

    const result = await service.listRankings({ worldId: "world-1" });

    expect(prisma.character.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true, worldId: "world-1" },
      }),
    );
    expect(result.rankings).toHaveLength(1);
    expect(result.rankings[0].characterId).toBe("char-1");
  });

  it("paginates rankings with cursor", async () => {
    const page1Data = [
      {
        id: "char-a",
        name: "Alpha",
        avatarUrl: null,
        experiencePoints: 30,
        heroPoints: 5,
        createdAt: new Date("2024-01-01"),
        world: null,
      },
      {
        id: "char-b",
        name: "Beta",
        avatarUrl: null,
        experiencePoints: 20,
        heroPoints: 4,
        createdAt: new Date("2024-01-02"),
        world: null,
      },
    ];
    prisma.character.findMany.mockResolvedValueOnce(page1Data);

    const page1 = await service.listRankings({ limit: 2 });

    expect(page1.rankings).toHaveLength(2);
    expect(page1.nextCursor).toBeNull();

    const page2Data = [
      {
        id: "char-c",
        name: "Gamma",
        avatarUrl: null,
        experiencePoints: 10,
        heroPoints: 3,
        createdAt: new Date("2024-01-03"),
        world: null,
      },
    ];
    prisma.character.findMany.mockResolvedValueOnce(page2Data);

    const page2 = await service.listRankings({ limit: 2, cursor: "char-b" });

    expect(prisma.character.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: { id: "char-b" },
        skip: 1,
        take: 3,
      }),
    );
    expect(page2.rankings[0].characterId).toBe("char-c");
    expect(page2.nextCursor).toBeNull();
  });

  it("returns nextCursor when more pages exist", async () => {
    const data = Array.from({ length: 21 }, (_, i) => ({
      id: `char-${i}`,
      name: `Char ${i}`,
      avatarUrl: null,
      experiencePoints: 100 - i,
      heroPoints: 0,
      createdAt: new Date("2024-01-01"),
      world: null,
    }));
    prisma.character.findMany.mockResolvedValueOnce(data);

    const result = await service.listRankings({ limit: 20 });

    expect(result.rankings).toHaveLength(20);
    expect(result.nextCursor).toBe("char-19");
  });

  it("reflects updated EXP in rankings after granting progress", async () => {
    const tx = {
      character: {
        findUnique: jest.fn().mockResolvedValueOnce({ id: "char-1" }),
        update: jest.fn().mockResolvedValueOnce({
          id: "char-1",
          ownerId: "user-1",
          name: "Aster",
          experiencePoints: 15,
          heroPoints: 2,
          statValues: [],
        }),
      },
      progressEntry: {
        create: jest.fn().mockResolvedValueOnce({
          id: "progress-1",
          characterId: "char-1",
          expDelta: 10,
          phDelta: 0,
          reason: "Sesja",
        }),
      },
    };
    prisma.$transaction.mockImplementationOnce((callback) => callback(tx));
    prisma.character.findMany.mockResolvedValueOnce([
      {
        id: "char-1",
        name: "Aster",
        avatarUrl: null,
        experiencePoints: 15,
        heroPoints: 2,
        createdAt: new Date("2024-01-01"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
      {
        id: "char-2",
        name: "Bastion",
        avatarUrl: null,
        experiencePoints: 10,
        heroPoints: 5,
        createdAt: new Date("2024-01-02"),
        world: { id: "world-1", name: "Arbor", slug: "arbor" },
      },
    ]);

    await service.grantProgress(
      "char-1",
      { userId: "gm-1", role: "GM" },
      { expDelta: 10, reason: "Sesja" },
    );

    const result = await service.listRankings();

    expect(result.rankings[0]).toEqual(
      expect.objectContaining({
        position: 1,
        characterId: "char-1",
        experiencePoints: 15,
      }),
    );
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
