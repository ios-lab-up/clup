"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { instructionSchema } from "@/lib/validations/content.schema";
import type { ActionResult } from "@/types";

function revalidatePublicInstructions() {
  revalidatePath("/");
  revalidatePath("/instrucciones");
}

export async function createInstruction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = instructionSchema.parse(input);
    const instruction = await prisma.instruction.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "instruction.create",
      entity: "Instruction",
      entityId: instruction.id,
    });
    revalidatePublicInstructions();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateInstruction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = instructionSchema.parse(input);
    await prisma.instruction.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "instruction.update",
      entity: "Instruction",
      entityId: id,
    });
    revalidatePublicInstructions();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteInstruction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.instruction.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "instruction.delete",
      entity: "Instruction",
      entityId: id,
    });
    revalidatePublicInstructions();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setInstructionActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.instruction.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "instruction.activate" : "instruction.deactivate",
      entity: "Instruction",
      entityId: id,
    });
    revalidatePublicInstructions();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function reorderInstructions(orderedIds: string[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.instruction.update({ where: { id }, data: { order: index } }),
      ),
    );
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "instruction.reorder",
      entity: "Instruction",
      entityId: "bulk",
      metadata: { orderedIds },
    });
    revalidatePublicInstructions();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
