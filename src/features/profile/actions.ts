"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireOnboarding } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import type { ActionResult } from "@/types";

const updateCareerSchema = z.object({
  facultyId: z.string().min(1),
  careerId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

/** El alumno puede corregir su facultad/carrera desde su perfil. La matrícula no. */
export async function updateMyCareer(input: unknown): Promise<ActionResult> {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = cookieLocale === "es" ? "es" : "en";
  const [tOnboarding, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "Onboarding" }),
    getTranslations({ locale, namespace: "Errors" }),
  ]);

  try {
    const profile = await requireOnboarding();
    const parsed = updateCareerSchema.parse(input);

    const faculty = await prisma.faculty.findUnique({ where: { id: parsed.facultyId } });
    if (!faculty || !faculty.active) throw new AppError(tOnboarding("selectFaculty"));

    let careerId: string | null = null;
    if (!faculty.isExternal) {
      if (!parsed.careerId) throw new AppError(tOnboarding("selectCareer"));
      const career = await prisma.career.findUnique({ where: { id: parsed.careerId } });
      if (!career || !career.active || career.facultyId !== faculty.id) {
        throw new AppError(tOnboarding("selectCareer"));
      }
      careerId = career.id;
    }

    await prisma.profile.update({ where: { id: profile.id }, data: { careerId } });
    await recordAuditLog(prisma, {
      actorProfileId: profile.id,
      action: "profile.career_update",
      entity: "Profile",
      entityId: profile.id,
      metadata: { careerId, facultyId: faculty.id },
    });

    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error, tErrors("generic")) };
  }
}
