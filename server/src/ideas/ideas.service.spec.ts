import { NotFoundException } from "@nestjs/common";
import { IdeaStatus, UserRole } from "@prisma/client";
import { IdeasService } from "./ideas.service";

function makePrisma() {
  return {
    idea: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe("IdeasService", () => {
  let service: IdeasService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    service = new IdeasService(prisma as never);
  });

  describe("createIdea", () => {
    it("player submits idea", async () => {
      prisma.idea.create.mockResolvedValueOnce({ id: "idea-1", status: IdeaStatus.OPEN });

      const result = await service.createIdea("user-1", {
        title: "My idea",
        content: "Some content here",
      });

      expect(result.idea.id).toBe("idea-1");
      expect(prisma.idea.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: "user-1" }),
        }),
      );
    });
  });

  describe("listIdeas", () => {
    it("player sees own ideas and OPEN ideas", async () => {
      prisma.idea.findMany.mockResolvedValueOnce([]);

      await service.listIdeas("user-1", UserRole.PLAYER);

      const call = prisma.idea.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty("OR");
    });

    it("GM sees all ideas", async () => {
      prisma.idea.findMany.mockResolvedValueOnce([]);

      await service.listIdeas("gm-1", UserRole.GM);

      const call = prisma.idea.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty("OR");
    });
  });

  describe("updateIdeaStatus", () => {
    it("throws NotFoundException for missing idea", async () => {
      prisma.idea.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateIdeaStatus("nonexistent", { status: IdeaStatus.ACCEPTED }),
      ).rejects.toThrow(NotFoundException);
    });

    it("GM changes status to ACCEPTED", async () => {
      prisma.idea.findUnique.mockResolvedValueOnce({ id: "idea-1" });
      prisma.idea.update.mockResolvedValueOnce({
        id: "idea-1",
        status: IdeaStatus.ACCEPTED,
        gmNote: "Great idea!",
      });

      const result = await service.updateIdeaStatus("idea-1", {
        status: IdeaStatus.ACCEPTED,
        gmNote: "Great idea!",
      });

      expect(result.idea.status).toBe(IdeaStatus.ACCEPTED);
      expect(prisma.idea.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: IdeaStatus.ACCEPTED, gmNote: "Great idea!" }),
        }),
      );
    });
  });
});
