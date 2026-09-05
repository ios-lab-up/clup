import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listAdmins() {
  await requireAdmin();
  return prisma.profile.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
}
