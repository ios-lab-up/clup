"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { examSchema } from "@/lib/validations/content.schema";
import { examPassingScoreSchema } from "@/lib/validations/exam-passing-score.schema";
import type { ActionResult } from "@/types";

function revalidatePublicExams() {
  revalidatePath("/");
  revalidatePath("/examenes");
}

export async function createExam(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = examSchema.parse(input);
    const exam = await prisma.exam.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.create",
      entity: "Exam",
      entityId: exam.id,
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
    const data = examSchema.parse(input);
    await prisma.exam.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.update",
      entity: "Exam",
      entityId: id,
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

/**
 * Crea o actualiza el override del puntaje mínimo de un examen para una
 * facultad o una carrera. Upsert sobre la unique key correspondiente.
 */
export async function upsertExamPassingScore(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { examId, scope, targetId, score } = examPassingScoreSchema.parse(input);

    if (scope === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({ where: { id: targetId } });
      if (!faculty) throw new AppError("La facultad no existe.");
      if (faculty.isExternal) {
        throw new AppError("La facultad externa siempre usa el mínimo general del examen.");
      }
      await prisma.examPassingScore.upsert({
        where: { examId_facultyId: { examId, facultyId: targetId } },
        update: { score },
        create: { examId, facultyId: targetId, score },
      });
    } else {
      const career = await prisma.career.findUnique({ where: { id: targetId } });
      if (!career) throw new AppError("La carrera no existe.");
      await prisma.examPassingScore.upsert({
        where: { examId_careerId: { examId, careerId: targetId } },
        update: { score },
        create: { examId, careerId: targetId, score },
      });
    }

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.passing_score_override",
      entity: "Exam",
      entityId: examId,
      metadata: { scope, targetId, score },
    });
    revalidatePublicExams();
    revalidatePath("/admin/examenes");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteExamPassingScore(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const removed = await prisma.examPassingScore.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "exam.passing_score_override_remove",
      entity: "Exam",
      entityId: removed.examId,
      metadata: { facultyId: removed.facultyId, careerId: removed.careerId },
    });
    revalidatePublicExams();
    revalidatePath("/admin/examenes");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
