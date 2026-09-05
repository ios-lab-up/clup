"use server";

import { requireAdmin } from "@/lib/auth/guards";
import { sendMail } from "@/lib/mail/send-mail";
import { toUserMessage } from "@/lib/errors";
import { examReminderEmail } from "@/lib/mail/templates/exam-reminder";
import { resultPublishedEmail } from "@/lib/mail/templates/result-published";
import type { ActionResult } from "@/types";

/** Envía al correo del admin actual una muestra del recordatorio (1 día antes). */
export async function sendTestReminderEmail(): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const email = examReminderEmail({
      studentName: admin.name,
      examName: "TOEIC (ejemplo)",
      examDate: tomorrow,
      info: "Este es un correo de PRUEBA enviado desde Configuración.",
      instructions: "Preséntate 30 minutos antes con tu credencial e identificación oficial.",
    });

    const result = await sendMail({ to: admin.email, ...email });
    if (!result.ok) {
      return { ok: false, message: "Couldn't send the test email. Check the Mailgun configuration." };
    }
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

/** Envía al correo del admin actual una muestra del resultado publicado. */
export async function sendTestResultEmail(): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const email = resultPublishedEmail({
      studentName: admin.name,
      examName: "TOEIC (ejemplo)",
    });

    const result = await sendMail({ to: admin.email, ...email });
    if (!result.ok) {
      return { ok: false, message: "Couldn't send the test email. Check the Mailgun configuration." };
    }
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
