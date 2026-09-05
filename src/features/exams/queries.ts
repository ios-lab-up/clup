import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function listPublicExamDates() {
  return prisma.examDate.findMany({
    where: { active: true, exam: { active: true }, term: { active: true } },
    include: { exam: true, term: true },
    orderBy: { examDate: "asc" },
  });
}

export async function getPublicExamDateDetail(examDateId: string) {
  return prisma.examDate.findFirst({
    where: { id: examDateId, active: true },
    include: { exam: true, term: true },
  });
}
