"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { sendMail } from "@/lib/mail/send-mail";
import { resultPublishedEmail } from "@/lib/mail/templates/result-published";
import { captureResult as captureResultService, publishResult as publishResultService } from "@/services/result-service";
import { captureResultSchema } from "@/lib/validations/registration.schema";
import type { ActionResult } from "@/types";

export async function captureResult(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { registrationId, score } = captureResultSchema.parse(input);

    await captureResultService(prisma, { registrationId, score });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "result.capture",
      entity: "Registration",
      entityId: registrationId,
      metadata: { score },
    });

    revalidatePath("/admin/resultados");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function publishResult(registrationId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await publishResultService(prisma, registrationId);

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "result.publish",
      entity: "Registration",
      entityId: registrationId,
    });

    const registration = await prisma.registration.findUniqueOrThrow({
      where: { id: registrationId },
      include: { profile: true, examDate: { include: { exam: true } }, result: true },
    });

    if (registration.result) {
      // Por privacidad, el correo NO incluye el puntaje ni si aprobó; solo
      // avisa que ya están listos para revisar en el panel del alumno.
      const email = resultPublishedEmail({
        studentName: registration.profile.name,
        examName: registration.examDate.exam.name,
      });
      await sendMail({ to: registration.profile.email, ...email });
    }

    revalidatePath("/admin/resultados");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
