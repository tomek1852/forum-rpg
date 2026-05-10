import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  NotificationType,
  Prisma,
  SkillProposalStatus,
  UserRole,
} from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSkillProposalDto } from "./dto/create-skill-proposal.dto";
import { ReviewSkillProposalDto } from "./dto/review-skill-proposal.dto";

const skillProposalInclude = {
  character: {
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  },
  proposer: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
  createdSkill: true,
} satisfies Prisma.SkillProposalInclude;

@Injectable()
export class SkillsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  async createProposal(userId: string, dto: CreateSkillProposalDto) {
    const character = await this.prisma.character.findUnique({
      where: { id: dto.characterId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    if (character.ownerId !== userId) {
      throw new ForbiddenException("Możesz zgłaszać umiejętności tylko do swoich postaci.");
    }

    const pendingDuplicate = await this.prisma.skillProposal.findFirst({
      where: {
        characterId: character.id,
        status: SkillProposalStatus.PENDING,
        name: {
          equals: dto.name.trim(),
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (pendingDuplicate) {
      throw new BadRequestException("Ta postać ma już oczekującą propozycję o takiej nazwie.");
    }

    const proposal = await this.prisma.skillProposal.create({
      data: {
        characterId: character.id,
        proposerId: userId,
        name: dto.name.trim(),
        description: dto.description.trim(),
        mechanics: dto.mechanics?.trim() || null,
        costs: dto.costs?.trim() || null,
        limitations: dto.limitations?.trim() || null,
      },
      include: skillProposalInclude,
    });

    const moderators = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.GM, UserRole.ADMIN] },
        status: "ACTIVE",
        isActive: true,
      },
      select: { id: true },
    });

    await this.notificationsService.createForUsers(
      moderators.map((moderator) => ({
        userId: moderator.id,
        type: NotificationType.SKILL_PROPOSAL_CREATED,
        title: "Nowa propozycja umiejętności",
        message: `Postać ${character.name} czeka na review propozycji "${proposal.name}".`,
        link: "/mg",
      })),
    );

    return {
      message: "Propozycja umiejętności została wysłana do akceptacji.",
      proposal,
    };
  }

  async listReviewQueue() {
    const proposals = await this.prisma.skillProposal.findMany({
      include: skillProposalInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return {
      proposals,
    };
  }

  async reviewProposal(
    proposalId: string,
    reviewer: { userId: string; role: UserRole | string },
    dto: ReviewSkillProposalDto,
  ) {
    const proposal = await this.prisma.skillProposal.findUnique({
      where: { id: proposalId },
      include: skillProposalInclude,
    });

    if (!proposal) {
      throw new NotFoundException("Nie znaleziono propozycji umiejętności.");
    }

    if (proposal.status !== SkillProposalStatus.PENDING) {
      throw new BadRequestException("Ta propozycja została już wcześniej rozpatrzona.");
    }

    if (dto.status === SkillProposalStatus.PENDING) {
      throw new BadRequestException("Do review wybierz zatwierdzenie albo odrzucenie.");
    }

    const reviewerComment = dto.reviewerComment?.trim() || null;

    const reviewedProposal = await this.prisma.$transaction(async (tx) => {
      if (dto.status === SkillProposalStatus.APPROVED) {
        const existingSkill = await tx.characterSkill.findFirst({
          where: {
            characterId: proposal.characterId,
            name: {
              equals: proposal.name,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (existingSkill) {
          throw new BadRequestException("Ta postać ma już umiejętność o takiej nazwie.");
        }

        await tx.characterSkill.create({
          data: {
            characterId: proposal.characterId,
            approvedById: reviewer.userId,
            sourceProposalId: proposal.id,
            name: proposal.name,
            description: proposal.description,
            mechanics: proposal.mechanics,
            costs: proposal.costs,
            limitations: proposal.limitations,
          },
        });
      }

      return tx.skillProposal.update({
        where: { id: proposal.id },
        data: {
          status: dto.status,
          reviewerId: reviewer.userId,
          reviewerComment,
          reviewedAt: new Date(),
        },
        include: skillProposalInclude,
      });
    });

    await this.notificationsService.createForUsers([
      {
        userId: proposal.proposerId,
        type:
          dto.status === SkillProposalStatus.APPROVED
            ? NotificationType.SKILL_PROPOSAL_APPROVED
            : NotificationType.SKILL_PROPOSAL_REJECTED,
        title:
          dto.status === SkillProposalStatus.APPROVED
            ? "Umiejętność zatwierdzona"
            : "Umiejętność wymaga poprawek",
        message:
          dto.status === SkillProposalStatus.APPROVED
            ? `Propozycja "${proposal.name}" dla postaci ${proposal.character.name} została zatwierdzona.`
            : `Propozycja "${proposal.name}" dla postaci ${proposal.character.name} została odrzucona.${reviewerComment ? ` Komentarz: ${reviewerComment}` : ""}`,
        link: `/character/${proposal.characterId}`,
      },
    ]);

    return {
      message:
        dto.status === SkillProposalStatus.APPROVED
          ? "Propozycja została zatwierdzona."
          : "Propozycja została odrzucona.",
      proposal: reviewedProposal,
    };
  }
}
