import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listExams() {
  await requireAdmin();
  return prisma.exam.findMany({ orderBy: { name: "asc" } });
}
