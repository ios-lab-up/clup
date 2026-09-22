"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { campusSchema } from "@/lib/validations/catalog.schema";
import type { ActionResult } from "@/types";

function revalidateCampusCatalog() {
  revalidatePath("/admin/configuracion");
  revalidatePath("/onboarding");
  revalidatePath("/perfil");
}

export async function createCampus(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = campusSchema.parse(input);
    const campus = await prisma.campus.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "campus.create",
      entity: "Campus",
      entityId: campus.id,
    });
    revalidateCampusCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateCampus(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = campusSchema.parse(input);
    await prisma.campus.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "campus.update",
      entity: "Campus",
      entityId: id,
    });
    revalidateCampusCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setCampusActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.campus.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "campus.activate" : "campus.deactivate",
      entity: "Campus",
      entityId: id,
    });
    revalidateCampusCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteCampus(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const inUse = await prisma.profile.count({ where: { campusId: id } });
    if (inUse > 0) {
      throw new AppError(`${inUse} alumno(s) tienen este campus. Desactívalo en vez de eliminarlo.`);
    }
    await prisma.campus.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "campus.delete",
      entity: "Campus",
      entityId: id,
    });
    revalidateCampusCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
