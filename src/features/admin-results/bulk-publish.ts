"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { sendMail } from "@/lib/mail/send-mail";
import { resultPublishedEmail } from "@/lib/mail/templates/result-published";
import {
  listUnpublishedResults,
  publishResultsForRegistrations,
  type UnpublishedResult,
} from "@/services/result-service";
import type { ActionResult } from "@/types";

export async function previewBulkPublish(examDateId: string): Promise<ActionResult<UnpublishedResult[]>> {
  try {
    await requireAdmin();
    if (!examDateId) throw new AppError("Selecciona una fecha de examen.");
    const results = await listUnpublishedResults(prisma, examDateId);
    return { ok: true, data: results };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function commitBulkPublish(examDateId: string): Promise<ActionResult<{ count: number }>> {
  try {
    const admin = await requireAdmin();
    const results = await listUnpublishedResults(prisma, examDateId);

    if (results.length === 0) {
      throw new AppError("No hay resultados pendientes de publicar para esta fecha.");
    }

    await publishResultsForRegistrations(
      prisma,
      results.map((result) => result.registrationId),
    );

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "result.bulk_publish",
      entity: "ExamDate",
      entityId: examDateId,
      metadata: { count: results.length },
    });

    for (const result of results) {
      const email = resultPublishedEmail({ studentName: result.studentName, examName: result.examName });
      await sendMail({ to: result.studentEmail, ...email });
    }

    revalidatePath("/admin/resultados");
    return { ok: true, data: { count: results.length } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
