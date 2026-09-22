import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  createRegistration,
  resubmitRegistration,
  type CreateRegistrationMessages,
  type ResubmitRegistrationMessages,
} from "@/services/registration-service";
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

describe("resubmitRegistration", () => {
  const resubmitMessages: ResubmitRegistrationMessages = {
    registrationNotFound: "not-found",
    onlyRejectedCanResubmit: "only-rejected",
    examDateNotAvailable: "not-available",
    registrationClosed: "closed",
  };

  const resubmitInput = {
    registrationId: "reg-1",
    profileId: "profile-1",
    documents: [
      { type: "PAYMENT_PROOF" as const, storageKey: "k1", mimeType: "application/pdf", size: 100 },
    ],
  };

  function mockRegistration(overrides: Partial<{ profileId: string; status: string; examDate: unknown }> = {}) {
    db.registration.findUnique.mockResolvedValue({
      id: "reg-1",
      profileId: "profile-1",
      status: "REJECTED",
      examDate: { ...baseExamDate, active: true },
      ...overrides,
    } as never);
  }

  it("rejects when the registration doesn't exist", async () => {
    db.registration.findUnique.mockResolvedValue(null);

    await expect(resubmitRegistration(db, resubmitInput, resubmitMessages)).rejects.toThrow(
      resubmitMessages.registrationNotFound,
    );
  });

  it("rejects when the registration belongs to another profile", async () => {
    mockRegistration({ profileId: "someone-else" });

    await expect(resubmitRegistration(db, resubmitInput, resubmitMessages)).rejects.toThrow(
      resubmitMessages.registrationNotFound,
    );
  });

  it("rejects when the registration isn't REJECTED", async () => {
    mockRegistration({ status: "PENDING" });

    await expect(resubmitRegistration(db, resubmitInput, resubmitMessages)).rejects.toThrow(
      resubmitMessages.onlyRejectedCanResubmit,
    );
  });

  it("rejects when the exam date is inactive", async () => {
    mockRegistration({ examDate: { ...baseExamDate, active: false } });

    await expect(resubmitRegistration(db, resubmitInput, resubmitMessages)).rejects.toThrow(
      resubmitMessages.examDateNotAvailable,
    );
  });

  it("rejects once the registration window has closed", async () => {
    mockRegistration({
      examDate: {
        ...baseExamDate,
        active: true,
        registrationStartDate: new Date("2026-08-15T00:00:00.000Z"),
        registrationEndDate: new Date("2026-08-21T23:59:59.000Z"),
      },
    });

    await expect(resubmitRegistration(db, resubmitInput, resubmitMessages)).rejects.toThrow(
      resubmitMessages.registrationClosed,
    );
  });

  it("upserts the documents and reopens the registration as PENDING", async () => {
    mockRegistration();
    (db.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => unknown) => cb(db),
    );
    db.document.upsert.mockResolvedValue({} as never);
    db.registration.update.mockResolvedValue({ id: "reg-1", status: "PENDING" } as never);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00.000Z"));

    const result = await resubmitRegistration(db, resubmitInput, resubmitMessages);

    expect(db.document.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { registrationId_type: { registrationId: "reg-1", type: "PAYMENT_PROOF" } },
      }),
    );
    expect(db.registration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reg-1" },
        data: { status: "PENDING", rejectionReason: null },
      }),
    );
    expect(result).toEqual({ id: "reg-1", status: "PENDING" });
  });
});
