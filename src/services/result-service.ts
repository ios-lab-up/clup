import type { PrismaClient } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";

/** score >= passingScore → aprobado (el empate cuenta como aprobado). */
export function computePassed(score: number, passingScore: number): boolean {
  return score >= passingScore;
}

/**
 * Datos precargados para resolver el puntaje mínimo de un examen sin ir a la
 * DB por cada alumno (lo usa el import masivo de CSV, fila por fila).
 */
export interface PassingScoreContext {
  examDefault: number;
  byCareerId: Map<string, number>;
  byFacultyId: Map<string, number>;
  careerFacultyId: Map<string, string>;
}

/**
 * Puntaje mínimo aplicable a un alumno: carrera exacta → facultad de esa
 * carrera → default general del examen. Docentes/externos (sin carrera) caen
 * siempre al default.
 */
export function resolvePassingScore(
  ctx: PassingScoreContext,
  careerId: string | null | undefined,
): number {
  if (careerId) {
    const careerScore = ctx.byCareerId.get(careerId);
    if (careerScore !== undefined) return careerScore;

    const facultyId = ctx.careerFacultyId.get(careerId);
    if (facultyId) {
      const facultyScore = ctx.byFacultyId.get(facultyId);
      if (facultyScore !== undefined) return facultyScore;
    }
  }
  return ctx.examDefault;
}

export async function buildPassingScoreContext(
  db: PrismaClient,
  examId: string,
): Promise<PassingScoreContext> {
  const [exam, overrides, careers] = await Promise.all([
    db.exam.findUnique({ where: { id: examId }, select: { passingScore: true } }),
    db.examPassingScore.findMany({
      where: { examId },
      select: { facultyId: true, careerId: true, score: true },
    }),
    db.career.findMany({ select: { id: true, facultyId: true } }),
  ]);

  if (!exam) throw new AppError("El examen no existe.");

  const byCareerId = new Map<string, number>();
  const byFacultyId = new Map<string, number>();
  for (const override of overrides) {
    if (override.careerId) byCareerId.set(override.careerId, override.score);
    else if (override.facultyId) byFacultyId.set(override.facultyId, override.score);
  }

  const careerFacultyId = new Map(careers.map((career) => [career.id, career.facultyId]));

  return { examDefault: exam.passingScore, byCareerId, byFacultyId, careerFacultyId };
}

export async function captureResult(
  db: PrismaClient,
  input: { registrationId: string; score: number },
) {
  const registration = await db.registration.findUnique({
    where: { id: input.registrationId },
    include: {
      profile: { select: { careerId: true } },
      examDate: { select: { examId: true } },
    },
  });

  if (!registration) {
    throw new AppError("Inscripción no encontrada.");
  }

  const ctx = await buildPassingScoreContext(db, registration.examDate.examId);
  const passingScore = resolvePassingScore(ctx, registration.profile.careerId);
  const passed = computePassed(input.score, passingScore);

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
