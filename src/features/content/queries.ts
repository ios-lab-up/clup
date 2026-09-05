import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function listActiveFaqs() {
  return prisma.fAQ.findMany({ where: { active: true }, orderBy: { order: "asc" } });
}

export async function listActiveInstructions() {
  return prisma.instruction.findMany({ where: { active: true }, orderBy: { order: "asc" } });
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  return Object.fromEntries(keys.map((key) => [key, map.get(key) ?? null]));
}
