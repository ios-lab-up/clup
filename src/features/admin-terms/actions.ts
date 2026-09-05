"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { termSchema } from "@/lib/validations/content.schema";
import type { ActionResult } from "@/types";

function revalidatePublicExams() {
  revalidatePath("/");
  revalidatePath("/examenes");
}

export async function createTerm(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = termSchema.parse(input);
    const term = await prisma.term.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "term.create",
      entity: "Term",
      entityId: term.id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateTerm(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = termSchema.parse(input);
    await prisma.term.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "term.update",
      entity: "Term",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setTermActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.term.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "term.activate" : "term.deactivate",
      entity: "Term",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteTerm(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const examDateCount = await prisma.examDate.count({ where: { termId: id } });
    if (examDateCount > 0) {
      throw new AppError(
        "You can't delete a term that has exam dates. Deactivate it instead.",
      );
    }
    await prisma.term.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "term.delete",
      entity: "Term",
      entityId: id,
    });
    revalidatePublicExams();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
