import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocCategoryDto } from "./dto/create-doc-category.dto";
import { UpdateDocCategoryDto } from "./dto/update-doc-category.dto";
import { CreateDocPageDto } from "./dto/create-doc-page.dto";
import { UpdateDocPageDto } from "./dto/update-doc-page.dto";
import { CreateMediaAssetDto } from "./dto/create-media-asset.dto";

const categoryInclude = {
  createdBy: { select: { id: true, username: true, displayName: true } },
} as const;

const pageInclude = {
  author: { select: { id: true, username: true, displayName: true } },
  category: { select: { id: true, name: true } },
} as const;

@Injectable()
export class DocsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories(userRole: UserRole, worldId?: string) {
    const isPrivileged = userRole === UserRole.GM || userRole === UserRole.ADMIN;

    const categories = await this.prisma.docCategory.findMany({
      where: {
        ...(worldId ? { worldId } : {}),
        ...(!isPrivileged ? { isPublic: true } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: categoryInclude,
    });

    return { categories };
  }

  async getCategoryPages(categoryId: string, userRole: UserRole) {
    const category = await this.prisma.docCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException("Kategoria nie istnieje.");
    }

    const isPrivileged = userRole === UserRole.GM || userRole === UserRole.ADMIN;

    if (!isPrivileged && !category.isPublic) {
      throw new ForbiddenException("Brak dostępu do tej kategorii.");
    }

    const pages = await this.prisma.docPage.findMany({
      where: {
        categoryId,
        ...(!isPrivileged ? { isPublished: true } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: pageInclude,
    });

    return { category, pages };
  }

  async getPage(id: string, userRole: UserRole) {
    const page = await this.prisma.docPage.findUnique({
      where: { id },
      include: {
        ...pageInclude,
        category: true,
      },
    });

    if (!page) {
      throw new NotFoundException("Strona nie istnieje.");
    }

    const isPrivileged = userRole === UserRole.GM || userRole === UserRole.ADMIN;

    if (!isPrivileged && (!page.isPublished || !page.category.isPublic)) {
      throw new ForbiddenException("Brak dostępu do tej strony.");
    }

    return { page };
  }

  async createCategory(createdById: string, dto: CreateDocCategoryDto) {
    const category = await this.prisma.docCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        worldId: dto.worldId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isPublic: dto.isPublic ?? true,
        createdById,
      },
      include: categoryInclude,
    });

    return { category };
  }

  async updateCategory(id: string, dto: UpdateDocCategoryDto) {
    const existing = await this.prisma.docCategory.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException("Kategoria nie istnieje.");
    }

    const category = await this.prisma.docCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.worldId !== undefined ? { worldId: dto.worldId } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      },
      include: categoryInclude,
    });

    return { category };
  }

  async createPage(authorId: string, dto: CreateDocPageDto) {
    const category = await this.prisma.docCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException("Kategoria nie istnieje.");
    }

    const page = await this.prisma.docPage.create({
      data: {
        title: dto.title,
        content: dto.content,
        categoryId: dto.categoryId,
        authorId,
        isPublished: dto.isPublished ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: pageInclude,
    });

    return { page };
  }

  async updatePage(id: string, dto: UpdateDocPageDto) {
    const existing = await this.prisma.docPage.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException("Strona nie istnieje.");
    }

    const page = await this.prisma.docPage.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: pageInclude,
    });

    return { page };
  }

  async createMediaAsset(uploadedById: string, dto: CreateMediaAssetDto) {
    const asset = await this.prisma.mediaAsset.create({
      data: {
        name: dto.name,
        url: dto.url,
        type: dto.type,
        uploadedById,
        worldId: dto.worldId ?? null,
      },
      include: {
        uploadedBy: { select: { id: true, username: true, displayName: true } },
      },
    });

    return { asset };
  }

  async listMediaAssets(worldId?: string) {
    const assets = await this.prisma.mediaAsset.findMany({
      where: worldId ? { worldId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, username: true, displayName: true } },
      },
    });

    return { assets };
  }
}
