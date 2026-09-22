"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { AppError, toUserMessage } from "@/lib/errors";
import { paymentPortalUrlSchema, settingSchema } from "@/lib/validations/settings.schema";
import type { ActionResult } from "@/types";

const URL_SETTING_KEYS = new Set(["payment_portal_url"]);

const INTEGER_SETTING_KEYS: Record<string, { min: number; max: number }> = {
  reminder_days_before: { min: 1, max: 30 },
};

export async function updateSetting(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { key, value } = settingSchema.parse(input);

    if (URL_SETTING_KEYS.has(key)) {
      paymentPortalUrlSchema.parse(value);
    }

    const integerRange = INTEGER_SETTING_KEYS[key];
    if (integerRange) {
      const parsedValue = Number(value);
      if (!Number.isInteger(parsedValue) || parsedValue < integerRange.min || parsedValue > integerRange.max) {
        throw new AppError(
          `El valor debe ser un número entero entre ${integerRange.min} y ${integerRange.max}.`,
        );
      }
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "setting.update",
      entity: "Setting",
      entityId: key,
    });

    revalidatePath("/");
    revalidatePath("/admin/configuracion");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
