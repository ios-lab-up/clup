import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { getStorage } from "@/lib/storage";
import { IMAGE_DOWNLOAD_URL_TTL_SECONDS } from "@/lib/constants";

export async function listAllFaqs() {
  await requireAdmin();
  const faqs = await prisma.fAQ.findMany({ orderBy: { order: "asc" } });
  return Promise.all(
    faqs.map(async (faq) => ({
      ...faq,
      imageUrl: faq.imageKey
        ? await getStorage().getDownloadUrl(faq.imageKey, IMAGE_DOWNLOAD_URL_TTL_SECONDS)
        : null,
    })),
  );
}
