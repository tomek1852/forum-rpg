import { UserRole } from "@prisma/client";
import { WorldsService } from "./worlds.service";

describe("WorldsService", () => {
  const prisma = {
    world: {
      findUnique: jest.fn(),
    },
    worldLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: WorldsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorldsService(prisma as never);
  });

  it("creates a world log entry for a manager", async () => {
    prisma.world.findUnique.mockResolvedValueOnce({
      id: "world-1",
      isActive: true,
    });
    prisma.worldLog.create.mockResolvedValueOnce({
      id: "log-1",
      title: "Rysa na granicy",
      content: "Patrole zglosily pierwsze ruchy wojsk przy granicy.",
      worldId: "world-1",
      authorId: "gm-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "gm-1",
        username: "gm",
        displayName: "MG",
      },
    });

    const result = await service.createWorldLog("world-1", "gm-1", UserRole.GM, {
      title: "Rysa na granicy",
      content: "Patrole zglosily pierwsze ruchy wojsk przy granicy.",
    });

    expect(prisma.worldLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          worldId: "world-1",
          authorId: "gm-1",
          title: "Rysa na granicy",
        }),
      }),
    );
    expect(result.entry.id).toBe("log-1");
  });

  it("lists world log entries for a world", async () => {
    prisma.world.findUnique.mockResolvedValueOnce({
      id: "world-1",
      name: "Arbor",
      slug: "arbor",
      summary: "Swiat pogranicza.",
      description: "Opis swiata.",
      isActive: true,
    });
    prisma.worldLog.findMany.mockResolvedValueOnce([
      {
        id: "log-1",
        title: "Rysa na granicy",
        content: "Patrole zglosily pierwsze ruchy wojsk przy granicy.",
        worldId: "world-1",
        authorId: "gm-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: "gm-1",
          username: "gm",
          displayName: "MG",
        },
      },
    ]);

    const result = await service.listWorldLogs("world-1");

    expect(prisma.worldLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { worldId: "world-1" },
      }),
    );
    expect(result.world.slug).toBe("arbor");
    expect(result.entries).toHaveLength(1);
  });
});
