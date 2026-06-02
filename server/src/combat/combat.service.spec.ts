import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { CombatStatus } from "@prisma/client";
import { CombatService } from "./combat.service";

function makePrisma() {
  return {
    world: { findUnique: jest.fn() },
    character: { findMany: jest.fn() },
    characterStatValue: { findMany: jest.fn() },
    combatEncounter: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    combatParticipant: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
}

const GM_ID = "gm-1";
const ENCOUNTER_BASE = {
  id: "enc-1",
  gmId: GM_ID,
  worldId: "world-1",
  title: "Test",
  status: CombatStatus.PREPARING,
  roundNumber: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("CombatService", () => {
  let service: CombatService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    service = new CombatService(prisma as never);
  });

  describe("create", () => {
    it("creates encounter with participants", async () => {
      prisma.world.findUnique.mockResolvedValueOnce({ id: "world-1" });
      prisma.character.findMany.mockResolvedValueOnce([
        { id: "char-1" },
        { id: "char-2" },
      ]);
      prisma.characterStatValue.findMany.mockResolvedValue([]);
      const created = { ...ENCOUNTER_BASE, participants: [], gm: { id: GM_ID } };
      prisma.combatEncounter.create.mockResolvedValueOnce(created);

      const result = await service.create(GM_ID, {
        title: "Test",
        worldId: "world-1",
        characterIds: ["char-1", "char-2"],
      });

      expect(result.encounter.id).toBe("enc-1");
      expect(prisma.combatEncounter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ gmId: GM_ID, worldId: "world-1" }),
        }),
      );
    });

    it("uses maxHp from CharacterStatValue for hp stat", async () => {
      prisma.world.findUnique.mockResolvedValueOnce({ id: "world-1" });
      prisma.character.findMany.mockResolvedValueOnce([{ id: "char-1" }]);
      prisma.characterStatValue.findMany.mockResolvedValueOnce([
        {
          numericValue: 42,
          statDefinition: { key: "hp" },
        },
      ]);
      prisma.combatEncounter.create.mockResolvedValueOnce({
        ...ENCOUNTER_BASE,
        participants: [],
        gm: { id: GM_ID },
      });

      await service.create(GM_ID, {
        title: "T",
        worldId: "world-1",
        characterIds: ["char-1"],
      });

      const createCall = prisma.combatEncounter.create.mock.calls[0][0];
      const participant = createCall.data.participants.create[0];
      expect(participant.hp).toBe(42);
      expect(participant.maxHp).toBe(42);
    });

    it("falls back to 100 hp when no hp stat is found", async () => {
      prisma.world.findUnique.mockResolvedValueOnce({ id: "world-1" });
      prisma.character.findMany.mockResolvedValueOnce([{ id: "char-1" }]);
      prisma.characterStatValue.findMany.mockResolvedValueOnce([]);
      prisma.combatEncounter.create.mockResolvedValueOnce({
        ...ENCOUNTER_BASE,
        participants: [],
        gm: { id: GM_ID },
      });

      await service.create(GM_ID, {
        title: "T",
        worldId: "world-1",
        characterIds: ["char-1"],
      });

      const createCall = prisma.combatEncounter.create.mock.calls[0][0];
      const participant = createCall.data.participants.create[0];
      expect(participant.hp).toBe(100);
      expect(participant.maxHp).toBe(100);
    });

    it("throws NotFoundException for unknown world", async () => {
      prisma.world.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(GM_ID, { title: "T", worldId: "bad", characterIds: ["char-1"] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("start", () => {
    it("transitions PREPARING → ACTIVE with roundNumber 1", async () => {
      prisma.combatEncounter.findUnique.mockResolvedValueOnce(ENCOUNTER_BASE);
      const updated = { ...ENCOUNTER_BASE, status: CombatStatus.ACTIVE, roundNumber: 1, participants: [], gm: {} };
      prisma.combatEncounter.update.mockResolvedValueOnce(updated);

      const result = await service.start(GM_ID, "enc-1");

      expect(result.encounter.status).toBe(CombatStatus.ACTIVE);
      expect(result.encounter.roundNumber).toBe(1);
      expect(prisma.combatEncounter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: CombatStatus.ACTIVE, roundNumber: 1 },
        }),
      );
    });

    it("throws if not in PREPARING status", async () => {
      prisma.combatEncounter.findUnique.mockResolvedValueOnce({
        ...ENCOUNTER_BASE,
        status: CombatStatus.ACTIVE,
      });

      await expect(service.start(GM_ID, "enc-1")).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException if caller is not GM", async () => {
      prisma.combatEncounter.findUnique.mockResolvedValueOnce(ENCOUNTER_BASE);

      await expect(service.start("other-user", "enc-1")).rejects.toThrow(ForbiddenException);
    });
  });
});
