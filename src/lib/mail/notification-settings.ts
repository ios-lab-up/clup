import "server-only";
import type { PrismaClient, EmailNotificationType } from "@/generated/prisma/client";

/**
 * Si no hay fila en EmailSetting para ese tipo, se asume enabled=true —
 * mantiene el comportamiento histórico (todo prendido) sin necesidad de
 * seedear nada extra.
 */
export async function isEmailNotificationEnabled(
  db: PrismaClient,
  type: EmailNotificationType,
): Promise<boolean> {
  const setting = await db.emailSetting.findUnique({ where: { type } });
  return setting?.enabled ?? true;
}
