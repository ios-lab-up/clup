"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { examDateSchema } from "@/lib/validations/exam-date.schema";
import type { ActionResult } from "@/types";

function revalidatePublicExams() {
  revalidatePath("/");
  revalidatePath("/examenes");
}

export async function createExamDate(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = examDateSchema.parse(input);
    const examDate = await prisma.examDate.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "examdate.create",
      entity: "ExamDate",
      entityId: examDate.id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateExamDate(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = examDateSchema.parse(input);

    await prisma.examDate.update({ where: { id }, data });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "examdate.update",
      entity: "ExamDate",
      entityId: id,
    });

    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setExamDateActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.examDate.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "examdate.activate" : "examdate.deactivate",
      entity: "ExamDate",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteExamDate(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const registrationCount = await prisma.registration.count({ where: { examDateId: id } });
    if (registrationCount > 0) {
      throw new AppError(
        "You can't delete a date that has registrations. Deactivate it instead.",
      );
    }

    await prisma.examDate.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "examdate.delete",
      entity: "ExamDate",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
