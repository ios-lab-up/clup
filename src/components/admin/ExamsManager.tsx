"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { createExam, deleteExam, setExamActive, updateExam } from "@/features/admin-exams/actions";

interface OverrideRow {
  id: string;
  scope: "FACULTY" | "CAREER";
  targetId: string;
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

interface DraftOverride {
  scope: "FACULTY" | "CAREER";
  targetId: string;
  score: number;
}

const TYPE_LABELS: Record<string, string> = { TOEIC: "TOEIC", TOEFL: "TOEFL", CUSTOM: "Custom" };

export function ExamsManager({
  exams,
  faculties,
}: {
  exams: ExamRow[];
  faculties: FacultyOption[];
}) {
  const router = useRouter();
  const [modalExam, setModalExam] = useState<ExamRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos del examen (controlados para poder mostrar el default en la sección de overrides).
  const [type, setType] = useState("TOEIC");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState("700");
  const [active, setActive] = useState(true);

  // Overrides en borrador — se guardan junto con el examen (create y edit).
  const [overrides, setOverrides] = useState<DraftOverride[]>([]);
  const [ovScope, setOvScope] = useState<"FACULTY" | "CAREER">("FACULTY");
  const [ovTargetId, setOvTargetId] = useState("");
  const [ovScore, setOvScore] = useState("");
  const [ovError, setOvError] = useState<string | null>(null);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const faculty of faculties) {
      map.set(faculty.id, faculty.name);
      for (const career of faculty.careers) map.set(career.id, career.name);
    }
    return map;
  }, [faculties]);

  const careerOptions = useMemo(
    () =>
      faculties.flatMap((faculty) =>
        faculty.careers.map((career) => ({ id: career.id, name: `${faculty.name} • ${career.name}` })),
      ),
    [faculties],
  );

  function openModal(exam: ExamRow | "new") {
    setError(null);
    setOvError(null);
    setOvScope("FACULTY");
    setOvTargetId("");
    setOvScore("");
    if (exam === "new") {
      setType("TOEIC");
      setName("");
      setDescription("");
      setPassingScore("700");
      setActive(true);
      setOverrides([]);
    } else {
      setType(exam.type);
      setName(exam.name);
      setDescription(exam.description ?? "");
      setPassingScore(String(exam.passingScore));
      setActive(exam.active);
      setOverrides(
        exam.passingScores.map((row) => ({
          scope: row.scope,
          targetId: row.targetId,
          score: row.score,
        })),
      );
    }
    setModalExam(exam);
  }

  function addOverride() {
    setOvError(null);
    if (!ovTargetId || ovScore === "") {
      setOvError("Selecciona destino y puntaje.");
      return;
    }
    if (overrides.some((o) => o.scope === ovScope && o.targetId === ovTargetId)) {
      setOvError("Ya hay un override para esa facultad o carrera.");
      return;
    }
    setOverrides((prev) => [...prev, { scope: ovScope, targetId: ovTargetId, score: Number(ovScore) }]);
    setOvTargetId("");
    setOvScore("");
  }

  function removeOverride(index: number) {
    setOverrides((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const input = {
      type,
      name,
      description: description.trim() || null,
      passingScore,
      active,
      overrides,
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    setError(null);
    const result = await deleteExam(deleteTarget.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    router.refresh();
  }

  const isCustom = type === "CUSTOM";

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openModal("new")}>
          <Plus className="h-4 w-4" /> New exam
        </Button>
      </div>

      {error && !modalExam && !deleteTarget && (
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
                <TableCell>
                  {exam.passingScores.length > 0 ? (
                    <Badge tone="gray">{exam.passingScores.length}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge tone={exam.active ? "green" : "gray"}>
                    {exam.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <IconButton label="Edit" icon={Pencil} onClick={() => openModal(exam)} />
                    <IconButton
                      label={exam.active ? "Deactivate" : "Activate"}
                      icon={Power}
                      onClick={() => handleToggleActive(exam)}
                    />
                    <IconButton
                      label="Delete"
                      icon={Trash2}
                      tone="danger"
                      onClick={() => setDeleteTarget(exam)}
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
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* --- Details --- */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select id="type" value={type} onChange={(event) => setType(event.target.value)} required>
                  <option value="TOEIC">TOEIC</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="CUSTOM">Custom</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">{isCustom ? "Custom exam name" : "Name"}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={isCustom ? "E.g. IELTS, Cambridge B2…" : undefined}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              Active (visible to students)
            </label>
          </div>

          {/* --- Passing score --- */}
          <div className="space-y-3 border-t border-gray-100 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Passing score</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                When grading: program override → that program&apos;s faculty override → the general
                default below.
              </p>
            </div>

            <div className="w-40">
              <Label htmlFor="passingScore">General default</Label>
              <Input
                id="passingScore"
                type="number"
                value={passingScore}
                onChange={(event) => setPassingScore(event.target.value)}
                required
              />
            </div>

            {overrides.length > 0 && (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {overrides.map((override, index) => (
                  <li
                    key={`${override.scope}-${override.targetId}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge tone="gray">{override.scope === "CAREER" ? "Program" : "Faculty"}</Badge>
                      <span className="truncate text-gray-700">
                        {nameById.get(override.targetId) ?? override.targetId}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-gray-900">{override.score}</span>
                      <IconButton
                        label="Remove"
                        icon={Trash2}
                        tone="danger"
                        onClick={() => removeOverride(index)}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {ovError && <Alert variant="error">{ovError}</Alert>}

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[7rem_1fr_5rem_auto] sm:items-end">
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
                <div className="min-w-0">
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
                  />
                </div>
                <Button type="button" variant="secondary" onClick={addOverride}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalExam(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {modalExam === "new" ? "Create exam" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete exam"
        description={`Delete "${deleteTarget?.name ?? ""}"? Its score overrides are removed too. This cannot be undone.`}
        destructive
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
