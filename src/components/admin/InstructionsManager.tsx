"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createInstruction,
  deleteInstruction,
  reorderInstructions,
  setInstructionActive,
  updateInstruction,
} from "@/features/admin-instructions/actions";

interface InstructionRow {
  id: string;
  title: string;
  body: string;
  order: number;
  active: boolean;
}

export function InstructionsManager({ instructions }: { instructions: InstructionRow[] }) {
  const router = useRouter();
  const [modalItem, setModalItem] = useState<InstructionRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstructionRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      title: formData.get("title"),
      body: formData.get("body"),
      order: modalItem !== "new" ? modalItem?.order : instructions.length,
      active: formData.get("active") === "on",
    };

    const result =
      modalItem && modalItem !== "new" ? await updateInstruction(modalItem.id, input) : await createInstruction(input);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setModalItem(null);
    router.refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= instructions.length) return;
    const reordered = [...instructions];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderInstructions(reordered.map((item) => item.id));
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteInstruction(deleteTarget.id);
    setPending(false);
    setDeleteTarget(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalItem("new")}>
          <Plus className="h-4 w-4" /> New instruction
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {instructions.length === 0 ? (
        <EmptyState title="No instructions yet" />
      ) : (
        <div className="space-y-3">
          {instructions.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{item.body}</p>
                </div>
                <Badge tone={item.active ? "green" : "gray"}>{item.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-3 flex gap-1">
                <IconButton label="Move up" icon={ArrowUp} onClick={() => handleMove(index, -1)} />
                <IconButton label="Move down" icon={ArrowDown} onClick={() => handleMove(index, 1)} />
                <IconButton label="Edit" icon={Pencil} onClick={() => setModalItem(item)} />
                <IconButton
                  label={item.active ? "Deactivate" : "Activate"}
                  icon={Power}
                  onClick={async () => {
                    await setInstructionActive(item.id, !item.active);
                    router.refresh();
                  }}
                />
                <IconButton label="Delete" icon={Trash2} tone="danger" onClick={() => setDeleteTarget(item)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalItem !== null}
        title={modalItem === "new" ? "New instruction" : "Edit instruction"}
        onClose={() => setModalItem(null)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={modalItem !== "new" ? modalItem?.title : ""} required />
          </div>
          <div>
            <Label htmlFor="body">Content</Label>
            <Textarea id="body" name="body" defaultValue={modalItem !== "new" ? modalItem?.body : ""} required rows={4} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={modalItem !== "new" ? modalItem?.active : true} />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalItem(null)}>
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
        title="Delete instruction"
        description="Delete this instruction? This action cannot be undone."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
