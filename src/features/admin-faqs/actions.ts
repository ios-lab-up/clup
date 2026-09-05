"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { faqSchema } from "@/lib/validations/content.schema";
import type { ActionResult } from "@/types";

function revalidatePublicFaqs() {
  revalidatePath("/");
  revalidatePath("/faqs");
}

export async function createFaq(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = faqSchema.parse(input);
    const faq = await prisma.fAQ.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faq.create",
      entity: "FAQ",
      entityId: faq.id,
    });
    revalidatePublicFaqs();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateFaq(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = faqSchema.parse(input);
    await prisma.fAQ.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faq.update",
      entity: "FAQ",
      entityId: id,
    });
    revalidatePublicFaqs();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.fAQ.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faq.delete",
      entity: "FAQ",
      entityId: id,
    });
    revalidatePublicFaqs();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setFaqActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.fAQ.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "faq.activate" : "faq.deactivate",
      entity: "FAQ",
      entityId: id,
    });
    revalidatePublicFaqs();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function reorderFaqs(orderedIds: string[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.fAQ.update({ where: { id }, data: { order: index } })),
    );
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faq.reorder",
      entity: "FAQ",
      entityId: "bulk",
      metadata: { orderedIds },
    });
    revalidatePublicFaqs();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
