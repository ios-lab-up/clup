import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendMail } from "@/lib/mail/send-mail";
import { sendExamReminders } from "@/services/reminder-service";
import { getSetting } from "@/features/content/queries";
import { CRON_SECRET_HEADER } from "@/lib/constants";

async function resolveReminderDaysBefore(): Promise<number> {
  const raw = await getSetting("reminder_days_before");
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get(CRON_SECRET_HEADER);
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Invocado periódicamente (cada hora) por el contenedor `cron` de
 * docker-compose. Idempotente: el ReminderLog garantiza que cada inscripción
 * reciba el recordatorio una sola vez, así que llamarlo de más no hace daño.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse(null, { status: 401 });
  }

  const daysBefore = await resolveReminderDaysBefore();
  const summary = await sendExamReminders(prisma, sendMail, new Date(), daysBefore);
  return NextResponse.json(summary);
}
