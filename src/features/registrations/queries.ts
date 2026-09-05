import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { notFound } from "next/navigation";

export async function getMyRegistrations() {
  const profile = await requireAuth();

  return prisma.registration.findMany({
    where: { profileId: profile.id },
    include: {
      examDate: { include: { exam: true, term: true } },
      result: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyRegistrationDetail(registrationId: string) {
  const profile = await requireAuth();

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      examDate: { include: { exam: true, term: true } },
      result: true,
      documents: true,
    },
  });

  if (!registration || registration.profileId !== profile.id) {
    notFound();
  }

  return registration;
}
