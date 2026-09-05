"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StopClick } from "@/components/ui/ClickableRow";
import { deleteRegistration } from "@/features/admin-registrations/actions";

export function RegistrationRowActions({
  registrationId,
  studentName,
}: {
  registrationId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    await deleteRegistration(registrationId);
    setPending(false);
    setConfirm(false);
    router.refresh();
  }

  return (
    <StopClick className="flex justify-end">
      <IconButton label="Delete registration" icon={Trash2} tone="danger" onClick={() => setConfirm(true)} />
      <ConfirmDialog
        open={confirm}
        title="Delete registration"
        description={`Completely delete ${studentName}'s registration? Their documents and result will be deleted. This action cannot be undone.`}
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(false)}
      />
    </StopClick>
  );
}
