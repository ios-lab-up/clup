-- CreateEnum
CREATE TYPE "EmailNotificationType" AS ENUM ('REGISTRATION_CREATED', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'RESULT_PUBLISHED', 'EXAM_REMINDER');

-- CreateTable
CREATE TABLE "EmailSetting" (
    "id" TEXT NOT NULL,
    "type" "EmailNotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderSchedule" (
    "id" TEXT NOT NULL,
    "minutesBefore" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSetting_type_key" ON "EmailSetting"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderSchedule_minutesBefore_key" ON "ReminderSchedule"("minutesBefore");

-- Estado inicial: los 5 tipos de correo activos (mismo comportamiento que
-- tenían antes de existir el on/off), y un solo recordatorio de "1 día
-- antes" (el comportamiento hardcodeado histórico), editable desde
-- Settings › Emails sin volver a tocar la DB directamente.
INSERT INTO "EmailSetting" ("id", "type", "enabled", "updatedAt") VALUES
  ('email_setting_registration_created', 'REGISTRATION_CREATED', true, CURRENT_TIMESTAMP),
  ('email_setting_registration_approved', 'REGISTRATION_APPROVED', true, CURRENT_TIMESTAMP),
  ('email_setting_registration_rejected', 'REGISTRATION_REJECTED', true, CURRENT_TIMESTAMP),
  ('email_setting_result_published', 'RESULT_PUBLISHED', true, CURRENT_TIMESTAMP),
  ('email_setting_exam_reminder', 'EXAM_REMINDER', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ReminderSchedule" ("id", "minutesBefore", "active", "updatedAt") VALUES
  ('reminder_schedule_1_day', 1440, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable: se agrega nullable primero para poder rellenar las filas ya
-- existentes de ReminderLog contra el recordatorio "1 día antes" de arriba
-- (era el único que existía hasta ahora) antes de volverla NOT NULL.
ALTER TABLE "ReminderLog" ADD COLUMN "reminderScheduleId" TEXT;

UPDATE "ReminderLog" SET "reminderScheduleId" = 'reminder_schedule_1_day' WHERE "reminderScheduleId" IS NULL;

ALTER TABLE "ReminderLog" ALTER COLUMN "reminderScheduleId" SET NOT NULL;

-- DropIndex
DROP INDEX "ReminderLog_examDateId_registrationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_examDateId_registrationId_reminderScheduleId_key" ON "ReminderLog"("examDateId", "registrationId", "reminderScheduleId");

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_reminderScheduleId_fkey" FOREIGN KEY ("reminderScheduleId") REFERENCES "ReminderSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Superseded por ReminderSchedule (permite múltiples envíos configurables en
-- vez de un solo entero ambiguo de "días antes").
DELETE FROM "Setting" WHERE "key" = 'reminder_days_before';
