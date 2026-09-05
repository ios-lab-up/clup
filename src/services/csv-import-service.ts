import type { PrismaClient } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { parseCsv } from "@/lib/csv";
import { CSV_RESULTS_REQUIRED_HEADERS, csvResultRowSchema } from "@/lib/validations/csv-results.schema";
import { computePassed } from "@/services/result-service";

export type CsvImportRowStatus = "ok" | "overwrite" | "error";

export interface CsvImportRowPreview {
  index: number;
  studentId: string;
  studentName?: string;
  score: number;
  status: CsvImportRowStatus;
  message?: string;
  registrationId?: string;
  passed?: boolean;
  previousScore?: number;
}

export interface CsvImportPreview {
  rows: CsvImportRowPreview[];
  summary: { ok: number; overwrite: number; error: number };
}

/**
 * Resuelve cada fila del CSV a una inscripción concreta sin escribir nada —
 * el admin debe confirmar explícitamente antes de que commitResultsImport
 * persista los cambios. Solo requiere la fecha de examen: term/examen se
 * derivan de ella, así no hay selects encadenados que puedan quedar vacíos.
 */
export async function previewResultsImport(
  db: PrismaClient,
  examDateId: string,
  csvContent: string,
): Promise<CsvImportPreview> {
  const { headers, rows, errors } = parseCsv(csvContent);

  const missingHeaders = CSV_RESULTS_REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new AppError(
      `El CSV debe tener las columnas: ${CSV_RESULTS_REQUIRED_HEADERS.join(", ")}.`,
    );
  }

  const examDate = await db.examDate.findUnique({
    where: { id: examDateId },
    include: { exam: true },
  });
  if (!examDate) {
    throw new AppError("La fecha de examen seleccionada ya no existe.");
  }

  const preview: CsvImportRowPreview[] = [];

  for (const parsedRow of rows) {
    const parsed = csvResultRowSchema.safeParse(parsedRow.row);
    if (!parsed.success) {
      preview.push({
        index: parsedRow.index,
        studentId: parsedRow.row.student_id ?? "",
        score: Number(parsedRow.row.score) || 0,
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Fila inválida.",
      });
      continue;
    }

    const { student_id: studentId, score } = parsed.data;

    const profile = await db.profile.findUnique({ where: { studentId } });
    if (!profile) {
      preview.push({
        index: parsedRow.index,
        studentId,
        score,
        status: "error",
        message: "Alumno no encontrado.",
      });
      continue;
    }

    const registration = await db.registration.findUnique({
      where: { profileId_examDateId: { profileId: profile.id, examDateId } },
      include: { result: true },
    });

    if (!registration) {
      preview.push({
        index: parsedRow.index,
        studentId,
        studentName: profile.name,
        score,
        status: "error",
        message: "Sin inscripción en este examen/fecha.",
      });
      continue;
    }

    if (registration.status !== "APPROVED") {
      preview.push({
        index: parsedRow.index,
        studentId,
        studentName: profile.name,
        score,
        status: "error",
        message: "Inscripción no aprobada.",
      });
      continue;
    }

    const passed = computePassed(score, examDate.exam.passingScore);

    if (registration.result) {
      preview.push({
        index: parsedRow.index,
        studentId,
        studentName: profile.name,
        score,
        status: "overwrite",
        registrationId: registration.id,
        passed,
        previousScore: registration.result.score,
      });
    } else {
      preview.push({
        index: parsedRow.index,
        studentId,
        studentName: profile.name,
        score,
        status: "ok",
        registrationId: registration.id,
        passed,
      });
    }
  }

  for (const message of errors) {
    preview.push({ index: -1, studentId: "", score: 0, status: "error", message });
  }

  const summary = {
    ok: preview.filter((row) => row.status === "ok").length,
    overwrite: preview.filter((row) => row.status === "overwrite").length,
    error: preview.filter((row) => row.status === "error").length,
  };

  return { rows: preview, summary };
}

export interface CommitResultsImportRow {
  registrationId: string;
  score: number;
  passed: boolean;
}

/** Se llama solo tras confirmación explícita del admin en la UI. */
export async function commitResultsImport(
  db: PrismaClient,
  rows: CommitResultsImportRow[],
  actorProfileId: string | null,
) {
  return db.$transaction(async (tx) => {
    for (const row of rows) {
      const existing = await tx.result.findUnique({ where: { registrationId: row.registrationId } });

      await tx.result.upsert({
        where: { registrationId: row.registrationId },
        update: { score: row.score, passed: row.passed },
        create: { registrationId: row.registrationId, score: row.score, passed: row.passed },
      });

      if (existing) {
        await tx.auditLog.create({
          data: {
            actorProfileId,
            action: "result.import_overwrite",
            entity: "Result",
            entityId: row.registrationId,
            metadata: { previousScore: existing.score, newScore: row.score },
          },
        });
      }
    }
  });
}
