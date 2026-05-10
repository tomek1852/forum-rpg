import { EventParticipationStatus, UserRole } from "@prisma/client";
import { EventsService } from "./events.service";

describe("EventsService", () => {
  const prisma = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
    },
    eventParticipation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma as never);
  });

  it("creates an event", async () => {
    prisma.event.create.mockResolvedValueOnce({
      id: "event-1",
    });
    prisma.event.findUniqueOrThrow.mockResolvedValueOnce({
      id: "event-1",
      title: "Sesja Arbor",
      summary: "Wieczorna rozgrywka",
      description: null,
      location: "Discord",
      startsAt: new Date("2026-05-20T18:00:00.000Z").toISOString(),
      endsAt: new Date("2026-05-20T21:00:00.000Z").toISOString(),
      maxParticipants: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creatorId: "gm-1",
      creator: {
        id: "gm-1",
        username: "gm",
        displayName: "MG",
      },
      participations: [],
    });

    const result = await service.create("gm-1", UserRole.GM, {
      title: "Sesja Arbor",
      summary: "Wieczorna rozgrywka",
      location: "Discord",
      startsAt: new Date("2026-05-20T18:00:00.000Z"),
      endsAt: new Date("2026-05-20T21:00:00.000Z"),
      maxParticipants: 4,
    });

    expect(prisma.event.create).toHaveBeenCalled();
    expect(result.event.title).toBe("Sesja Arbor");
  });

  it("lets a character sign up for an event", async () => {
    prisma.event.findUnique.mockResolvedValueOnce({
      id: "event-1",
    });
    prisma.character.findUnique.mockResolvedValueOnce({
      id: "char-1",
      ownerId: "user-1",
      name: "Aster",
    });
    prisma.eventParticipation.findUnique.mockResolvedValueOnce(null);
    prisma.eventParticipation.create.mockResolvedValueOnce({
      id: "participation-1",
      status: EventParticipationStatus.PENDING,
      note: "Chetnie dolacze.",
      reviewerComment: null,
      decidedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventId: "event-1",
      characterId: "char-1",
      reviewerId: null,
      event: {
        id: "event-1",
        title: "Sesja Arbor",
        maxParticipants: 4,
      },
      character: {
        id: "char-1",
        name: "Aster",
        title: "Lowca",
        ownerId: "user-1",
        world: null,
      },
      reviewer: null,
    });

    const result = await service.createParticipation("event-1", "user-1", {
      characterId: "char-1",
      note: "Chetnie dolacze.",
    });

    expect(prisma.eventParticipation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "event-1",
          characterId: "char-1",
        }),
      }),
    );
    expect(result.participation.status).toBe(EventParticipationStatus.PENDING);
  });

  it("lets GM approve event participation", async () => {
    prisma.eventParticipation.findUnique.mockResolvedValueOnce({
      id: "participation-1",
      status: EventParticipationStatus.PENDING,
      note: null,
      reviewerComment: null,
      decidedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventId: "event-1",
      characterId: "char-1",
      reviewerId: null,
      event: {
        id: "event-1",
        title: "Sesja Arbor",
        maxParticipants: 4,
      },
      character: {
        id: "char-1",
        name: "Aster",
        title: "Lowca",
        ownerId: "user-1",
        world: null,
      },
      reviewer: null,
    });
    prisma.eventParticipation.count.mockResolvedValueOnce(0);
    prisma.eventParticipation.update.mockResolvedValueOnce({
      id: "participation-1",
      status: EventParticipationStatus.APPROVED,
      note: null,
      reviewerComment: "Pasuje do skladu.",
      decidedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventId: "event-1",
      characterId: "char-1",
      reviewerId: "gm-1",
      event: {
        id: "event-1",
        title: "Sesja Arbor",
        maxParticipants: 4,
      },
      character: {
        id: "char-1",
        name: "Aster",
        title: "Lowca",
        ownerId: "user-1",
        world: null,
      },
      reviewer: {
        id: "gm-1",
        username: "gm",
        displayName: "MG",
      },
    });

    const result = await service.reviewParticipation(
      "participation-1",
      { userId: "gm-1", role: UserRole.GM },
      {
        status: EventParticipationStatus.APPROVED,
        reviewerComment: "Pasuje do skladu.",
      },
    );

    expect(prisma.eventParticipation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EventParticipationStatus.APPROVED,
          reviewerId: "gm-1",
        }),
      }),
    );
    expect(result.participation.status).toBe(EventParticipationStatus.APPROVED);
  });
});
