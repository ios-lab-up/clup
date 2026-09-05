import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export const KNOWN_SETTING_KEYS = [
  "payment_portal_url",
  "contact_email",
  "institution_name",
] as const;

export const SETTING_LABELS: Record<(typeof KNOWN_SETTING_KEYS)[number], string> = {
  payment_portal_url: "Payment portal URL",
  contact_email: "Contact email",
  institution_name: "Institution name",
};

export async function listSettings() {
  await requireAdmin();
  const settings = await prisma.setting.findMany();
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  return KNOWN_SETTING_KEYS.map((key) => ({ key, value: map.get(key) ?? "" }));
}
