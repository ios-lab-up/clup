import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { getStorage } from "@/lib/storage";
import { IMAGE_DOWNLOAD_URL_TTL_SECONDS } from "@/lib/constants";

export async function listAllAnnouncements() {
  await requireAdmin();
  const announcements = await prisma.announcement.findMany({ orderBy: { order: "asc" } });
  return Promise.all(
    announcements.map(async (announcement) => ({
      ...announcement,
      imageUrl: announcement.imageKey
        ? await getStorage().getDownloadUrl(announcement.imageKey, IMAGE_DOWNLOAD_URL_TTL_SECONDS)
        : null,
    })),
  );
}
