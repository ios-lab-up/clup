import type { PrismaClient, RegistrationStatus } from "@/generated/prisma/client";
import { toCsv } from "@/lib/csv";

export interface RegistrationExportFilters {
  termId?: string;
  examId?: string;
  examDateId?: string;
  status?: RegistrationStatus;
  profileId?: string;
}

function buildRegistrationWhere(filters: RegistrationExportFilters) {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.profileId ? { profileId: filters.profileId } : {}),
    examDate: {
      ...(filters.termId ? { termId: filters.termId } : {}),
      ...(filters.examId ? { examId: filters.examId } : {}),
      ...(filters.examDateId ? { id: filters.examDateId } : {}),
    },
  };
}

const REGISTRATION_COLUMNS = ["ID", "Nombre", "Email", "Examen", "Term", "Fecha", "Estado"] as const;

export async function exportRegistrationsCsv(
  db: PrismaClient,
  filters: RegistrationExportFilters,
): Promise<string> {
  const registrations = await db.registration.findMany({
    where: buildRegistrationWhere(filters),
    include: { profile: true, examDate: { include: { exam: true, term: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = registrations.map((registration) => ({
    ID: registration.profile.studentId ?? "",
    Nombre: registration.profile.name,
    Email: registration.profile.email,
    Examen: registration.examDate.exam.name,
    Term: `${registration.examDate.term.name} ${registration.examDate.term.year}`,
    Fecha: registration.examDate.examDate.toISOString(),
    Estado: registration.status,
  }));

  return toCsv(rows, [...REGISTRATION_COLUMNS]);
}

const RESULT_COLUMNS = [
  "ID",
  "Nombre",
  "Email",
  "Examen",
  "Term",
  "Fecha",
  "Puntaje",
  "Resultado",
] as const;

export async function exportResultsCsv(
  db: PrismaClient,
  filters: RegistrationExportFilters,
): Promise<string> {
  const registrations = await db.registration.findMany({
    where: { ...buildRegistrationWhere(filters), result: { isNot: null } },
    include: { profile: true, examDate: { include: { exam: true, term: true } }, result: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = registrations
    .filter((registration) => registration.result)
    .map((registration) => ({
      ID: registration.profile.studentId ?? "",
      Nombre: registration.profile.name,
      Email: registration.profile.email,
      Examen: registration.examDate.exam.name,
      Term: `${registration.examDate.term.name} ${registration.examDate.term.year}`,
      Fecha: registration.examDate.examDate.toISOString(),
      Puntaje: registration.result!.score,
      Resultado: registration.result!.passed ? "APROBADO" : "NO APROBADO",
    }));

  return toCsv(rows, [...RESULT_COLUMNS]);
}
