import type { PrismaClient } from "@/generated/prisma/client";
import type { SendMailResult } from "@/lib/mail/send-mail";
import { examReminderEmail } from "@/lib/mail/templates/exam-reminder";
import { isEmailNotificationEnabled } from "@/lib/mail/notification-settings";
import { REMINDER_CRON_INTERVAL_MINUTES } from "@/lib/constants";

/**
 * Ventana [now+minutesBefore, now+minutesBefore+tickIntervalMinutes) para un
 * ReminderSchedule dado. Tiene que calzar exactamente con la frecuencia real
 * del cron (docker/cron/crontab, REMINDER_CRON_INTERVAL_MINUTES) — así cada
 * tick cubre exactamente donde terminó el anterior, sin huecos ni traslapes.
 */
export function getReminderWindow(now: Date, minutesBefore: number, tickIntervalMinutes: number) {
  const start = new Date(now.getTime() + minutesBefore * 60_000);
  const end = new Date(start.getTime() + tickIntervalMinutes * 60_000);
  return { start, end };
}

/**
 * Inscripciones aprobadas cuyo examen cae en la ventana de este
 * ReminderSchedule y que aún no tienen un ReminderLog para él — la unicidad
 * (examDateId, registrationId, reminderScheduleId) en DB es la garantía
 * última de idempotencia, esto es solo la selección de candidatos.
 */
export async function findEligibleReminders(
  db: PrismaClient,
  now: Date,
  minutesBefore: number,
  tickIntervalMinutes: number,
  reminderScheduleId: string,
) {
  const { start, end } = getReminderWindow(now, minutesBefore, tickIntervalMinutes);

  return db.registration.findMany({
    where: {
      status: "APPROVED",
      examDate: { examDate: { gte: start, lt: end } },
      reminderLogs: { none: { reminderScheduleId } },
    },
    include: { profile: true, examDate: { include: { exam: true } } },
  });
}

export type SendMailFn = (payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => Promise<SendMailResult>;

export interface SendExamRemindersSummary {
  eligible: number;
  sent: number;
  failed: number;
}

/**
 * Recorre todos los ReminderSchedule activos (Settings › Emails puede tener
 * varios: "2 días antes", "1 día antes", "5 minutos antes", ...) y manda el
 * recordatorio a cada inscripción elegible de cada uno. Respeta el on/off
 * global de EXAM_REMINDER en EmailSetting — si está apagado, no manda nada
 * (pero tampoco marca nada como enviado, así retoma en cuanto se reactive).
 */
export async function sendExamReminders(
  db: PrismaClient,
  sendMailFn: SendMailFn,
  now: Date = new Date(),
  tickIntervalMinutes: number = REMINDER_CRON_INTERVAL_MINUTES,
): Promise<SendExamRemindersSummary> {
  const summary: SendExamRemindersSummary = { eligible: 0, sent: 0, failed: 0 };

  if (!(await isEmailNotificationEnabled(db, "EXAM_REMINDER"))) {
    return summary;
  }

  const schedules = await db.reminderSchedule.findMany({ where: { active: true } });

  for (const schedule of schedules) {
    const registrations = await findEligibleReminders(
      db,
      now,
      schedule.minutesBefore,
      tickIntervalMinutes,
      schedule.id,
    );
    summary.eligible += registrations.length;

    for (const registration of registrations) {
      const email = examReminderEmail({
        studentName: registration.profile.name,
        examName: registration.examDate.exam.name,
        examDate: registration.examDate.examDate,
        info: registration.examDate.info,
        instructions: registration.examDate.instructions,
        minutesBefore: schedule.minutesBefore,
      });

      const result = await sendMailFn({ to: registration.profile.email, ...email });

      if (result.ok) {
        // Solo se registra el envío tras un éxito confirmado: si Mailgun
        // falla, la inscripción sigue elegible en el siguiente tick del cron.
        await db.reminderLog.create({
          data: {
            examDateId: registration.examDateId,
            registrationId: registration.id,
            reminderScheduleId: schedule.id,
          },
        });
        summary.sent++;
      } else {
        summary.failed++;
      }
    }
  }

  return summary;
}
