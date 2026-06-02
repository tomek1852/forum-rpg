import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IdeaStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIdeaDto } from "./dto/create-idea.dto";
import { UpdateIdeaStatusDto } from "./dto/update-idea-status.dto";

const ideaInclude = {
  author: { select: { id: true, username: true, displayName: true } },
} as const;

@Injectable()
export class IdeasService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createIdea(authorId: string, dto: CreateIdeaDto) {
    const idea = await this.prisma.idea.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category ?? null,
        authorId,
      },
      include: ideaInclude,
    });

    return { idea };
  }

  async listIdeas(userId: string, userRole: UserRole, status?: IdeaStatus) {
    const isPrivileged = userRole === UserRole.GM || userRole === UserRole.ADMIN;

    const ideas = await this.prisma.idea.findMany({
      where: {
        ...(isPrivileged
          ? status ? { status } : {}
          : {
              OR: [{ authorId: userId }, { status: IdeaStatus.OPEN }],
              ...(status ? { status } : {}),
            }),
      },
      orderBy: { createdAt: "desc" },
      include: ideaInclude,
    });

    return { ideas };
  }

  async updateIdeaStatus(id: string, dto: UpdateIdeaStatusDto) {
    const existing = await this.prisma.idea.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException("Pomysł nie istnieje.");
    }

    const idea = await this.prisma.idea.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.gmNote !== undefined ? { gmNote: dto.gmNote } : {}),
      },
      include: ideaInclude,
    });

    return { idea };
  }
}
