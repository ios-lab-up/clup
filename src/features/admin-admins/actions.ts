"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import type { ActionResult } from "@/types";

const addAdminSchema = z.object({ email: z.email({ error: "Enter a valid email." }) });

/**
 * Si la persona ya tiene Profile (ya inició sesión alguna vez), se le
 * promueve. Si no, se crea un Profile "pre-invitado" sin clerkUserId, que se
 * enlaza automáticamente la primera vez que esa persona inicie sesión con
 * Clerk (ver lib/auth/current-profile.ts).
 */
export async function addAdmin(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { email } = addAdminSchema.parse(input);
    const normalizedEmail = email.trim().toLowerCase();

    const profile = await prisma.profile.upsert({
      where: { email: normalizedEmail },
      update: { role: "ADMIN" },
      create: { email: normalizedEmail, name: normalizedEmail, role: "ADMIN" },
    });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "admin.add",
      entity: "Profile",
      entityId: profile.id,
      metadata: { email: normalizedEmail },
    });

    revalidatePath("/admin/administradores");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function removeAdmin(profileId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    if (admin.id === profileId) {
      throw new AppError("No puedes quitarte a ti mismo como administrador.");
    }

    const adminCount = await prisma.profile.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new AppError("Debe existir al menos un administrador.");
    }

    await prisma.profile.update({ where: { id: profileId }, data: { role: "STUDENT" } });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "admin.remove",
      entity: "Profile",
      entityId: profileId,
    });

    revalidatePath("/admin/administradores");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
