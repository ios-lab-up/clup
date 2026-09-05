import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function getOverviewStats() {
  await requireAdmin();

  const [activeTerms, activeExamDates, pendingRegistrations, approvedRegistrations, publishedResults] =
    await Promise.all([
      prisma.term.count({ where: { active: true } }),
      prisma.examDate.count({ where: { active: true } }),
      prisma.registration.count({ where: { status: "PENDING" } }),
      prisma.registration.count({ where: { status: "APPROVED" } }),
      prisma.result.count({ where: { published: true } }),
    ]);

  return { activeTerms, activeExamDates, pendingRegistrations, approvedRegistrations, publishedResults };
}

export async function getRecentRegistrations(limit = 5) {
  await requireAdmin();
  return prisma.registration.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { profile: true, examDate: { include: { exam: true, term: true } } },
  });
}
