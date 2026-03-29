import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateThreadDto } from "./dto/create-thread.dto";

const userSummarySelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
} as const;

@Injectable()
export class ForumService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.forumCategory.findMany({
      where: { isArchived: false },
      orderBy: [{ position: "asc" }, { title: "asc" }],
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

  async getCategory(categoryId: string) {
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

    if (!category || category.isArchived) {
      throw new NotFoundException("Nie znaleziono kategorii forum.");
    }

    return {
      category: {
        id: category.id,
        title: category.title,
        description: category.description,
        color: category.color,
        position: category.position,
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

  async createCategory(dto: CreateCategoryDto) {
    const category = await this.prisma.forumCategory.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        color: dto.color?.trim() || null,
        position: dto.position ?? 0,
      },
    });

    return { category };
  }

  async createThread(authorId: string, dto: CreateThreadDto) {
    const category = await this.prisma.forumCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || category.isArchived) {
      throw new NotFoundException("Nie mozna dodac watku do tej kategorii.");
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

    if (dto.quotePostId) {
      const quotePost = await this.prisma.forumPost.findUnique({
        where: { id: dto.quotePostId },
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
}
