import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { findEligibleReminders, getReminderWindow, sendExamReminders } from "@/services/reminder-service";

const db = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(db);
});

describe("getReminderWindow", () => {
  it("returns [now+minutesBefore, now+minutesBefore+tickInterval)", () => {
    const now = new Date("2026-09-03T15:30:00.000Z");
    const { start, end } = getReminderWindow(now, 1440, 5);
    expect(start.toISOString()).toBe("2026-09-04T15:30:00.000Z");
    expect(end.toISOString()).toBe("2026-09-04T15:35:00.000Z");
  });

  it("consecutive ticks are contiguous (no gaps, no overlap)", () => {
    const tick1 = new Date("2026-09-03T15:30:00.000Z");
    const tick2 = new Date("2026-09-03T15:35:00.000Z"); // tick1 + 5min interval
    const window1 = getReminderWindow(tick1, 5, 5);
    const window2 = getReminderWindow(tick2, 5, 5);
    expect(window1.end.toISOString()).toBe(window2.start.toISOString());
  });
});

describe("findEligibleReminders", () => {
  it("queries only APPROVED registrations with no prior log for this specific schedule", async () => {
    db.registration.findMany.mockResolvedValue([]);

    await findEligibleReminders(db, new Date("2026-09-03T00:00:00.000Z"), 1440, 5, "schedule-1");

    expect(db.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "APPROVED",
          reminderLogs: { none: { reminderScheduleId: "schedule-1" } },
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

  const oneDaySchedule = { id: "schedule-1day", minutesBefore: 1440, active: true };

  it("does nothing when EXAM_REMINDER is disabled", async () => {
    db.emailSetting.findUnique.mockResolvedValue({ enabled: false } as never);
    const sendMailFn = vi.fn();

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(sendMailFn).not.toHaveBeenCalled();
    expect(db.reminderSchedule.findMany).not.toHaveBeenCalled();
    expect(summary).toEqual({ eligible: 0, sent: 0, failed: 0 });
  });

  it("sends one reminder per eligible registration per active schedule and records the ReminderLog", async () => {
    db.emailSetting.findUnique.mockResolvedValue({ enabled: true } as never);
    db.reminderSchedule.findMany.mockResolvedValue([oneDaySchedule] as never);
    db.registration.findMany.mockResolvedValue([registration] as never);
    db.reminderLog.create.mockResolvedValue({} as never);
    const sendMailFn = vi.fn().mockResolvedValue({ ok: true });

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(sendMailFn).toHaveBeenCalledTimes(1);
    expect(sendMailFn).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
    expect(db.reminderLog.create).toHaveBeenCalledWith({
      data: { examDateId: "examdate-1", registrationId: "reg-1", reminderScheduleId: "schedule-1day" },
    });
    expect(summary).toEqual({ eligible: 1, sent: 1, failed: 0 });
  });

  it("does not write a ReminderLog when the send fails, leaving it eligible for retry", async () => {
    db.emailSetting.findUnique.mockResolvedValue({ enabled: true } as never);
    db.reminderSchedule.findMany.mockResolvedValue([oneDaySchedule] as never);
    db.registration.findMany.mockResolvedValue([registration] as never);
    const sendMailFn = vi.fn().mockResolvedValue({ ok: false, error: new Error("mailgun down") });

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(db.reminderLog.create).not.toHaveBeenCalled();
    expect(summary).toEqual({ eligible: 1, sent: 0, failed: 1 });
  });

  it("running twice in a row only ever sends once thanks to the exclusion query", async () => {
    db.emailSetting.findUnique.mockResolvedValue({ enabled: true } as never);
    db.reminderSchedule.findMany.mockResolvedValue([oneDaySchedule] as never);
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

  it("sends independently for each active schedule (e.g. 2 days before and 1 day before)", async () => {
    db.emailSetting.findUnique.mockResolvedValue({ enabled: true } as never);
    const twoDaySchedule = { id: "schedule-2day", minutesBefore: 2880, active: true };
    db.reminderSchedule.findMany.mockResolvedValue([oneDaySchedule, twoDaySchedule] as never);
    db.registration.findMany.mockResolvedValue([registration] as never);
    db.reminderLog.create.mockResolvedValue({} as never);
    const sendMailFn = vi.fn().mockResolvedValue({ ok: true });

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(sendMailFn).toHaveBeenCalledTimes(2);
    expect(db.reminderLog.create).toHaveBeenCalledWith({
      data: { examDateId: "examdate-1", registrationId: "reg-1", reminderScheduleId: "schedule-1day" },
    });
    expect(db.reminderLog.create).toHaveBeenCalledWith({
      data: { examDateId: "examdate-1", registrationId: "reg-1", reminderScheduleId: "schedule-2day" },
    });
    expect(summary).toEqual({ eligible: 2, sent: 2, failed: 0 });
  });

  it("skips inactive schedules", async () => {
    db.emailSetting.findUnique.mockResolvedValue({ enabled: true } as never);
    // findMany ya filtra por active:true en el service — simulamos que no regresa nada inactivo.
    db.reminderSchedule.findMany.mockResolvedValue([] as never);
    const sendMailFn = vi.fn();

    const summary = await sendExamReminders(db, sendMailFn, new Date("2026-09-03T00:00:00.000Z"));

    expect(db.reminderSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
    expect(sendMailFn).not.toHaveBeenCalled();
    expect(summary).toEqual({ eligible: 0, sent: 0, failed: 0 });
  });
});
