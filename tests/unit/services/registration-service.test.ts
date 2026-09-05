import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { createRegistration, type CreateRegistrationMessages } from "@/services/registration-service";
import { AppError } from "@/lib/errors";

const db = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

const messages: CreateRegistrationMessages = {
  examDateNotAvailable: "not-available",
  registrationNotOpenYet: "not-open-yet",
  registrationClosed: "closed",
  alreadyRegistered: "already-registered",
};

const baseExamDate = {
  id: "examdate-1",
  active: true,
  registrationStartDate: new Date("2026-08-25T00:00:00.000Z"),
  registrationEndDate: new Date("2026-09-10T23:59:59.000Z"),
  examDate: new Date("2026-09-15T14:00:00.000Z"),
};

const baseInput = {
  profileId: "profile-1",
  examDateId: "examdate-1",
  documents: [
    { type: "PAYMENT_PROOF" as const, storageKey: "k1", mimeType: "application/pdf", size: 100 },
  ],
};

beforeEach(() => {
  mockReset(db);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createRegistration", () => {
  it("creates the registration when now is inside the registration window", async () => {
    db.examDate.findUnique.mockResolvedValue(baseExamDate as never);
    db.registration.findUnique.mockResolvedValue(null);
    db.registration.create.mockResolvedValue({ id: "reg-1" } as never);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00.000Z"));

    const result = await createRegistration(db, baseInput, messages);
    expect(result).toEqual({ id: "reg-1" });
  });

  it("rejects registration before the window opens", async () => {
    db.examDate.findUnique.mockResolvedValue({
      ...baseExamDate,
      registrationStartDate: new Date("2026-09-20T00:00:00.000Z"),
      registrationEndDate: new Date("2026-09-30T00:00:00.000Z"),
      examDate: new Date("2026-10-10T00:00:00.000Z"),
    } as never);

    await expect(createRegistration(db, baseInput, messages)).rejects.toThrow(AppError);
    await expect(createRegistration(db, baseInput, messages)).rejects.toThrow(messages.registrationNotOpenYet);
  });

  it("rejects registration after the window closes", async () => {
    db.examDate.findUnique.mockResolvedValue({
      ...baseExamDate,
      registrationStartDate: new Date("2026-08-15T00:00:00.000Z"),
      registrationEndDate: new Date("2026-08-21T23:59:59.000Z"),
      examDate: new Date("2026-08-30T00:00:00.000Z"),
    } as never);

    await expect(createRegistration(db, baseInput, messages)).rejects.toThrow(messages.registrationClosed);
  });

  it("rejects a duplicate registration for the same exam date", async () => {
    db.examDate.findUnique.mockResolvedValue({
      ...baseExamDate,
      registrationStartDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      registrationEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    } as never);
    db.registration.findUnique.mockResolvedValue({ id: "existing-reg" } as never);

    await expect(createRegistration(db, baseInput, messages)).rejects.toThrow(messages.alreadyRegistered);
    expect(db.registration.create).not.toHaveBeenCalled();
  });

  it("rejects registration for an inactive exam date", async () => {
    db.examDate.findUnique.mockResolvedValue({ ...baseExamDate, active: false } as never);

    await expect(createRegistration(db, baseInput, messages)).rejects.toThrow(messages.examDateNotAvailable);
  });

  it("rejects registration for a non-existent exam date", async () => {
    db.examDate.findUnique.mockResolvedValue(null);

    await expect(createRegistration(db, baseInput, messages)).rejects.toThrow(AppError);
  });
});
