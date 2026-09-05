"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { examSchema } from "@/lib/validations/content.schema";
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
