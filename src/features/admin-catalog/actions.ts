"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { slugify } from "@/lib/slugify";
import { careerSchema, facultySchema } from "@/lib/validations/catalog.schema";
import type { ActionResult } from "@/types";

function revalidateCatalog() {
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/examenes");
  revalidatePath("/onboarding");
}

async function uniqueFacultySlug(name: string, exceptId?: string): Promise<string> {
  const base = slugify(name) || "facultad";
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.faculty.findUnique({ where: { slug } });
    if (!existing || existing.id === exceptId) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function createFaculty(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = facultySchema.parse(input);
    const faculty = await prisma.faculty.create({
      data: { ...data, slug: await uniqueFacultySlug(data.name) },
    });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faculty.create",
      entity: "Faculty",
      entityId: faculty.id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateFaculty(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = facultySchema.parse(input);
    await prisma.faculty.update({
      where: { id },
      data: { ...data, slug: await uniqueFacultySlug(data.name, id) },
    });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faculty.update",
      entity: "Faculty",
      entityId: id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setFacultyActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.faculty.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "faculty.activate" : "faculty.deactivate",
      entity: "Faculty",
      entityId: id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteFaculty(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const careers = await prisma.career.count({ where: { facultyId: id } });
    if (careers > 0) {
      throw new AppError("Elimina o mueve primero las carreras de esta facultad.");
    }
    await prisma.faculty.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "faculty.delete",
      entity: "Faculty",
      entityId: id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createCareer(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = careerSchema.parse(input);
    const career = await prisma.career.create({ data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "career.create",
      entity: "Career",
      entityId: career.id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateCareer(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = careerSchema.parse(input);
    await prisma.career.update({ where: { id }, data });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "career.update",
      entity: "Career",
      entityId: id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setCareerActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.career.update({ where: { id }, data: { active } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "career.activate" : "career.deactivate",
      entity: "Career",
      entityId: id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteCareer(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const inUse = await prisma.profile.count({ where: { careerId: id } });
    if (inUse > 0) {
      throw new AppError(
        `${inUse} alumno(s) tienen esta carrera. Desactívala en vez de eliminarla.`,
      );
    }
    // Los overrides de puntaje se borran en cascada (onDelete: Cascade).
    await prisma.career.delete({ where: { id } });
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "career.delete",
      entity: "Career",
      entityId: id,
    });
    revalidateCatalog();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
