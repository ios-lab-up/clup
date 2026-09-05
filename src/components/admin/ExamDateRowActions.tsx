"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StopClick } from "@/components/ui/ClickableRow";
import { Alert } from "@/components/ui/Alert";
import { deleteExamDate, setExamDateActive } from "@/features/admin-examdates/actions";

interface ExamDateRowActionsProps {
  examDateId: string;
  active: boolean;
}

export function ExamDateRowActions({ examDateId, active }: ExamDateRowActionsProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setPending(true);
    await setExamDateActive(examDateId, !active);
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteExamDate(examDateId);
    setPending(false);
    setConfirmDelete(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <StopClick>
      <div className="flex justify-end gap-1">
        <IconButton
          label="Edit"
          icon={Pencil}
          onClick={() => router.push(`/admin/fechas/${examDateId}`)}
        />
        <IconButton label={active ? "Deactivate" : "Activate"} icon={Power} onClick={handleToggle} />
        <IconButton label="Delete" icon={Trash2} tone="danger" onClick={() => setConfirmDelete(true)} />
      </div>

      {error && (
        <div className="mt-2">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete exam date"
        description="Delete this exam date? This action cannot be undone."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </StopClick>
  );
}
