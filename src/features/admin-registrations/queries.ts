import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import type { RegistrationStatus } from "@/generated/prisma/client";

export interface RegistrationFilters {
  termId?: string;
  examId?: string;
  examDateId?: string;
  status?: RegistrationStatus;
  query?: string;
}

export async function listRegistrations(filters: RegistrationFilters) {
  await requireAdmin();

  return prisma.registration.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.query
        ? {
            profile: {
              OR: [
                { name: { contains: filters.query, mode: "insensitive" } },
                { email: { contains: filters.query, mode: "insensitive" } },
                { studentId: { contains: filters.query, mode: "insensitive" } },
              ],
            },
          }
        : {}),
      examDate: {
        ...(filters.termId ? { termId: filters.termId } : {}),
        ...(filters.examId ? { examId: filters.examId } : {}),
        ...(filters.examDateId ? { id: filters.examDateId } : {}),
      },
    },
    include: {
      profile: true,
      examDate: { include: { exam: true, term: true } },
      result: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRegistrationDetail(registrationId: string) {
  await requireAdmin();

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      profile: true,
      examDate: { include: { exam: true, term: true } },
      result: true,
      documents: true,
    },
  });

  if (!registration) notFound();
  return registration;
}
