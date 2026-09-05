"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { paymentPortalUrlSchema, settingSchema } from "@/lib/validations/settings.schema";
import type { ActionResult } from "@/types";

const URL_SETTING_KEYS = new Set(["payment_portal_url"]);

export async function updateSetting(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { key, value } = settingSchema.parse(input);

    if (URL_SETTING_KEYS.has(key)) {
      paymentPortalUrlSchema.parse(value);
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
