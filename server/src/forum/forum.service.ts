import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { BadgesService } from "../badges/badges.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateThreadDto } from "./dto/create-thread.dto";

const userSummarySelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
} as const;

const MODERATOR_ROLES = ["GM", "ADMIN"];

function canAccessCategory(category: { allowedRoles: string[]; isArchived: boolean }, userRole: string): boolean {
  if (MODERATOR_ROLES.includes(userRole)) return true;
  if (category.isArchived) return false;
  if (category.allowedRoles.length === 0) return true;
  return category.allowedRoles.includes(userRole);
}

@Injectable()
export class ForumService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
    @Inject(BadgesService) private readonly badgesService: BadgesService,
  ) {}

  async listCategories(userRole: string) {
    const isModerator = MODERATOR_ROLES.includes(userRole);

    const where = isModerator
      ? {}
      : {
          isArchived: false,
          OR: [
            { allowedRoles: { isEmpty: true } },
            { allowedRoles: { has: userRole } },
          ],
        };

    const categories = await this.prisma.forumCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { position: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
        threads: {
          orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
          take: 1,
          include: {
            author: {
              select: userSummarySelect,
            },
            _count: {
              select: {
                posts: true,
              },
            },
          },
        },
      },
    });

    return {
      categories: categories.map((category) => ({
        id: category.id,
        title: category.title,
        description: category.description,
        color: category.color,
        position: category.position,
        sortOrder: category.sortOrder,
        allowedRoles: category.allowedRoles,
        isArchived: category.isArchived,
        createdById: category.createdById,
        threadCount: category._count.threads,
        latestThread: category.threads[0]
          ? {
              id: category.threads[0].id,
              categoryId: category.id,
              title: category.threads[0].title,
              lastPostAt: category.threads[0].lastPostAt,
              postCount: category.threads[0]._count.posts,
              author: category.threads[0].author,
            }
          : null,
      })),
    };
  }

  async getCategory(categoryId: string, userRole: string) {
    const category = await this.prisma.forumCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
        threads: {
          orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
          include: {
            author: {
              select: userSummarySelect,
            },
            posts: {
              take: 1,
              orderBy: { createdAt: "asc" },
              select: {
                content: true,
              },
            },
            _count: {
              select: {
                posts: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException("Nie znaleziono kategorii forum.");
    }

    if (!canAccessCategory(category, userRole)) {
      throw new ForbiddenException("Nie masz dostępu do tej kategorii forum.");
    }

    return {
      category: {
        id: category.id,
        title: category.title,
        description: category.description,
        color: category.color,
        position: category.position,
        sortOrder: category.sortOrder,
        allowedRoles: category.allowedRoles,
        isArchived: category.isArchived,
        threadCount: category._count.threads,
      },
      threads: category.threads.map((thread) => ({
        id: thread.id,
        categoryId: category.id,
        title: thread.title,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        lastPostAt: thread.lastPostAt,
        postCount: thread._count.posts,
        author: thread.author,
        excerpt: this.createExcerpt(thread.posts[0]?.content),
      })),
    };
  }

  async getThread(threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        category: true,
        author: {
          select: userSummarySelect,
        },
        posts: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: userSummarySelect,
            },
            quotePost: {
              include: {
                author: {
                  select: userSummarySelect,
                },
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!thread || thread.category.isArchived) {
      throw new NotFoundException("Nie znaleziono watku forum.");
    }

    return {
      category: {
        id: thread.category.id,
        title: thread.category.title,
        description: thread.category.description,
        color: thread.category.color,
      },
      thread: {
        id: thread.id,
        categoryId: thread.categoryId,
        title: thread.title,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        lastPostAt: thread.lastPostAt,
        postCount: thread._count.posts,
        author: thread.author,
      },
      posts: thread.posts.map((post) => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        editedAt: post.editedAt,
        author: post.author,
        quotePost: post.quotePost
          ? {
              id: post.quotePost.id,
              content: post.quotePost.content,
              createdAt: post.quotePost.createdAt,
              author: post.quotePost.author,
            }
          : null,
      })),
    };
  }

  async createCategory(dto: CreateCategoryDto, createdById: string) {
    const category = await this.prisma.forumCategory.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        color: dto.color?.trim() || null,
        position: dto.position ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        allowedRoles: dto.allowedRoles ?? [],
        createdById,
      },
    });

    return { category: this.mapCategory(category) };
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      throw new NotFoundException("Nie znaleziono kategorii forum.");
    }

    const category = await this.prisma.forumCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.color !== undefined ? { color: dto.color?.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.allowedRoles !== undefined ? { allowedRoles: dto.allowedRoles } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
    });

    return { category: this.mapCategory(category) };
  }

  async archiveCategory(categoryId: string) {
    const existing = await this.prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      throw new NotFoundException("Nie znaleziono kategorii forum.");
    }

    const category = await this.prisma.forumCategory.update({
      where: { id: categoryId },
      data: { isArchived: true },
    });

    return { category: this.mapCategory(category) };
  }

  async createThread(authorId: string, userRole: string, dto: CreateThreadDto) {
    const category = await this.prisma.forumCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || category.isArchived) {
      throw new NotFoundException("Nie mozna dodac watku do tej kategorii.");
    }

    if (!canAccessCategory(category, userRole)) {
      throw new ForbiddenException("Nie masz dostepu do tej kategorii forum.");
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const thread = await tx.forumThread.create({
        data: {
          categoryId: dto.categoryId,
          authorId,
          title: dto.title.trim(),
          lastPostAt: now,
        },
      });

      await tx.forumPost.create({
        data: {
          threadId: thread.id,
          authorId,
          content: dto.content.trim(),
        },
      });

      return tx.forumThread.findUnique({
        where: { id: thread.id },
        include: {
          category: true,
          author: {
            select: userSummarySelect,
          },
          posts: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: {
              content: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException("Nie udalo sie utworzyc watku.");
    }

    const moderators = await this.prisma.user.findMany({
      where: {
        id: { not: authorId },
        role: { in: ["GM", "ADMIN"] },
        status: "ACTIVE",
        emailVerified: true,
      },
      select: {
        id: true,
      },
    });

    await this.notificationsService.createForUsers(
      moderators.map((moderator) => ({
        userId: moderator.id,
        type: NotificationType.FORUM_NEW_THREAD,
        title: "Nowy watek na forum",
        message: `${this.getAuthorLabel(result.author)} zalozyl watek "${result.title}" w kategorii ${category.title}.`,
        link: `/forum/${result.categoryId}/${result.id}`,
      })),
    );

    return {
      thread: {
        id: result.id,
        title: result.title,
        categoryId: result.categoryId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        lastPostAt: result.lastPostAt,
        isPinned: result.isPinned,
        isLocked: result.isLocked,
        postCount: result._count.posts,
        author: result.author,
        excerpt: this.createExcerpt(result.posts[0]?.content),
      },
    };
  }

  async createPost(threadId: string, authorId: string, dto: CreatePostDto) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        category: true,
      },
    });

    if (!thread || thread.category.isArchived) {
      throw new NotFoundException("Nie znaleziono watku forum.");
    }

    if (thread.isLocked) {
      throw new ForbiddenException("Ten watek jest zamkniety.");
    }

    let quotePost:
      | {
          id: string;
          threadId: string;
          authorId: string;
        }
      | null = null;

    if (dto.quotePostId) {
      quotePost = await this.prisma.forumPost.findUnique({
        where: { id: dto.quotePostId },
        select: {
          id: true,
          threadId: true,
          authorId: true,
        },
      });

      if (!quotePost || quotePost.threadId !== threadId) {
        throw new NotFoundException("Nie znaleziono cytowanego posta.");
      }
    }

    const now = new Date();

    const post = await this.prisma.$transaction(async (tx) => {
      const createdPost = await tx.forumPost.create({
        data: {
          threadId,
          authorId,
          content: dto.content.trim(),
          quotePostId: dto.quotePostId,
        },
      });

      await tx.forumThread.update({
        where: { id: threadId },
        data: {
          lastPostAt: now,
        },
      });

      return tx.forumPost.findUnique({
        where: { id: createdPost.id },
        include: {
          author: {
            select: userSummarySelect,
          },
          quotePost: {
            include: {
              author: {
                select: userSummarySelect,
              },
            },
          },
        },
      });
    });

    if (!post) {
      throw new NotFoundException("Nie udalo sie zapisac odpowiedzi.");
    }

    const recipients = new Map<
      string,
      {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        link: string;
      }
    >();

    if (thread.authorId !== authorId) {
      recipients.set(thread.authorId, {
        userId: thread.authorId,
        type: NotificationType.FORUM_THREAD_REPLY,
        title: "Nowa odpowiedz w obserwowanym watku",
        message: `${this.getAuthorLabel(post.author)} odpowiedzial w watku "${thread.title}".`,
        link: `/forum/${thread.categoryId}/${threadId}#post-${post.id}`,
      });
    }

    if (quotePost && quotePost.authorId !== authorId) {
      recipients.set(quotePost.authorId, {
        userId: quotePost.authorId,
        type: NotificationType.FORUM_POST_QUOTE,
        title: "Któs zacytowal Twoj post",
        message: `${this.getAuthorLabel(post.author)} zacytowal Twoj wpis w watku "${thread.title}".`,
        link: `/forum/${thread.categoryId}/${threadId}#post-${post.id}`,
      });
    }

    await this.notificationsService.createForUsers([...recipients.values()]);

    this.badgesService.checkAndAwardForUser(authorId).catch(() => undefined);

    return {
      post: {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        editedAt: post.editedAt,
        author: post.author,
        quotePost: post.quotePost
          ? {
              id: post.quotePost.id,
              content: post.quotePost.content,
              createdAt: post.quotePost.createdAt,
              author: post.quotePost.author,
            }
          : null,
      },
    };
  }

  private mapCategory(category: {
    id: string;
    title: string;
    description: string | null;
    color: string | null;
    position: number;
    sortOrder: number;
    allowedRoles: string[];
    isArchived: boolean;
    createdById: string | null;
  }) {
    return {
      id: category.id,
      title: category.title,
      description: category.description,
      color: category.color,
      position: category.position,
      sortOrder: category.sortOrder,
      allowedRoles: category.allowedRoles,
      isArchived: category.isArchived,
      createdById: category.createdById,
    };
  }

  private createExcerpt(content?: string | null) {
    if (!content) {
      return null;
    }

    const normalized = content.replace(/\s+/g, " ").trim();

    if (normalized.length <= 180) {
      return normalized;
    }

    return `${normalized.slice(0, 177)}...`;
  }

  private getAuthorLabel(author: { displayName: string | null; username: string }) {
    return author.displayName || author.username;
  }
}
