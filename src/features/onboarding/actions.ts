"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { deriveStudentIdFromEmail } from "@/lib/student-id";
import { buildOnboardingSchema } from "@/lib/validations/onboarding.schema";
import type { ActionResult } from "@/types";

export async function completeOnboarding(input: unknown): Promise<ActionResult> {
  // El onboarding vive fuera del esquema de locale, así que el idioma se toma
  // de la cookie NEXT_LOCALE (la misma que usa el layout).
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = cookieLocale === "es" ? "es" : "en";
  const [tValidation, tOnboarding, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "Validation" }),
    getTranslations({ locale, namespace: "Onboarding" }),
    getTranslations({ locale, namespace: "Errors" }),
  ]);

  try {
    const profile = await requireAuth();

    if (profile.onboardedAt) {
      // Ya completado: nada que hacer (evita re-escribir si llega dos veces).
      return { ok: true, data: undefined };
    }

    const schema = buildOnboardingSchema({
      studentIdMinLength: tValidation("studentIdMinLength"),
      studentIdMaxLength: tValidation("studentIdMaxLength"),
      studentIdInvalidChars: tValidation("studentIdInvalidChars"),
      selectFaculty: tOnboarding("selectFaculty"),
      selectCareer: tOnboarding("selectCareer"),
    });
    const parsed = schema.parse(input);

    const faculty = await prisma.faculty.findUnique({ where: { id: parsed.facultyId } });
    if (!faculty || !faculty.active) {
      throw new AppError(tOnboarding("selectFaculty"));
    }

    let careerId: string | null = null;
    if (!faculty.isExternal) {
      if (!parsed.careerId) throw new AppError(tOnboarding("selectCareer"));
      const career = await prisma.career.findUnique({ where: { id: parsed.careerId } });
      if (!career || !career.active || career.facultyId !== faculty.id) {
        throw new AppError(tOnboarding("selectCareer"));
      }
      careerId = career.id;
    }

    // Si el correo es institucional numérico, la matrícula es autoritativa desde
    // el correo, no desde el form. La matrícula solo se fija si aún no existe
    // (una ya capturada solo la corrige un admin).
    const derived = deriveStudentIdFromEmail(profile.email);
    const studentId = profile.studentId ?? derived ?? parsed.studentId;

    try {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { studentId, careerId, onboardedAt: new Date() },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        throw new AppError(tOnboarding("studentIdTaken"));
      }
      throw error;
    }

    await recordAuditLog(prisma, {
      actorProfileId: profile.id,
      action: "profile.onboarded",
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
