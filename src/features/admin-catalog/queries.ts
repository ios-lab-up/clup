import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

/** Todas las facultades (activas e inactivas) con sus carreras — para el admin. */
export async function listCatalog() {
  await requireAdmin();
  return prisma.faculty.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      careers: { orderBy: [{ order: "asc" }, { name: "asc" }] },
    },
  });
}
