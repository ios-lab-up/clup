import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listExams() {
  await requireAdmin();
  return prisma.exam.findMany({
    orderBy: { name: "asc" },
    include: {
      passingScores: {
        include: {
          faculty: { select: { name: true } },
          career: { select: { name: true } },
        },
        orderBy: { score: "asc" },
      },
    },
  });
}

/** Facultades activas con carreras activas — para los selects de override. */
export async function listCatalogForOverrides() {
  await requireAdmin();
  return prisma.faculty.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      isExternal: true,
      careers: {
        where: { active: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true },
      },
    },
  });
}
