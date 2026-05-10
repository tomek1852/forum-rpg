import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventParticipationStatus, Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventParticipationDto } from "./dto/create-event-participation.dto";
import { CreateEventDto } from "./dto/create-event.dto";
import { ReviewEventParticipationDto } from "./dto/review-event-participation.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

const eventInclude = {
  creator: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
  participations: {
    include: {
      character: {
        select: {
          id: true,
          name: true,
          title: true,
          ownerId: true,
          world: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  },
} satisfies Prisma.EventInclude;

const eventParticipationInclude = {
  event: {
    select: {
      id: true,
      title: true,
      maxParticipants: true,
    },
  },
  character: {
    select: {
      id: true,
      name: true,
      title: true,
      ownerId: true,
      world: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  reviewer: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
} satisfies Prisma.EventParticipationInclude;

type EventRequester = {
  userId: string;
  role?: UserRole | string;
};

@Injectable()
export class EventsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listEvents(requester: EventRequester) {
    const events = await this.prisma.event.findMany({
      include: eventInclude,
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    });

    return {
      events: events.map((event) => this.serializeEvent(event, requester)),
    };
  }

  async getById(eventId: string, requester: EventRequester) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException("Nie znaleziono eventu.");
    }

    return {
      event: this.serializeEvent(event, requester),
    };
  }

  async create(creatorId: string, creatorRole: UserRole | string | undefined, dto: CreateEventDto) {
    this.assertManagerRole(creatorRole);
    this.assertDateRange(dto.startsAt, dto.endsAt);

    const createdEvent = await this.prisma.event.create({
      data: {
        creatorId,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        description: dto.description?.trim() || null,
        location: dto.location?.trim() || null,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt ?? null,
        maxParticipants: dto.maxParticipants ?? null,
      },
    });

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: createdEvent.id },
      include: eventInclude,
    });

    return {
      message: "Event zostal utworzony.",
      event: this.serializeEvent(event, { userId: creatorId, role: creatorRole }),
    };
  }

  async update(eventId: string, requester: EventRequester, dto: UpdateEventDto) {
    this.assertManagerRole(requester.role);

    const existingEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participations: {
          where: { status: EventParticipationStatus.APPROVED },
          select: { id: true },
        },
      },
    });

    if (!existingEvent) {
      throw new NotFoundException("Nie znaleziono eventu.");
    }

    const nextStartsAt = dto.startsAt ?? existingEvent.startsAt;
    const nextEndsAt = dto.endsAt ?? existingEvent.endsAt ?? undefined;
    const nextMaxParticipants =
      dto.maxParticipants ?? existingEvent.maxParticipants ?? null;

    this.assertDateRange(nextStartsAt, nextEndsAt);

    if (
      nextMaxParticipants !== null &&
      existingEvent.participations.length > nextMaxParticipants
    ) {
      throw new BadRequestException(
        "Nowy limit uczestnikow jest mniejszy niz liczba juz zaakceptowanych postaci.",
      );
    }

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary?.trim() || null } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.location !== undefined ? { location: dto.location?.trim() || null } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ?? null } : {}),
        ...(dto.maxParticipants !== undefined
          ? { maxParticipants: dto.maxParticipants ?? null }
          : {}),
      },
      include: eventInclude,
    });

    return {
      message: "Event zostal zaktualizowany.",
      event: this.serializeEvent(event, requester),
    };
  }

  async createParticipation(
    eventId: string,
    userId: string,
    dto: CreateEventParticipationDto,
  ) {
    const [event, character] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
        },
      }),
      this.prisma.character.findUnique({
        where: { id: dto.characterId },
        select: {
          id: true,
          ownerId: true,
          name: true,
        },
      }),
    ]);

    if (!event) {
      throw new NotFoundException("Nie znaleziono eventu.");
    }

    if (!character) {
      throw new NotFoundException("Nie znaleziono postaci.");
    }

    if (character.ownerId !== userId) {
      throw new ForbiddenException("Mozesz zapisac do eventu tylko wlasna postac.");
    }

    const existingParticipation = await this.prisma.eventParticipation.findUnique({
      where: {
        eventId_characterId: {
          eventId,
          characterId: dto.characterId,
        },
      },
    });

    if (existingParticipation) {
      throw new BadRequestException(
        "Ta postac jest juz zapisana do tego eventu albo czeka na decyzje MG.",
      );
    }

    const participation = await this.prisma.eventParticipation.create({
      data: {
        eventId,
        characterId: dto.characterId,
        note: dto.note?.trim() || null,
      },
      include: eventParticipationInclude,
    });

    return {
      message: "Postac zostala zapisana do eventu.",
      participation,
    };
  }

  async reviewParticipation(
    participationId: string,
    reviewer: EventRequester,
    dto: ReviewEventParticipationDto,
  ) {
    this.assertManagerRole(reviewer.role);

    if (dto.status === EventParticipationStatus.PENDING) {
      throw new BadRequestException("W review wybierz zaakceptowanie albo odrzucenie.");
    }

    const participation = await this.prisma.eventParticipation.findUnique({
      where: { id: participationId },
      include: eventParticipationInclude,
    });

    if (!participation) {
      throw new NotFoundException("Nie znaleziono zapisu na event.");
    }

    if (participation.status !== EventParticipationStatus.PENDING) {
      throw new BadRequestException("Ten zapis zostal juz wczesniej rozpatrzony.");
    }

    if (
      dto.status === EventParticipationStatus.APPROVED &&
      participation.event.maxParticipants !== null
    ) {
      const approvedCount = await this.prisma.eventParticipation.count({
        where: {
          eventId: participation.eventId,
          status: EventParticipationStatus.APPROVED,
        },
      });

      if (approvedCount >= participation.event.maxParticipants) {
        throw new BadRequestException("Event osiagnal juz maksymalna liczbe uczestnikow.");
      }
    }

    const updatedParticipation = await this.prisma.eventParticipation.update({
      where: { id: participationId },
      data: {
        status: dto.status,
        reviewerId: reviewer.userId,
        reviewerComment: dto.reviewerComment?.trim() || null,
        decidedAt: new Date(),
      },
      include: eventParticipationInclude,
    });

    return {
      message:
        dto.status === EventParticipationStatus.APPROVED
          ? "Uczestnictwo zostalo zaakceptowane."
          : "Uczestnictwo zostalo odrzucone.",
      participation: updatedParticipation,
    };
  }

  private assertManagerRole(role?: UserRole | string) {
    if (role !== UserRole.GM && role !== UserRole.ADMIN) {
      throw new ForbiddenException("Tylko GM lub administrator moze zarzadzac eventami.");
    }
  }

  private assertDateRange(startsAt: Date, endsAt?: Date | null) {
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException("Data zakonczenia eventu musi byc pozniejsza niz start.");
    }
  }

  private serializeEvent<
    T extends {
      participations: Array<{
        status: EventParticipationStatus;
        character: { ownerId: string };
      }>;
      maxParticipants: number | null;
    },
  >(event: T, requester: EventRequester) {
    const canManage = requester.role === UserRole.GM || requester.role === UserRole.ADMIN;
    const approvedParticipantCount = event.participations.filter(
      (participation) => participation.status === EventParticipationStatus.APPROVED,
    ).length;
    const pendingParticipantCount = event.participations.filter(
      (participation) => participation.status === EventParticipationStatus.PENDING,
    ).length;

    return {
      ...event,
      participations: canManage
        ? event.participations
        : event.participations.filter(
            (participation) =>
              participation.status === EventParticipationStatus.APPROVED ||
              participation.character.ownerId === requester.userId,
          ),
      approvedParticipantCount,
      pendingParticipantCount,
      remainingSlots:
        event.maxParticipants === null ? null : Math.max(event.maxParticipants - approvedParticipantCount, 0),
    };
  }
}
