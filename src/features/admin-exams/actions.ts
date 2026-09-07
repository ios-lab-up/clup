"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { examSchema } from "@/lib/validations/content.schema";
import type { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/types";

function revalidatePublicExams() {
  revalidatePath("/");
  revalidatePath("/examenes");
  revalidatePath("/admin/examenes");
}

type OverrideInput = { scope: "FACULTY" | "CAREER"; targetId: string; score: number };

/**
 * Reemplaza el set completo de overrides de puntaje de un examen. Se hace por
 * "borrar todo y recrear" dentro de la misma transacción del create/update —
 * los ids de ExamPassingScore no se referencian desde ningún otro lado.
 */
async function replaceOverrides(
  tx: Prisma.TransactionClient,
  examId: string,
  overrides: OverrideInput[],
) {
  // Dedupe por ámbito+destino (el cliente ya lo evita; última gana).
  const deduped = new Map<string, OverrideInput>();
  for (const override of overrides) {
    deduped.set(`${override.scope}:${override.targetId}`, override);
  }
  const rows = [...deduped.values()];

  const facultyIds = rows.filter((r) => r.scope === "FACULTY").map((r) => r.targetId);
  const careerIds = rows.filter((r) => r.scope === "CAREER").map((r) => r.targetId);

  const [faculties, careers] = await Promise.all([
    facultyIds.length
      ? tx.faculty.findMany({ where: { id: { in: facultyIds } }, select: { id: true, isExternal: true } })
      : [],
    careerIds.length
      ? tx.career.findMany({ where: { id: { in: careerIds } }, select: { id: true } })
      : [],
  ]);
  const facultyById = new Map(faculties.map((f) => [f.id, f]));
  const careerIdSet = new Set(careers.map((c) => c.id));

  for (const row of rows) {
    if (row.scope === "FACULTY") {
      const faculty = facultyById.get(row.targetId);
      if (!faculty) throw new AppError("Una de las facultades seleccionadas ya no existe.");
      if (faculty.isExternal) {
        throw new AppError("La facultad externa siempre usa el mínimo general del examen.");
      }
    } else if (!careerIdSet.has(row.targetId)) {
      throw new AppError("Una de las carreras seleccionadas ya no existe.");
    }
  }

  await tx.examPassingScore.deleteMany({ where: { examId } });
  if (rows.length > 0) {
    await tx.examPassingScore.createMany({
      data: rows.map((row) => ({
        examId,
        facultyId: row.scope === "FACULTY" ? row.targetId : null,
        careerId: row.scope === "CAREER" ? row.targetId : null,
        score: row.score,
      })),
    });
  }
}

export async function createExam(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { overrides, ...data } = examSchema.parse(input);

    const exam = await prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({ data });
      await replaceOverrides(tx, created.id, overrides);
      return created;
    });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.create",
      entity: "Exam",
      entityId: exam.id,
      metadata: { overrides: overrides.length },
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateExam(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { overrides, ...data } = examSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      await tx.exam.update({ where: { id }, data });
      await replaceOverrides(tx, id, overrides);
    });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.update",
      entity: "Exam",
      entityId: id,
      metadata: { overrides: overrides.length },
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setExamActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.exam.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "exam.activate" : "exam.deactivate",
      entity: "Exam",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteExam(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const examDates = await prisma.examDate.count({ where: { examId: id } });
    if (examDates > 0) {
      throw new AppError(
        `Este examen tiene ${examDates} fecha(s) de examen. Elimínalas primero o desactiva el examen.`,
      );
    }

    // Los overrides de puntaje (ExamPassingScore) se borran en cascada.
    await prisma.exam.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.delete",
      entity: "Exam",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
