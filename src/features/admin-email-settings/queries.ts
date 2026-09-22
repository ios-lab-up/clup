import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { EMAIL_NOTIFICATION_TYPES } from "@/lib/validations/email-settings.schema";

/** Los 5 tipos siempre listados, con enabled=true por default si aún no tienen fila. */
export async function listEmailSettings() {
  await requireAdmin();
  const settings = await prisma.emailSetting.findMany();
  const map = new Map(settings.map((setting) => [setting.type, setting.enabled]));
  return EMAIL_NOTIFICATION_TYPES.map((type) => ({ type, enabled: map.get(type) ?? true }));
}

export async function listReminderSchedules() {
  await requireAdmin();
  return prisma.reminderSchedule.findMany({ orderBy: { minutesBefore: "asc" } });
}
