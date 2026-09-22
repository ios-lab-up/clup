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
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import {
  createAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
  setAnnouncementActive,
  updateAnnouncement,
} from "@/features/admin-announcements/actions";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  imageKey: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
}

export function AnnouncementsManager({ announcements }: { announcements: AnnouncementRow[] }) {
  const router = useRouter();
  const [modalAnnouncement, setModalAnnouncement] = useState<AnnouncementRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null);
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
      imageKey: formData.get("imageKey"),
      order: modalAnnouncement !== "new" ? modalAnnouncement?.order : announcements.length,
      active: formData.get("active") === "on",
    };

    const result =
      modalAnnouncement && modalAnnouncement !== "new"
        ? await updateAnnouncement(modalAnnouncement.id, input)
        : await createAnnouncement(input);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setModalAnnouncement(null);
    router.refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= announcements.length) return;
    const reordered = [...announcements];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderAnnouncements(reordered.map((announcement) => announcement.id));
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteAnnouncement(deleteTarget.id);
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
        <Button onClick={() => setModalAnnouncement("new")}>
          <Plus className="h-4 w-4" /> New announcement
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {announcements.length === 0 ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <div key={announcement.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 gap-3">
                  {announcement.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL firmada de R2, no un asset estático de Next
                    <img
                      src={announcement.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{announcement.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{announcement.body}</p>
                  </div>
                </div>
                <Badge tone={announcement.active ? "green" : "gray"}>
                  {announcement.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-3 flex gap-1">
                <IconButton label="Move up" icon={ArrowUp} onClick={() => handleMove(index, -1)} />
                <IconButton label="Move down" icon={ArrowDown} onClick={() => handleMove(index, 1)} />
                <IconButton label="Edit" icon={Pencil} onClick={() => setModalAnnouncement(announcement)} />
                <IconButton
                  label={announcement.active ? "Deactivate" : "Activate"}
                  icon={Power}
                  onClick={async () => {
                    await setAnnouncementActive(announcement.id, !announcement.active);
                    router.refresh();
                  }}
                />
                <IconButton
                  label="Delete"
                  icon={Trash2}
                  tone="danger"
                  onClick={() => setDeleteTarget(announcement)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAnnouncement !== null}
        title={modalAnnouncement === "new" ? "New announcement" : "Edit announcement"}
        onClose={() => setModalAnnouncement(null)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={modalAnnouncement !== "new" ? modalAnnouncement?.title : ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={modalAnnouncement !== "new" ? modalAnnouncement?.body : ""}
              required
              rows={3}
            />
          </div>
          <div>
            <Label>Image (optional)</Label>
            <ImageUploadField
              key={modalAnnouncement !== "new" ? modalAnnouncement?.id : "new"}
              name="imageKey"
              kind="announcement"
              initialImageKey={modalAnnouncement !== "new" ? modalAnnouncement?.imageKey : null}
              initialImageUrl={modalAnnouncement !== "new" ? modalAnnouncement?.imageUrl : null}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={modalAnnouncement !== "new" ? modalAnnouncement?.active : true}
            />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalAnnouncement(null)}>
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
        title="Delete announcement"
        description="Delete this announcement? This action cannot be undone."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
