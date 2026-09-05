"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Label, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { approveRegistration, rejectRegistration } from "@/features/admin-registrations/actions";

export function RegistrationActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setPending(true);
    setError(null);
    const result = await approveRegistration(registrationId);
    setPending(false);
    setShowApprove(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function handleReject(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await rejectRegistration({ registrationId, reason });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setShowReject(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="flex gap-3">
        <Button onClick={() => setShowApprove(true)}>Approve</Button>
        <Button variant="destructive" onClick={() => setShowReject(true)}>
          Reject
        </Button>
      </div>

      <ConfirmDialog
        open={showApprove}
        title="Approve registration"
        description="The student will receive an email confirming their approval."
        loading={pending}
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      <Modal open={showReject} title="Reject registration" onClose={() => setShowReject(false)}>
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <Label htmlFor="reason">Rejection reason (optional)</Label>
            <Textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" loading={pending}>
              Reject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
