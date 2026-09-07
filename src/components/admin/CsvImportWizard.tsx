"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { previewResultsImportAction, commitResultsImportAction } from "@/features/admin-results/csv-import";
import type { CsvImportPreview } from "@/services/csv-import-service";

export interface ExamDateOption {
  id: string;
  termLabel: string;
  examLabel: string;
  dateLabel: string;
}

const STATUS_TONE = { ok: "green", overwrite: "yellow", error: "red" } as const;
const STATUS_LABEL = { ok: "OK", overwrite: "Will overwrite", error: "Error" } as const;

export function CsvImportWizard({ examDates }: { examDates: ExamDateOption[] }) {
  const router = useRouter();
  const [examDateId, setExamDateId] = useState("");
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [acknowledgeOverwrite, setAcknowledgeOverwrite] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);

  const groupedByTerm = useMemo(() => {
    const groups = new Map<string, ExamDateOption[]>();
    for (const ed of examDates) {
      const list = groups.get(ed.termLabel) ?? [];
      list.push(ed);
      groups.set(ed.termLabel, list);
    }
    return Array.from(groups.entries());
  }, [examDates]);

  async function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setCommitted(false);

    const formData = new FormData(event.currentTarget);
    const result = await previewResultsImportAction(formData);

    setPending(false);
    if (!result.ok) {
      setError(result.message);
      setPreview(null);
      return;
    }
    setPreview(result.data);
    setAcknowledgeOverwrite(false);
  }

  async function handleConfirm() {
    if (!preview) return;
    setPending(true);
    setError(null);

    const rows = preview.rows
      .filter((row) => row.status === "ok" || row.status === "overwrite")
      .map((row) => ({ registrationId: row.registrationId!, score: row.score, passed: row.passed! }));

    const result = await commitResultsImportAction(rows);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCommitted(true);
    setPreview(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handlePreview} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <Label htmlFor="examDateId">Exam date</Label>
          {examDates.length === 0 ? (
            <Alert variant="warning" className="mt-2">
              There are no exam dates created yet.{" "}
              <Link href="/admin/fechas/nueva" className="font-medium underline">
                Create one first
              </Link>
              .
            </Alert>
          ) : (
            <Select
              id="examDateId"
              name="examDateId"
              value={examDateId}
              onChange={(event) => setExamDateId(event.target.value)}
              required
            >
              <option value="">Select an exam date</option>
              {groupedByTerm.map(([termLabel, options]) => (
                <optgroup key={termLabel} label={termLabel}>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.examLabel} — {option.dateLabel}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          )}
        </div>
        <div>
          <Label htmlFor="file">CSV file (student_id,score)</Label>
          <div className="mt-1">
            <FileDropzone
              id="file"
              name="file"
              accept=".csv,text/csv"
              required
              label="Drag your CSV file here"
              hint="or click to browse from your computer"
            />
          </div>
        </div>
        <Button type="submit" loading={pending} disabled={examDates.length === 0}>
          Preview
        </Button>
      </form>

      {error && <Alert variant="error">{error}</Alert>}
      {committed && <Alert variant="success">Import completed successfully.</Alert>}

      {preview && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge tone="green">{preview.summary.ok} OK</Badge>
            <Badge tone="yellow">{preview.summary.overwrite} will overwrite</Badge>
            <Badge tone="red">{preview.summary.error} with errors</Badge>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Check that the scores match each student before confirming.
          </p>

          <div className="mt-4 max-h-96 overflow-x-auto overflow-y-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Student</TableHeaderCell>
                  <TableHeaderCell>Program</TableHeaderCell>
                  <TableHeaderCell>Score</TableHeaderCell>
                  <TableHeaderCell>Minimum</TableHeaderCell>
                  <TableHeaderCell>Result</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Detail</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.rows.map((row, index) => (
                  <TableRow key={`${row.index}-${index}`}>
                    <TableCell className="font-medium text-gray-900">
                      {row.studentName ?? row.studentId}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {row.career ? (
                        <>
                          {row.career}
                          {row.faculty ? <span className="text-gray-400"> • {row.faculty}</span> : null}
                        </>
                      ) : row.noCareer ? (
                        <span className="text-amber-600">No program on file</span>
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell>{row.score}</TableCell>
                    <TableCell className="text-sm text-gray-600">{row.appliedScore ?? ""}</TableCell>
                    <TableCell>
                      {row.passed === undefined ? (
                        "•"
                      ) : (
                        <Badge tone={row.passed ? "green" : "red"}>
                          {row.passed ? "Passed" : "Not passed"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.message ?? (row.status === "overwrite" ? `Previous score: ${row.previousScore}` : "")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {preview.summary.overwrite > 0 && (
            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={acknowledgeOverwrite}
                onChange={(event) => setAcknowledgeOverwrite(event.target.checked)}
              />
              I understand that {preview.summary.overwrite} existing result(s) will be overwritten.
            </label>
          )}

          <div className="mt-4">
            <Button
              onClick={handleConfirm}
              loading={pending}
              disabled={
                (preview.summary.ok === 0 && preview.summary.overwrite === 0) ||
                (preview.summary.overwrite > 0 && !acknowledgeOverwrite)
              }
            >
              Confirm import
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
