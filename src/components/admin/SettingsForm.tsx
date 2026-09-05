"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { updateSetting } from "@/features/admin-settings/actions";

interface SettingItem {
  key: string;
  value: string;
}

export function SettingsForm({
  settings,
  labels,
}: {
  settings: SettingItem[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    setPending(key);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const result = await updateSetting({ key, value: formData.get("value") });

    setPending(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSuccess(`${labels[key] ?? key} updated.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {settings.map((setting) => (
        <form
          key={setting.key}
          onSubmit={(event) => handleSubmit(event, setting.key)}
          className="rounded-xl border border-gray-200 bg-white p-6"
        >
          <Label htmlFor={setting.key}>{labels[setting.key] ?? setting.key}</Label>
          <div className="mt-1 flex gap-3">
            <Input id={setting.key} name="value" defaultValue={setting.value} className="flex-1" />
            <Button type="submit" loading={pending === setting.key}>
              Save
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}
