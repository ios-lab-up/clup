"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { sendMail } from "@/lib/mail/send-mail";
import { getStorage } from "@/lib/storage";
import { registrationApprovedEmail } from "@/lib/mail/templates/registration-approved";
import { approveRegistration as approveRegistrationService, rejectRegistration as rejectRegistrationService } from "@/services/registration-service";
import { rejectRegistrationSchema } from "@/lib/validations/registration.schema";
import type { ActionResult } from "@/types";

export async function approveRegistration(registrationId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const registration = await approveRegistrationService(prisma, registrationId);

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "registration.approve",
      entity: "Registration",
      entityId: registrationId,
    });

    const email = registrationApprovedEmail({
      studentName: registration.profile.name,
      examName: registration.examDate.exam.name,
      termName: `${registration.examDate.term.name} ${registration.examDate.term.year}`,
      examDate: registration.examDate.examDate,
      info: registration.examDate.info,
    });
    await sendMail({ to: registration.profile.email, ...email });

    revalidatePath("/admin/inscripciones");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function rejectRegistration(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { registrationId, reason } = rejectRegistrationSchema.parse(input);

    await rejectRegistrationService(prisma, registrationId, reason ?? null);

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "registration.reject",
      entity: "Registration",
      entityId: registrationId,
      metadata: { reason },
    });

    revalidatePath("/admin/inscripciones");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

/**
 * Elimina por completo una inscripción: sus documentos en R2 (best-effort),
 * y las filas relacionadas (documentos, resultado, reminders) que caen por
 * cascade al borrar la inscripción.
 */
export async function deleteRegistration(registrationId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { documents: true },
    });
    if (!registration) {
      return { ok: false, message: "The registration no longer exists." };
    }

    // Limpieza de storage: no bloquea el borrado si R2 falla en algún objeto.
    const storage = getStorage();
    await Promise.allSettled(
      registration.documents.map((document) => storage.deleteObject(document.storageKey)),
    );

    await prisma.registration.delete({ where: { id: registrationId } });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "registration.delete",
      entity: "Registration",
      entityId: registrationId,
    });

    revalidatePath("/admin/inscripciones");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
