import "server-only";
import Mailgun from "mailgun.js";
import FormData from "form-data";

type MailgunClient = ReturnType<InstanceType<typeof Mailgun>["client"]>;

let client: MailgunClient | null = null;

/** Devuelve null si no hay API key configurada (entorno de desarrollo). */
export function getMailgunClient(): MailgunClient | null {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    const mailgun = new Mailgun(FormData);
    client = mailgun.client({ username: "api", key: apiKey });
  }
  return client;
}

export function getMailgunDomain(): string {
  const domain = process.env.MAILGUN_DOMAIN;
  if (!domain) throw new Error("Falta la variable de entorno MAILGUN_DOMAIN");
  return domain;
}

export function getMailFrom(): string {
  return process.env.MAILGUN_FROM ?? "CLUP <no-reply@clup.up.edu.mx>";
}
