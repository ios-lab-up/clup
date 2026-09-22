"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { recordAuditLog } from "@/lib/audit";
import { toUserMessage } from "@/lib/errors";
import { emailSettingToggleSchema, reminderScheduleSchema } from "@/lib/validations/email-settings.schema";
import type { ActionResult } from "@/types";

function revalidateEmailSettings() {
  revalidatePath("/admin/configuracion");
}

export async function setEmailSettingEnabled(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const { type, enabled } = emailSettingToggleSchema.parse(input);

    await prisma.emailSetting.upsert({
      where: { type },
      update: { enabled },
      create: { type, enabled },
    });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: enabled ? "email_setting.enable" : "email_setting.disable",
      entity: "EmailSetting",
      entityId: type,
    });

    revalidateEmailSettings();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createReminderSchedule(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = reminderScheduleSchema.parse(input);
    const schedule = await prisma.reminderSchedule.create({ data });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "reminder_schedule.create",
      entity: "ReminderSchedule",
      entityId: schedule.id,
      metadata: { minutesBefore: data.minutesBefore },
    });

    revalidateEmailSettings();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateReminderSchedule(id: string, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const data = reminderScheduleSchema.parse(input);
    await prisma.reminderSchedule.update({ where: { id }, data });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "reminder_schedule.update",
      entity: "ReminderSchedule",
      entityId: id,
      metadata: { minutesBefore: data.minutesBefore },
    });

    revalidateEmailSettings();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setReminderScheduleActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.reminderSchedule.update({ where: { id }, data: { active } });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: active ? "reminder_schedule.activate" : "reminder_schedule.deactivate",
      entity: "ReminderSchedule",
      entityId: id,
    });

    revalidateEmailSettings();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deleteReminderSchedule(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.reminderSchedule.delete({ where: { id } });

    await recordAuditLog(prisma, {
      actorProfileId: admin.id,
      action: "reminder_schedule.delete",
      entity: "ReminderSchedule",
      entityId: id,
    });

    revalidateEmailSettings();
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
