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
import {
  createCareer,
  createFaculty,
  deleteCareer,
  deleteFaculty,
  setCareerActive,
  setFacultyActive,
  updateCareer,
  updateFaculty,
} from "@/features/admin-catalog/actions";

interface CareerRow {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

interface FacultyRow {
  id: string;
  name: string;
  order: number;
  isExternal: boolean;
  active: boolean;
  careers: CareerRow[];
}

type FacultyModal = { kind: "faculty"; faculty: FacultyRow | "new" };
type CareerModal = { kind: "career"; facultyId: string; career: CareerRow | "new" };
type ActiveModal = FacultyModal | CareerModal | null;

type DeleteTarget =
  | { kind: "faculty"; row: FacultyRow }
  | { kind: "career"; row: CareerRow }
  | null;

export function CatalogManager({ faculties }: { faculties: FacultyRow[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ActiveModal>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setModal(null);
    setError(null);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    const formData = new FormData(event.currentTarget);

    if (modal.kind === "faculty") {
      const input = {
        name: formData.get("name"),
        order: formData.get("order") || 0,
        isExternal: formData.get("isExternal") === "on",
        active: formData.get("active") === "on",
      };
      const ok = await run(
        modal.faculty === "new" ? createFaculty(input) : updateFaculty(modal.faculty.id, input),
      );
      if (ok) close();
      return;
    }

    const input = {
      facultyId: modal.facultyId,
      name: formData.get("name"),
      order: formData.get("order") || 0,
      active: formData.get("active") === "on",
    };
    const ok = await run(
      modal.career === "new" ? createCareer(input) : updateCareer(modal.career.id, input),
    );
    if (ok) close();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await run(
      deleteTarget.kind === "faculty"
        ? deleteFaculty(deleteTarget.row.id)
        : deleteCareer(deleteTarget.row.id),
    );
    if (ok) setDeleteTarget(null);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModal({ kind: "faculty", faculty: "new" })}>
          <Plus className="h-4 w-4" /> New faculty
        </Button>
      </div>

      {error && !modal && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {faculties.length === 0 ? (
        <EmptyState title="No faculties yet" />
      ) : (
        <div className="space-y-4">
          {faculties.map((faculty) => (
            <div key={faculty.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{faculty.name}</span>
                  {faculty.isExternal && <Badge tone="gray">External</Badge>}
                  {!faculty.active && <Badge tone="gray">Inactive</Badge>}
                </div>
                <div className="flex gap-1">
                  {!faculty.isExternal && (
                    <IconButton
                      label="Add program"
                      icon={Plus}
                      onClick={() => setModal({ kind: "career", facultyId: faculty.id, career: "new" })}
                    />
                  )}
                  <IconButton
                    label="Edit"
                    icon={Pencil}
                    onClick={() => setModal({ kind: "faculty", faculty })}
                  />
                  <IconButton
                    label={faculty.active ? "Deactivate" : "Activate"}
                    icon={Power}
                    onClick={() => run(setFacultyActive(faculty.id, !faculty.active))}
                  />
                  <IconButton
                    label="Delete"
                    icon={Trash2}
                    tone="danger"
                    onClick={() => setDeleteTarget({ kind: "faculty", row: faculty })}
                  />
                </div>
              </div>

              {faculty.careers.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                  {faculty.careers.map((career) => (
                    <li key={career.id} className="flex items-center justify-between gap-2 py-2">
                      <span className={career.active ? "text-sm text-gray-700" : "text-sm text-gray-400"}>
                        {career.name}
                        {!career.active && " (inactive)"}
                      </span>
                      <div className="flex gap-1">
                        <IconButton
                          label="Edit"
                          icon={Pencil}
                          onClick={() =>
                            setModal({ kind: "career", facultyId: faculty.id, career })
                          }
                        />
                        <IconButton
                          label={career.active ? "Deactivate" : "Activate"}
                          icon={Power}
                          onClick={() => run(setCareerActive(career.id, !career.active))}
                        />
                        <IconButton
                          label="Delete"
                          icon={Trash2}
                          tone="danger"
                          onClick={() => setDeleteTarget({ kind: "career", row: career })}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        title={
          modal?.kind === "faculty"
            ? modal.faculty === "new"
              ? "New faculty"
              : "Edit faculty"
            : modal?.career === "new"
              ? "New program"
              : "Edit program"
        }
        onClose={close}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && modal && <Alert variant="error">{error}</Alert>}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={
                modal?.kind === "faculty"
                  ? modal.faculty !== "new"
                    ? modal.faculty.name
                    : ""
                  : modal?.career !== "new"
                    ? modal?.career.name
                    : ""
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              name="order"
              type="number"
              defaultValue={
                modal?.kind === "faculty"
                  ? modal.faculty !== "new"
                    ? modal.faculty.order
                    : 0
                  : modal?.career !== "new"
                    ? modal?.career.order
                    : 0
              }
            />
          </div>
          {modal?.kind === "faculty" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isExternal"
                defaultChecked={modal.faculty !== "new" ? modal.faculty.isExternal : false}
              />
              External bucket (faculty / guests — no programs, uses the exam default score)
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={
                modal?.kind === "faculty"
                  ? modal.faculty !== "new"
                    ? modal.faculty.active
                    : true
                  : modal?.career !== "new"
                    ? modal?.career.active
                    : true
              }
            />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={close}>
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
        title={deleteTarget?.kind === "faculty" ? "Delete faculty" : "Delete program"}
        description="This action cannot be undone. If it is in use, deactivate it instead."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
