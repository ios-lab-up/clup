import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listAllFaqs() {
  await requireAdmin();
  return prisma.fAQ.findMany({ orderBy: { order: "asc" } });
}
