"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createExam,
  deleteExamPassingScore,
  setExamActive,
  updateExam,
  upsertExamPassingScore,
} from "@/features/admin-exams/actions";

interface OverrideRow {
  id: string;
  scope: "FACULTY" | "CAREER";
  targetName: string;
  score: number;
}

interface ExamRow {
  id: string;
  type: string;
  name: string;
  description: string | null;
  passingScore: number;
  active: boolean;
  passingScores: OverrideRow[];
}

interface FacultyOption {
  id: string;
  name: string;
  careers: { id: string; name: string }[];
}

const TYPE_LABELS: Record<string, string> = {
  TOEIC: "TOEIC",
  TOEFL: "TOEFL",
  CUSTOM: "Custom",
};

export function ExamsManager({
  exams,
  faculties,
}: {
  exams: ExamRow[];
  faculties: FacultyOption[];
}) {
  const router = useRouter();
  const [modalExam, setModalExam] = useState<ExamRow | "new" | null>(null);
  const [selectedType, setSelectedType] = useState("TOEIC");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario "agregar override" (dentro del modal de editar examen).
  const [ovScope, setOvScope] = useState<"FACULTY" | "CAREER">("FACULTY");
  const [ovTargetId, setOvTargetId] = useState("");
  const [ovScore, setOvScore] = useState("");
  const [ovPending, setOvPending] = useState(false);
  const [ovError, setOvError] = useState<string | null>(null);

  const careerOptions = useMemo(
    () =>
      faculties.flatMap((faculty) =>
        faculty.careers.map((career) => ({ id: career.id, name: `${faculty.name} • ${career.name}` })),
      ),
    [faculties],
  );

  function openModal(exam: ExamRow | "new") {
    setSelectedType(exam === "new" ? "TOEIC" : exam.type);
    setError(null);
    setOvError(null);
    setOvScope("FACULTY");
    setOvTargetId("");
    setOvScore("");
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

  async function handleAddOverride() {
    if (!modalExam || modalExam === "new") return;
    setOvPending(true);
    setOvError(null);
    const result = await upsertExamPassingScore({
      examId: modalExam.id,
      scope: ovScope,
      targetId: ovTargetId,
      score: ovScore,
    });
    setOvPending(false);
    if (!result.ok) {
      setOvError(result.message);
      return;
    }
    setOvTargetId("");
    setOvScore("");
    router.refresh();
  }

  async function handleRemoveOverride(id: string) {
    setOvPending(true);
    await deleteExamPassingScore(id);
    setOvPending(false);
    router.refresh();
  }

  const editingExam = modalExam && modalExam !== "new" ? modalExam : null;

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
              <TableHeaderCell>Default minimum</TableHeaderCell>
              <TableHeaderCell>Overrides</TableHeaderCell>
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
                <TableCell>{exam.passingScores.length || "—"}</TableCell>
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
            <Label htmlFor="passingScore">Minimum score (general default)</Label>
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

        {editingExam && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900">Score by faculty / program</h3>
            <p className="mt-1 text-xs text-gray-500">
              Resolution when grading: program override, then faculty override, then the general
              default ({editingExam.passingScore}).
            </p>

            {editingExam.passingScores.length > 0 && (
              <ul className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
                {editingExam.passingScores.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-gray-700">
                      <Badge tone="gray">{row.scope === "CAREER" ? "Program" : "Faculty"}</Badge>{" "}
                      {row.targetName}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{row.score}</span>
                      <IconButton
                        label="Remove"
                        icon={Trash2}
                        tone="danger"
                        disabled={ovPending}
                        onClick={() => handleRemoveOverride(row.id)}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {ovError && (
              <Alert variant="error" className="mt-3">
                {ovError}
              </Alert>
            )}

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
              <div>
                <Label htmlFor="ovScope">Scope</Label>
                <Select
                  id="ovScope"
                  value={ovScope}
                  onChange={(event) => {
                    setOvScope(event.target.value as "FACULTY" | "CAREER");
                    setOvTargetId("");
                  }}
                >
                  <option value="FACULTY">Faculty</option>
                  <option value="CAREER">Program</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="ovTarget">{ovScope === "FACULTY" ? "Faculty" : "Program"}</Label>
                <Select
                  id="ovTarget"
                  value={ovTargetId}
                  onChange={(event) => setOvTargetId(event.target.value)}
                >
                  <option value="">Select…</option>
                  {(ovScope === "FACULTY"
                    ? faculties.map((faculty) => ({ id: faculty.id, name: faculty.name }))
                    : careerOptions
                  ).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="ovScore">Score</Label>
                <Input
                  id="ovScore"
                  type="number"
                  value={ovScore}
                  onChange={(event) => setOvScore(event.target.value)}
                  className="w-24"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                loading={ovPending}
                disabled={!ovTargetId || ovScore === ""}
                onClick={handleAddOverride}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
