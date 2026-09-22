import { z } from "zod";

export const EMAIL_NOTIFICATION_TYPES = [
  "REGISTRATION_CREATED",
  "REGISTRATION_APPROVED",
  "REGISTRATION_REJECTED",
  "RESULT_PUBLISHED",
  "EXAM_REMINDER",
] as const;

export const EMAIL_TYPE_LABELS: Record<(typeof EMAIL_NOTIFICATION_TYPES)[number], string> = {
  REGISTRATION_CREATED: "Registration received",
  REGISTRATION_APPROVED: "Registration approved",
  REGISTRATION_REJECTED: "Registration rejected",
  RESULT_PUBLISHED: "Result published",
  EXAM_REMINDER: "Exam reminder",
};

export const EMAIL_TYPE_DESCRIPTIONS: Record<(typeof EMAIL_NOTIFICATION_TYPES)[number], string> = {
  REGISTRATION_CREATED: "Sent once, right after a student submits a registration.",
  REGISTRATION_APPROVED: "Sent once, when an admin approves a registration.",
  REGISTRATION_REJECTED: "Sent once, when an admin rejects a registration (includes the reason).",
  RESULT_PUBLISHED: "Sent once, when a result is published (individually or in bulk).",
  EXAM_REMINDER: "Scheduled — configure below how many times and how long before the exam.",
};

export const emailSettingToggleSchema = z.object({
  type: z.enum(EMAIL_NOTIFICATION_TYPES),
  enabled: z.coerce.boolean(),
});

export const REMINDER_SCHEDULE_UNITS = ["minutes", "hours", "days"] as const;

const UNIT_TO_MINUTES: Record<(typeof REMINDER_SCHEDULE_UNITS)[number], number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

// El admin captura cantidad + unidad (amigable); se guarda como minutesBefore
// (única unidad interna, la que usa reminder-service.ts para comparar ventanas).
export const reminderScheduleSchema = z
  .object({
    amount: z.coerce.number().int().positive({ error: "Debe ser un número positivo." }).max(999),
    unit: z.enum(REMINDER_SCHEDULE_UNITS),
    active: z.coerce.boolean().default(true),
  })
  .transform(({ amount, unit, active }) => ({
    minutesBefore: amount * UNIT_TO_MINUTES[unit],
    active,
  }));
