import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ForumService } from "./forum.service";

describe("ForumService", () => {
  const notificationsService = {
    createForUsers: jest.fn(),
  };
  const tx = {
    forumThread: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    forumPost: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const prisma = {
    forumCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    forumThread: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    forumPost: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: ForumService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ForumService(prisma as never, notificationsService as never);
  });

  it("creates a thread with the opening post", async () => {
    prisma.forumCategory.findUnique.mockResolvedValueOnce({
      id: "category-1",
      title: "Tawerna",
      isArchived: false,
    });
    prisma.user.findMany.mockResolvedValueOnce([]);
    prisma.$transaction.mockImplementationOnce(
      async (callback: (transaction: typeof tx) => Promise<unknown>) => {
        tx.forumThread.create.mockResolvedValueOnce({ id: "thread-1" });
        tx.forumPost.create.mockResolvedValueOnce({ id: "post-1" });
        tx.forumThread.findUnique.mockResolvedValueOnce({
          id: "thread-1",
          title: "Nowy watek",
          categoryId: "category-1",
          isPinned: false,
          isLocked: false,
          createdAt: new Date("2026-03-29T10:30:00.000Z"),
          updatedAt: new Date("2026-03-29T10:30:00.000Z"),
          lastPostAt: new Date("2026-03-29T10:30:00.000Z"),
          author: {
            id: "user-1",
            username: "tomek1852",
            displayName: null,
            avatarUrl: null,
            role: "PLAYER",
          },
          posts: [{ content: "Pierwsza wiadomosc." }],
          _count: { posts: 1 },
        });

        return callback(tx);
      },
    );

    const result = await service.createThread("user-1", {
      categoryId: "category-1",
      title: "Nowy watek",
      content: "Pierwsza wiadomosc.",
    });

    expect(tx.forumThread.create).toHaveBeenCalled();
    expect(tx.forumPost.create).toHaveBeenCalled();
    expect(result.thread.id).toBe("thread-1");
  });

  it("blocks replies in locked threads", async () => {
    prisma.forumThread.findUnique.mockResolvedValueOnce({
      id: "thread-1",
      isLocked: true,
      category: {
        id: "category-1",
        isArchived: false,
      },
    });

    await expect(
      service.createPost("thread-1", "user-1", {
        content: "Nie przejdzie",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("requires quoted post to belong to the same thread", async () => {
    prisma.forumThread.findUnique.mockResolvedValueOnce({
      id: "thread-1",
      isLocked: false,
      category: {
        id: "category-1",
        isArchived: false,
      },
    });
    prisma.forumPost.findUnique.mockResolvedValueOnce({
      id: "post-9",
      threadId: "other-thread",
    });

    await expect(
      service.createPost("thread-1", "user-1", {
        content: "To jest odpowiedz",
        quotePostId: "post-9",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates notifications for thread owner and quoted user", async () => {
    prisma.forumThread.findUnique.mockResolvedValueOnce({
      id: "thread-1",
      title: "Narada",
      authorId: "user-2",
      categoryId: "category-1",
      isLocked: false,
      category: {
        id: "category-1",
        isArchived: false,
      },
    });
    prisma.forumPost.findUnique.mockResolvedValueOnce({
      id: "post-9",
      threadId: "thread-1",
      authorId: "user-3",
    });
    prisma.$transaction.mockImplementationOnce(
      async (callback: (transaction: typeof tx) => Promise<unknown>) => {
        tx.forumPost.create.mockResolvedValueOnce({ id: "post-10" });
        tx.forumThread.update.mockResolvedValueOnce({ id: "thread-1" });
        tx.forumPost.findUnique.mockResolvedValueOnce({
          id: "post-10",
          content: "Odpowiedz",
          createdAt: new Date("2026-04-18T10:00:00.000Z"),
          updatedAt: new Date("2026-04-18T10:00:00.000Z"),
          editedAt: null,
          author: {
            id: "user-1",
            username: "tomek1852",
            displayName: null,
            avatarUrl: null,
            role: "PLAYER",
          },
          quotePost: null,
        });

        return callback(tx);
      },
    );

    await service.createPost("thread-1", "user-1", {
      content: "Odpowiedz",
      quotePostId: "post-9",
    });

    expect(notificationsService.createForUsers).toHaveBeenCalledWith([
      expect.objectContaining({ userId: "user-2" }),
      expect.objectContaining({ userId: "user-3" }),
    ]);
  });
});
