"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Label, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { createFaq, deleteFaq, reorderFaqs, setFaqActive, updateFaq } from "@/features/admin-faqs/actions";

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export function FaqsManager({ faqs }: { faqs: FaqRow[] }) {
  const router = useRouter();
  const [modalFaq, setModalFaq] = useState<FaqRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FaqRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      question: formData.get("question"),
      answer: formData.get("answer"),
      order: modalFaq !== "new" ? modalFaq?.order : faqs.length,
      active: formData.get("active") === "on",
    };

    const result = modalFaq && modalFaq !== "new" ? await updateFaq(modalFaq.id, input) : await createFaq(input);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setModalFaq(null);
    router.refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;
    const reordered = [...faqs];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderFaqs(reordered.map((faq) => faq.id));
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteFaq(deleteTarget.id);
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
        <Button onClick={() => setModalFaq("new")}>
          <Plus className="h-4 w-4" /> New question
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {faqs.length === 0 ? (
        <EmptyState title="No FAQs yet" />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{faq.question}</p>
                  <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
                </div>
                <Badge tone={faq.active ? "green" : "gray"}>{faq.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-3 flex gap-1">
                <IconButton label="Move up" icon={ArrowUp} onClick={() => handleMove(index, -1)} />
                <IconButton label="Move down" icon={ArrowDown} onClick={() => handleMove(index, 1)} />
                <IconButton label="Edit" icon={Pencil} onClick={() => setModalFaq(faq)} />
                <IconButton
                  label={faq.active ? "Deactivate" : "Activate"}
                  icon={Power}
                  onClick={async () => {
                    await setFaqActive(faq.id, !faq.active);
                    router.refresh();
                  }}
                />
                <IconButton label="Delete" icon={Trash2} tone="danger" onClick={() => setDeleteTarget(faq)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalFaq !== null} title={modalFaq === "new" ? "New question" : "Edit question"} onClose={() => setModalFaq(null)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea id="question" name="question" defaultValue={modalFaq !== "new" ? modalFaq?.question : ""} required rows={2} />
          </div>
          <div>
            <Label htmlFor="answer">Answer</Label>
            <Textarea id="answer" name="answer" defaultValue={modalFaq !== "new" ? modalFaq?.answer : ""} required rows={3} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={modalFaq !== "new" ? modalFaq?.active : true} />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalFaq(null)}>
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
        title="Delete question"
        description="Delete this FAQ? This action cannot be undone."
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
