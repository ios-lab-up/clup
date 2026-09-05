import type { PrismaClient } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";

/** score >= passingScore → aprobado (el empate cuenta como aprobado). */
export function computePassed(score: number, passingScore: number): boolean {
  return score >= passingScore;
}

export async function captureResult(
  db: PrismaClient,
  input: { registrationId: string; score: number },
) {
  const registration = await db.registration.findUnique({
    where: { id: input.registrationId },
    include: { examDate: { include: { exam: true } } },
  });

  if (!registration) {
    throw new AppError("Inscripción no encontrada.");
  }

  const passed = computePassed(input.score, registration.examDate.exam.passingScore);

  return db.result.upsert({
    where: { registrationId: input.registrationId },
    update: { score: input.score, passed },
    create: { registrationId: input.registrationId, score: input.score, passed },
  });
}

export async function publishResult(db: PrismaClient, registrationId: string) {
  const result = await db.result.findUnique({ where: { registrationId } });
  if (!result) {
    throw new AppError("Este resultado aún no ha sido capturado.");
  }

  return db.result.update({
    where: { registrationId },
    data: { published: true, publishedAt: new Date() },
  });
}

export interface UnpublishedResult {
  registrationId: string;
  studentName: string;
  studentEmail: string;
  examName: string;
  score: number;
  passed: boolean;
}

/** Resultados capturados (aprobados) para una fecha, aún sin publicar. */
export async function listUnpublishedResults(
  db: PrismaClient,
  examDateId: string,
): Promise<UnpublishedResult[]> {
  const registrations = await db.registration.findMany({
    where: { examDateId, status: "APPROVED", result: { is: { published: false } } },
    include: { profile: true, result: true, examDate: { include: { exam: true } } },
  });

  return registrations
    .filter((registration) => registration.result)
    .map((registration) => ({
      registrationId: registration.id,
      studentName: registration.profile.name,
      studentEmail: registration.profile.email,
      examName: registration.examDate.exam.name,
      score: registration.result!.score,
      passed: registration.result!.passed,
    }));
}

/** Publica en bloque los resultados de las inscripciones dadas. */
export async function publishResultsForRegistrations(db: PrismaClient, registrationIds: string[]) {
  const publishedAt = new Date();
  await db.$transaction(
    registrationIds.map((registrationId) =>
      db.result.update({ where: { registrationId }, data: { published: true, publishedAt } }),
    ),
  );
}
