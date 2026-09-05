import "server-only";
import { getMailFrom, getMailgunClient, getMailgunDomain } from "@/lib/mail/mailgun-client";

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendMailResult {
  ok: boolean;
  error?: unknown;
}

/**
 * Punto único de envío de correo. Nunca lanza — un fallo de Mailgun no debe
 * tumbar la operación principal (ej. aprobar una inscripción). Sin
 * MAILGUN_API_KEY configurada, cae a un provider de consola para que el
 * desarrollo local no requiera credenciales reales.
 */
export async function sendMail(payload: MailPayload): Promise<SendMailResult> {
  const client = getMailgunClient();

  if (!client) {
    console.log("[mail:console] ->", payload.to, "|", payload.subject);
    console.log(payload.text);
    return { ok: true };
  }

  try {
    await client.messages.create(getMailgunDomain(), {
      from: getMailFrom(),
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return { ok: true };
  } catch (error) {
    console.error("[mail:mailgun] send failed:", error);
    return { ok: false, error };
  }
}
