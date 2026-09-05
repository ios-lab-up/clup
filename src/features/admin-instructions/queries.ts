import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listAllInstructions() {
  await requireAdmin();
  return prisma.instruction.findMany({ orderBy: { order: "asc" } });
}
