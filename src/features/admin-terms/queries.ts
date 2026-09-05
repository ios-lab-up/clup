import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listTerms() {
  await requireAdmin();
  return prisma.term.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: { _count: { select: { examDates: true } } },
  });
}

/** Terms con sus fechas de examen, para la vista de tabs de /admin/terms. */
export async function listTermsWithExamDates() {
  await requireAdmin();
  return prisma.term.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      examDates: {
        include: { exam: true, _count: { select: { registrations: true } } },
        orderBy: { examDate: "desc" },
      },
    },
  });
}
