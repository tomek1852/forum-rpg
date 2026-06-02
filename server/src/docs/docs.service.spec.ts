import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { DocsService } from "./docs.service";

function makePrisma() {
  return {
    docCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    docPage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    mediaAsset: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
}

describe("DocsService", () => {
  let service: DocsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    service = new DocsService(prisma as never);
  });

  describe("listCategories", () => {
    it("player sees only isPublic=true categories", async () => {
      prisma.docCategory.findMany.mockResolvedValueOnce([]);

      await service.listCategories(UserRole.PLAYER);

      expect(prisma.docCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublic: true }),
        }),
      );
    });

    it("GM sees all categories including private", async () => {
      prisma.docCategory.findMany.mockResolvedValueOnce([]);

      await service.listCategories(UserRole.GM);

      const call = prisma.docCategory.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty("isPublic");
    });
  });

  describe("getCategoryPages", () => {
    it("throws NotFoundException for missing category", async () => {
      prisma.docCategory.findUnique.mockResolvedValueOnce(null);

      await expect(service.getCategoryPages("cat-1", UserRole.PLAYER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("player cannot access non-public category", async () => {
      prisma.docCategory.findUnique.mockResolvedValueOnce({ id: "cat-1", isPublic: false });

      await expect(service.getCategoryPages("cat-1", UserRole.PLAYER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("GM creates and publishes a page", async () => {
      const category = { id: "cat-1", isPublic: false };
      prisma.docCategory.findUnique.mockResolvedValueOnce(category);
      prisma.docPage.findMany.mockResolvedValueOnce([{ id: "p-1", isPublished: true }]);

      const result = await service.getCategoryPages("cat-1", UserRole.GM);

      expect(result.pages).toHaveLength(1);
    });
  });

  describe("createPage", () => {
    it("throws if category not found", async () => {
      prisma.docCategory.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createPage("user-1", { title: "T", content: "C", categoryId: "cat-1" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("creates page with correct data", async () => {
      prisma.docCategory.findUnique.mockResolvedValueOnce({ id: "cat-1" });
      prisma.docPage.create.mockResolvedValueOnce({ id: "p-1", title: "T", isPublished: false });

      const result = await service.createPage("user-1", {
        title: "T",
        content: "C",
        categoryId: "cat-1",
        isPublished: false,
      });

      expect(result.page.id).toBe("p-1");
      expect(prisma.docPage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: "user-1", isPublished: false }),
        }),
      );
    });
  });
});
