"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import {
  createReminderSchedule,
  deleteReminderSchedule,
  setEmailSettingEnabled,
  setReminderScheduleActive,
  updateReminderSchedule,
} from "@/features/admin-email-settings/actions";
import {
  EMAIL_TYPE_DESCRIPTIONS,
  EMAIL_TYPE_LABELS,
  REMINDER_SCHEDULE_UNITS,
} from "@/lib/validations/email-settings.schema";

type EmailType = keyof typeof EMAIL_TYPE_LABELS;

interface EmailSettingRow {
  type: EmailType;
  enabled: boolean;
}

interface ReminderScheduleRow {
  id: string;
  minutesBefore: number;
  active: boolean;
}

type Unit = (typeof REMINDER_SCHEDULE_UNITS)[number];

const UNIT_LABELS: Record<Unit, { singular: string; plural: string }> = {
  minutes: { singular: "minute", plural: "minutes" },
  hours: { singular: "hour", plural: "hours" },
  days: { singular: "day", plural: "days" },
};

function minutesToFriendly(minutesBefore: number): { amount: number; unit: Unit } {
  if (minutesBefore % 1440 === 0) return { amount: minutesBefore / 1440, unit: "days" };
  if (minutesBefore % 60 === 0) return { amount: minutesBefore / 60, unit: "hours" };
  return { amount: minutesBefore, unit: "minutes" };
}

function formatFriendly(minutesBefore: number): string {
  const { amount, unit } = minutesToFriendly(minutesBefore);
  const label = amount === 1 ? UNIT_LABELS[unit].singular : UNIT_LABELS[unit].plural;
  return `${amount} ${label} before the exam`;
}

export function EmailSettingsManager({
  emailSettings,
  reminderSchedules,
}: {
  emailSettings: EmailSettingRow[];
  reminderSchedules: ReminderScheduleRow[];
}) {
  const router = useRouter();
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [modalSchedule, setModalSchedule] = useState<ReminderScheduleRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReminderScheduleRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleEmail(type: EmailType, enabled: boolean) {
    setPendingType(type);
    await setEmailSettingEnabled({ type, enabled });
    setPendingType(null);
    router.refresh();
  }

  async function run(promise: Promise<{ ok: boolean; message?: string }>) {
    setPending(true);
    setError(null);
    const result = await promise;
    setPending(false);
    if (!result.ok) {
      setError(result.message ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalSchedule) return;
    const formData = new FormData(event.currentTarget);
    const input = {
      amount: formData.get("amount"),
      unit: formData.get("unit"),
      active: formData.get("active") === "on",
    };
    const ok = await run(
      modalSchedule === "new"
        ? createReminderSchedule(input)
        : updateReminderSchedule(modalSchedule.id, input),
    );
    if (ok) setModalSchedule(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await run(deleteReminderSchedule(deleteTarget.id));
    if (ok) setDeleteTarget(null);
  }

  const defaultFriendly = modalSchedule !== "new" && modalSchedule ? minutesToFriendly(modalSchedule.minutesBefore) : null;

  return (
    <div className="space-y-3">
      {error && !modalSchedule && !deleteTarget && (
        <Alert variant="error" className="mb-2">
          {error}
        </Alert>
      )}

      {emailSettings.map((setting) => (
        <div key={setting.type} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{EMAIL_TYPE_LABELS[setting.type]}</p>
              <p className="text-xs text-gray-500">{EMAIL_TYPE_DESCRIPTIONS[setting.type]}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={setting.enabled ? "green" : "gray"}>{setting.enabled ? "Enabled" : "Disabled"}</Badge>
              <IconButton
                label={setting.enabled ? "Disable" : "Enable"}
                icon={Power}
                tone={setting.enabled ? "default" : "danger"}
                disabled={pendingType === setting.type}
                onClick={() => toggleEmail(setting.type, !setting.enabled)}
              />
            </div>
          </div>

          {setting.type === "EXAM_REMINDER" && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Scheduled sends</p>
                <Button size="sm" onClick={() => setModalSchedule("new")}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              {reminderSchedules.length === 0 ? (
                <p className="text-sm text-gray-500">No reminders configured yet.</p>
              ) : (
                <ul className="space-y-2">
                  {reminderSchedules.map((schedule) => (
                    <li
                      key={schedule.id}
                      className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2"
                    >
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        {formatFriendly(schedule.minutesBefore)}
                        {!schedule.active && <Badge tone="gray">Inactive</Badge>}
                      </span>
                      <div className="flex gap-1">
                        <IconButton label="Edit" icon={Pencil} onClick={() => setModalSchedule(schedule)} />
                        <IconButton
                          label={schedule.active ? "Deactivate" : "Activate"}
                          icon={Power}
                          onClick={() => run(setReminderScheduleActive(schedule.id, !schedule.active))}
                        />
                        <IconButton
                          label="Delete"
                          icon={Trash2}
                          tone="danger"
                          onClick={() => setDeleteTarget(schedule)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}

      <Modal
        open={modalSchedule !== null}
        title={modalSchedule === "new" ? "New reminder" : "Edit reminder"}
        onClose={() => setModalSchedule(null)}
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {error && (modalSchedule !== null) && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={1}
                defaultValue={defaultFriendly?.amount ?? 1}
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select id="unit" name="unit" defaultValue={defaultFriendly?.unit ?? "days"}>
                {REMINDER_SCHEDULE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {UNIT_LABELS[unit].plural}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Sent this long before the exam start time — e.g. 2 days, 1 day, or 5 minutes before.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={modalSchedule !== "new" ? modalSchedule?.active : true}
            />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalSchedule(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete reminder"
        description="This reminder will stop sending. This action cannot be undone."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
