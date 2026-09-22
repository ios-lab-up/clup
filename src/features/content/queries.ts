import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getStorage } from "@/lib/storage";
import { IMAGE_DOWNLOAD_URL_TTL_SECONDS } from "@/lib/constants";

export async function listActiveFaqs() {
  const faqs = await prisma.fAQ.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  return Promise.all(
    faqs.map(async (faq) => ({
      ...faq,
      imageUrl: faq.imageKey
        ? await getStorage().getDownloadUrl(faq.imageKey, IMAGE_DOWNLOAD_URL_TTL_SECONDS)
        : null,
    })),
  );
}

export async function listActiveAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return Promise.all(
    announcements.map(async (announcement) => ({
      ...announcement,
      imageUrl: announcement.imageKey
        ? await getStorage().getDownloadUrl(announcement.imageKey, IMAGE_DOWNLOAD_URL_TTL_SECONDS)
        : null,
    })),
  );
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
