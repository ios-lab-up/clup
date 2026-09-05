"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { createExam, setExamActive, updateExam } from "@/features/admin-exams/actions";

interface ExamRow {
  id: string;
  type: string;
  name: string;
  description: string | null;
  passingScore: number;
  active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  TOEIC: "TOEIC",
  TOEFL: "TOEFL",
  CUSTOM: "Custom",
};

export function ExamsManager({ exams }: { exams: ExamRow[] }) {
  const router = useRouter();
  const [modalExam, setModalExam] = useState<ExamRow | "new" | null>(null);
  const [selectedType, setSelectedType] = useState("TOEIC");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal(exam: ExamRow | "new") {
    setSelectedType(exam === "new" ? "TOEIC" : exam.type);
    setError(null);
    setModalExam(exam);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      type: formData.get("type"),
      name: formData.get("name"),
      description: formData.get("description") || null,
      passingScore: formData.get("passingScore"),
      active: formData.get("active") === "on",
    };

    const result =
      modalExam && modalExam !== "new" ? await updateExam(modalExam.id, input) : await createExam(input);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setModalExam(null);
    router.refresh();
  }

  async function handleToggleActive(exam: ExamRow) {
    await setExamActive(exam.id, !exam.active);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openModal("new")}>
          <Plus className="h-4 w-4" /> New exam
        </Button>
      </div>

      {error && !modalExam && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {exams.length === 0 ? (
        <EmptyState title="No exams yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Passing score</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>{TYPE_LABELS[exam.type] ?? exam.type}</TableCell>
                <TableCell className="font-medium text-gray-900">{exam.name}</TableCell>
                <TableCell>{exam.passingScore}</TableCell>
                <TableCell>
                  <Badge tone={exam.active ? "green" : "gray"}>{exam.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <IconButton label="Edit" icon={Pencil} onClick={() => openModal(exam)} />
                    <IconButton
                      label={exam.active ? "Deactivate" : "Activate"}
                      icon={Power}
                      onClick={() => handleToggleActive(exam)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        open={modalExam !== null}
        title={modalExam === "new" ? "New exam" : "Edit exam"}
        onClose={() => setModalExam(null)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && modalExam && <Alert variant="error">{error}</Alert>}
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              name="type"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              required
            >
              <option value="TOEIC">TOEIC</option>
              <option value="TOEFL">TOEFL</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="name">
              {selectedType === "CUSTOM" ? "Custom exam name" : "Name"}
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={modalExam !== "new" ? modalExam?.name : ""}
              placeholder={selectedType === "CUSTOM" ? "E.g. IELTS, Cambridge B2..." : undefined}
              required
            />
          </div>
          <div>
            <Label htmlFor="passingScore">Passing score (minimum to pass)</Label>
            <Input
              id="passingScore"
              name="passingScore"
              type="number"
              defaultValue={modalExam !== "new" ? modalExam?.passingScore : 700}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={modalExam !== "new" ? (modalExam?.description ?? "") : ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={modalExam !== "new" ? modalExam?.active : true} />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalExam(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
