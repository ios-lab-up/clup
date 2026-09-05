import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function listExamDates() {
  await requireAdmin();
  return prisma.examDate.findMany({
    include: { exam: true, term: true, _count: { select: { registrations: true } } },
    orderBy: { examDate: "desc" },
  });
}

export async function getExamDateById(id: string) {
  await requireAdmin();
  return prisma.examDate.findUnique({ where: { id }, include: { exam: true, term: true } });
}
