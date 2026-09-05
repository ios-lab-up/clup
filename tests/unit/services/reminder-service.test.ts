import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { findEligibleReminders, getTomorrowWindow, sendExamReminders } from "@/services/reminder-service";

const db = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(db);
});

describe("getTomorrowWindow", () => {
  it("returns [tomorrow 00:00, day-after-tomorrow 00:00)", () => {
    const now = new Date("2026-09-03T15:30:00.000Z");
    const { start, end } = getTomorrowWindow(now);
    expect(start.toISOString().slice(0, 10)).toBe("2026-09-04");
    expect(end.toISOString().slice(0, 10)).toBe("2026-09-05");
  });
});

describe("findEligibleReminders", () => {
  it("queries only APPROVED registrations with no prior reminder log", async () => {
    db.registration.findMany.mockResolvedValue([]);

    await findEligibleReminders(db, new Date("2026-09-03T00:00:00.000Z"));

    expect(db.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "APPROVED",
          reminderLogs: { none: {} },
        }),
      }),
    );
  });
});

describe("sendExamReminders", () => {
  const registration = {
    id: "reg-1",
    examDateId: "examdate-1",
    profile: { name: "Ana", email: "ana@example.com" },
    examDate: {
      exam: { name: "TOEIC" },
      examDate: new Date("2026-09-04T14:00:00.000Z"),
      info: null,
      instructions: null,
    },
  };

  it("sends one reminder per eligible registration and records the ReminderLog", async () => {
    db.registration.findMany.mockResolvedValue([registration] as never);
    db.reminderLog.create.mockResolvedValue({} as never);
    const sendMailFn = vi.fn().mockResolvedValue({ ok: true });

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(sendMailFn).toHaveBeenCalledTimes(1);
    expect(sendMailFn).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
    expect(db.reminderLog.create).toHaveBeenCalledWith({
      data: { examDateId: "examdate-1", registrationId: "reg-1" },
    });
    expect(summary).toEqual({ eligible: 1, sent: 1, failed: 0 });
  });

  it("does not write a ReminderLog when the send fails, leaving it eligible for retry", async () => {
    db.registration.findMany.mockResolvedValue([registration] as never);
    const sendMailFn = vi.fn().mockResolvedValue({ ok: false, error: new Error("mailgun down") });

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(db.reminderLog.create).not.toHaveBeenCalled();
    expect(summary).toEqual({ eligible: 1, sent: 0, failed: 1 });
  });

  it("running twice in a row only ever sends once thanks to the exclusion query", async () => {
    // Segunda corrida: el mock simula que ya no hay candidatos porque el
    // ReminderLog ya existe (la query real los excluiría vía reminderLogs: none).
    db.registration.findMany.mockResolvedValueOnce([registration] as never);
    db.reminderLog.create.mockResolvedValue({} as never);
    const sendMailFn = vi.fn().mockResolvedValue({ ok: true });

    await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    db.registration.findMany.mockResolvedValueOnce([]);
    const secondSummary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(sendMailFn).toHaveBeenCalledTimes(1);
    expect(secondSummary).toEqual({ eligible: 0, sent: 0, failed: 0 });
  });
});
