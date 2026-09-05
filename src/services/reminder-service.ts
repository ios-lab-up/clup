import type { PrismaClient } from "@/generated/prisma/client";
import type { SendMailResult } from "@/lib/mail/send-mail";
import { examReminderEmail } from "@/lib/mail/templates/exam-reminder";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Ventana [mañana 00:00, pasado mañana 00:00) — exámenes exactamente a 1 día. */
export function getTomorrowWindow(now: Date) {
  const start = addDays(startOfDay(now), 1);
  const end = addDays(start, 1);
  return { start, end };
}

/**
 * Inscripciones aprobadas cuyo examen es mañana y que aún no tienen un
 * ReminderLog — la unicidad (examDateId, registrationId) en DB es la
 * garantía última de idempotencia, esto es solo la selección de candidatos.
 */
export async function findEligibleReminders(db: PrismaClient, now: Date = new Date()) {
  const { start, end } = getTomorrowWindow(now);

  return db.registration.findMany({
    where: {
      status: "APPROVED",
      examDate: { examDate: { gte: start, lt: end } },
      reminderLogs: { none: {} },
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

export async function sendExamReminders(
  db: PrismaClient,
  sendMailFn: SendMailFn,
  now: Date = new Date(),
): Promise<SendExamRemindersSummary> {
  const registrations = await findEligibleReminders(db, now);

  let sent = 0;
  let failed = 0;

  for (const registration of registrations) {
    const email = examReminderEmail({
      studentName: registration.profile.name,
      examName: registration.examDate.exam.name,
      examDate: registration.examDate.examDate,
      info: registration.examDate.info,
      instructions: registration.examDate.instructions,
    });

    const result = await sendMailFn({ to: registration.profile.email, ...email });

    if (result.ok) {
      // Solo se registra el envío tras un éxito confirmado: si Mailgun falla,
      // la inscripción sigue elegible en el siguiente tick del cron.
      await db.reminderLog.create({
        data: { examDateId: registration.examDateId, registrationId: registration.id },
      });
      sent++;
    } else {
      failed++;
    }
  }

  return { eligible: registrations.length, sent, failed };
}
