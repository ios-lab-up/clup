"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createExamDate, updateExamDate } from "@/features/admin-examdates/actions";

interface OptionItem {
  id: string;
  name: string;
  year?: number;
}

interface ExamDateFormProps {
  terms: OptionItem[];
  exams: OptionItem[];
  examDate?: {
    id: string;
    termId: string;
    examId: string;
    examDate: Date;
    registrationStartDate: Date;
    registrationEndDate: Date;
    capacity: number | null;
    instructions: string | null;
    info: string | null;
    active: boolean;
  };
  /** A dónde regresar tras guardar/cancelar (la página del term de origen). */
  backHref: string;
  /** Preselecciona el term al crear una fecha desde su página de detalle. */
  defaultTermId?: string;
}

function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function ExamDateForm({ terms, exams, examDate, backHref, defaultTermId }: ExamDateFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(examDate);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      termId: formData.get("termId"),
      examId: formData.get("examId"),
      examDate: formData.get("examDate"),
      registrationStartDate: formData.get("registrationStartDate"),
      registrationEndDate: formData.get("registrationEndDate"),
      capacity: formData.get("capacity") || null,
      instructions: formData.get("instructions") || null,
      info: formData.get("info") || null,
      active: formData.get("active") === "on",
    };

    const result = isEdit ? await updateExamDate(examDate!.id, input) : await createExamDate(input);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="termId">Term</Label>
          <Select id="termId" name="termId" defaultValue={examDate?.termId ?? defaultTermId} required>
            <option value="">Select a term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} {term.year}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="examId">Exam</Label>
          <Select id="examId" name="examId" defaultValue={examDate?.examId} required>
            <option value="">Select an exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="examDate">Exam date</Label>
        <Input
          id="examDate"
          name="examDate"
          type="datetime-local"
          defaultValue={examDate ? toLocalInputValue(examDate.examDate) : undefined}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="registrationStartDate">Registration start</Label>
          <Input
            id="registrationStartDate"
            name="registrationStartDate"
            type="datetime-local"
            defaultValue={examDate ? toLocalInputValue(examDate.registrationStartDate) : undefined}
            required
          />
        </div>
        <div>
          <Label htmlFor="registrationEndDate">Registration end</Label>
          <Input
            id="registrationEndDate"
            name="registrationEndDate"
            type="datetime-local"
            defaultValue={examDate ? toLocalInputValue(examDate.registrationEndDate) : undefined}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="capacity">Capacity (optional)</Label>
        <Input id="capacity" name="capacity" type="number" defaultValue={examDate?.capacity ?? ""} />
        <p className="mt-1 text-xs text-gray-500">
          The passing score is set when creating/editing the exam, not the date.
        </p>
      </div>

      <div>
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" defaultValue={examDate?.instructions ?? ""} rows={3} />
      </div>

      <div>
        <Label htmlFor="info">Relevant information</Label>
        <Textarea id="info" name="info" defaultValue={examDate?.info ?? ""} rows={2} />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="active" defaultChecked={examDate?.active ?? true} />
        Active
      </label>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
