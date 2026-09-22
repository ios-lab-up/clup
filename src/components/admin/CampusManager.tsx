"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { createCampus, deleteCampus, setCampusActive, updateCampus } from "@/features/admin-campus/actions";

interface CampusRow {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

export function CampusManager({ campuses }: { campuses: CampusRow[] }) {
  const router = useRouter();
  const [modalCampus, setModalCampus] = useState<CampusRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampusRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      name: formData.get("name"),
      order: formData.get("order") || 0,
      active: formData.get("active") === "on",
    };

    const result =
      modalCampus && modalCampus !== "new" ? await updateCampus(modalCampus.id, input) : await createCampus(input);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setModalCampus(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteCampus(deleteTarget.id);
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
        <Button onClick={() => setModalCampus("new")}>
          <Plus className="h-4 w-4" /> New campus
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {campuses.length === 0 ? (
        <EmptyState title="No campuses yet" />
      ) : (
        <div className="space-y-2">
          {campuses.map((campus) => (
            <div
              key={campus.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{campus.name}</span>
                {!campus.active && <Badge tone="gray">Inactive</Badge>}
              </div>
              <div className="flex gap-1">
                <IconButton label="Edit" icon={Pencil} onClick={() => setModalCampus(campus)} />
                <IconButton
                  label={campus.active ? "Deactivate" : "Activate"}
                  icon={Power}
                  onClick={async () => {
                    await setCampusActive(campus.id, !campus.active);
                    router.refresh();
                  }}
                />
                <IconButton
                  label="Delete"
                  icon={Trash2}
                  tone="danger"
                  onClick={() => setDeleteTarget(campus)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalCampus !== null}
        title={modalCampus === "new" ? "New campus" : "Edit campus"}
        onClose={() => setModalCampus(null)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={modalCampus !== "new" ? modalCampus?.name : ""} required />
          </div>
          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              name="order"
              type="number"
              defaultValue={modalCampus !== "new" ? modalCampus?.order : 0}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={modalCampus !== "new" ? modalCampus?.active : true}
            />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalCampus(null)}>
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
        title="Delete campus"
        description="This action cannot be undone. If it is in use, deactivate it instead."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
