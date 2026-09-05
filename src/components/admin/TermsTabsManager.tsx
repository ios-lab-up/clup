"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExamDateStatusBadge } from "@/components/exams/ExamDateStatusBadge";
import { ExamDateRowActions } from "@/components/admin/ExamDateRowActions";
import { getExamDateStatus } from "@/lib/exam-date-status";
import { examTypeLabel } from "@/lib/exam-type";
import { EXAM_DATE_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createTerm, deleteTerm, setTermActive, updateTerm } from "@/features/admin-terms/actions";
import type { ExamType } from "@/generated/prisma/client";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

interface ExamDateRow {
  id: string;
  examDate: Date;
  registrationStartDate: Date;
  registrationEndDate: Date;
  active: boolean;
  exam: { type: ExamType; name: string };
  _count: { registrations: number };
}

interface TermRow {
  id: string;
  name: string;
  year: number;
  description: string | null;
  active: boolean;
  examDates: ExamDateRow[];
}

export function TermsTabsManager({ terms, initialTermId }: { terms: TermRow[]; initialTermId?: string }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(
    (initialTermId && terms.some((term) => term.id === initialTermId) ? initialTermId : terms[0]?.id) ?? null,
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<TermRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TermRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTerm = terms.find((term) => term.id === activeId) ?? null;

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const input = {
      name: formData.get("name"),
      year: formData.get("year"),
      description: formData.get("description") || null,
      active: formData.get("active") === "on",
    };
    const result = await createTerm(input);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setShowCreate(false);
    router.refresh();
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const input = {
      name: formData.get("name"),
      year: formData.get("year"),
      description: formData.get("description") || null,
      active: formData.get("active") === "on",
    };
    const result = await updateTerm(editTarget.id, input);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEditTarget(null);
    router.refresh();
  }

  async function handleToggleActive(term: TermRow) {
    await setTermActive(term.id, !term.active);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteTerm(deleteTarget.id);
    setPending(false);
    setDeleteTarget(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (activeId === deleteTarget.id) setActiveId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New term
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {terms.length === 0 ? (
        <EmptyState title="No terms yet" />
      ) : (
        <>
          <div className="flex gap-6 overflow-x-auto border-b border-gray-200">
            {terms.map((term) => {
              const isActive = term.id === activeTerm?.id;
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => setActiveId(term.id)}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-wine-700 text-wine-700"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                  )}
                >
                  {term.name} {term.year}
                  {!term.active && <span className="ml-1.5 text-xs text-gray-400">(inactive)</span>}
                </button>
              );
            })}
          </div>

          {activeTerm && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardContent>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {activeTerm.name} {activeTerm.year}
                        </h2>
                        <Badge tone={activeTerm.active ? "green" : "gray"}>
                          {activeTerm.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {activeTerm.description && (
                        <p className="mt-1 text-sm text-gray-600">{activeTerm.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => setEditTarget(activeTerm)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Link
                        href={`/admin/fechas/nueva?termId=${activeTerm.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800"
                      >
                        <Plus className="h-4 w-4" /> New date
                      </Link>
                      <IconButton
                        label={activeTerm.active ? "Deactivate" : "Activate"}
                        icon={Power}
                        onClick={() => handleToggleActive(activeTerm)}
                      />
                      <IconButton
                        label={
                          activeTerm.examDates.length > 0
                            ? "Can't delete: has exam dates"
                            : "Delete term"
                        }
                        icon={Trash2}
                        tone="danger"
                        disabled={activeTerm.examDates.length > 0}
                        onClick={() => setDeleteTarget(activeTerm)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Exam dates
                </h3>
                {activeTerm.examDates.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                    This term doesn&apos;t have any exam dates yet.
                  </p>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Exam</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Registrations</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Active</TableHeaderCell>
                        <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeTerm.examDates.map((examDate) => (
                        <ClickableRow key={examDate.id} href={`/admin/fechas/${examDate.id}`}>
                          <TableCell className="font-medium text-gray-900">
                            {examTypeLabel(examDate.exam.type, examDate.exam.name)}
                          </TableCell>
                          <TableCell>{dateFormatter.format(examDate.examDate)}</TableCell>
                          <TableCell>{examDate._count.registrations} registered</TableCell>
                          <TableCell>
                            <ExamDateStatusBadge
                              status={getExamDateStatus(examDate)}
                              label={EXAM_DATE_STATUS_LABELS[getExamDateStatus(examDate)]}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge tone={examDate.active ? "green" : "gray"}>
                              {examDate.active ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ExamDateRowActions examDateId={examDate.id} active={examDate.active} />
                          </TableCell>
                        </ClickableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={showCreate} title="New term" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input id="year" name="year" type="number" defaultValue={new Date().getFullYear()} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={editTarget !== null} title="Edit term" onClose={() => setEditTarget(null)}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" defaultValue={editTarget?.name} required />
          </div>
          <div>
            <Label htmlFor="edit-year">Year</Label>
            <Input id="edit-year" name="year" type="number" defaultValue={editTarget?.year} required />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input id="edit-description" name="description" defaultValue={editTarget?.description ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={editTarget?.active} />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
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
        title="Delete term"
        description={`Delete "${deleteTarget?.name} ${deleteTarget?.year}"? This action cannot be undone.`}
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
