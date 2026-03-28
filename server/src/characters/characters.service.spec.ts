import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CharactersService } from "./characters.service";

describe("CharactersService", () => {
  const prisma = {
    character: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: CharactersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CharactersService(prisma as never);
  });

  it("creates a character for the owner", async () => {
    prisma.character.create.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-1",
      name: "Aster",
    });

    const result = await service.create("user-1", {
      name: "Aster",
      summary: "Scout",
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
});
