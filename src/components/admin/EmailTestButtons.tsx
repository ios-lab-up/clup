"use client";

import { useState } from "react";
import { Bell, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { sendTestReminderEmail, sendTestResultEmail } from "@/features/admin-settings/test-emails";

export function EmailTestButtons({ adminEmail }: { adminEmail: string }) {
  const [pending, setPending] = useState<"reminder" | "result" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(kind: "reminder" | "result") {
    setPending(kind);
    setMessage(null);
    const result = kind === "reminder" ? await sendTestReminderEmail() : await sendTestResultEmail();
    setPending(null);
    setMessage(
      result.ok
        ? { ok: true, text: `Test email sent to ${adminEmail}.` }
        : { ok: false, text: result.message },
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <Send className="h-5 w-5 text-wine-700" />
        Test automated emails
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Send a sample to your email ({adminEmail}) to review how each message looks.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="outline" loading={pending === "reminder"} onClick={() => run("reminder")}>
          <Bell className="h-4 w-4" />
          Reminder (1 day before)
        </Button>
        <Button variant="outline" loading={pending === "result"} onClick={() => run("result")}>
          <Mail className="h-4 w-4" />
          Result published
        </Button>
      </div>

      {message && (
        <div className="mt-4">
          <Alert variant={message.ok ? "success" : "error"}>{message.text}</Alert>
        </div>
      )}
    </div>
  );
}
