import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listAllCampuses() {
  await requireAdmin();
  return prisma.campus.findMany({ orderBy: { order: "asc" } });
}
