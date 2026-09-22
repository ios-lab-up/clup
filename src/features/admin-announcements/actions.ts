"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { assertValidContentImageKey } from "@/lib/storage/content-image";
import { announcementSchema } from "@/lib/validations/content.schema";
import type { ActionResult } from "@/types";

function revalidatePublicAnnouncements() {
  revalidatePath("/");
}

export async function createAnnouncement(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = announcementSchema.parse(input);
    await assertValidContentImageKey(data.imageKey);
    const announcement = await prisma.announcement.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "announcement.create",
      entity: "Announcement",
      entityId: announcement.id,
    });
    revalidatePublicAnnouncements();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateAnnouncement(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = announcementSchema.parse(input);
    await assertValidContentImageKey(data.imageKey);
    await prisma.announcement.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "announcement.update",
      entity: "Announcement",
      entityId: id,
    });
    revalidatePublicAnnouncements();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.announcement.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "announcement.delete",
      entity: "Announcement",
      entityId: id,
    });
    revalidatePublicAnnouncements();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.announcement.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "announcement.activate" : "announcement.deactivate",
      entity: "Announcement",
      entityId: id,
    });
    revalidatePublicAnnouncements();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function reorderAnnouncements(orderedIds: string[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.announcement.update({ where: { id }, data: { order: index } }),
      ),
    );
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "announcement.reorder",
      entity: "Announcement",
      entityId: "bulk",
      metadata: { orderedIds },
    });
    revalidatePublicAnnouncements();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
