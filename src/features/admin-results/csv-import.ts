"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import {
  commitResultsImport,
  previewResultsImport,
  type CommitResultsImportRow,
  type CsvImportPreview,
} from "@/services/csv-import-service";
import { csvResultsSelectionSchema } from "@/lib/validations/csv-results.schema";
import type { ActionResult } from "@/types";

export async function previewResultsImportAction(formData: FormData): Promise<ActionResult<CsvImportPreview>> {
  try {
    await requireAdmin();
    const { examDateId } = csvResultsSelectionSchema.parse({
      examDateId: formData.get("examDateId"),
    });

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new AppError("Selecciona un archivo CSV.");
    }

    const content = await file.text();
    const preview = await previewResultsImport(prisma, examDateId, content);
    return { ok: true, data: preview };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function commitResultsImportAction(rows: CommitResultsImportRow[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (rows.length === 0) {
      throw new AppError("There are no valid rows to import.");
    }

    await commitResultsImport(prisma, rows, admin.id);
    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "result.bulk_import",
      entity: "Result",
      entityId: "bulk",
      metadata: { count: rows.length },
    });

    revalidatePath("/admin/resultados");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
