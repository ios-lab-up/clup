"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { previewBulkPublish, commitBulkPublish } from "@/features/admin-results/bulk-publish";
import type { UnpublishedResult } from "@/services/result-service";
import type { ExamDateOption } from "@/components/admin/CsvImportWizard";

export function BulkPublishWizard({ examDates }: { examDates: ExamDateOption[] }) {
  const router = useRouter();
  const [examDateId, setExamDateId] = useState("");
  const [results, setResults] = useState<UnpublishedResult[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committedCount, setCommittedCount] = useState<number | null>(null);

  const groupedByTerm = useMemo(() => {
    const groups = new Map<string, ExamDateOption[]>();
    for (const ed of examDates) {
      const list = groups.get(ed.termLabel) ?? [];
      list.push(ed);
      groups.set(ed.termLabel, list);
    }
    return Array.from(groups.entries());
  }, [examDates]);

  async function handleSelect(id: string) {
    setExamDateId(id);
    setResults(null);
    setError(null);
    setCommittedCount(null);
    if (!id) return;

    setLoadingPreview(true);
    const result = await previewBulkPublish(id);
    setLoadingPreview(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setResults(result.data);
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await commitBulkPublish(examDateId);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCommittedCount(result.data.count);
    setResults(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <Label htmlFor="examDateId">Exam date</Label>
        {examDates.length === 0 ? (
          <Alert variant="warning" className="mt-2">
            There are no exam dates created yet.
          </Alert>
        ) : (
          <Select
            id="examDateId"
            value={examDateId}
            onChange={(event) => handleSelect(event.target.value)}
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

      {error && <Alert variant="error">{error}</Alert>}
      {committedCount !== null && (
        <Alert variant="success">
          {committedCount} result{committedCount === 1 ? "" : "s"} published successfully. An
          email was sent to each student.
        </Alert>
      )}

      {loadingPreview && <p className="text-sm text-gray-500">Looking for pending results...</p>}

      {results && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {results.length === 0 ? (
            <p className="text-sm text-gray-500">
              There are no results pending publication for this date.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">
                {results.length} result{results.length === 1 ? "" : "s"} will be published.
              </p>
              <div className="mt-4 max-h-96 overflow-y-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Student</TableHeaderCell>
                      <TableHeaderCell>Score</TableHeaderCell>
                      <TableHeaderCell>Result</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.registrationId}>
                        <TableCell className="font-medium text-gray-900">{result.studentName}</TableCell>
                        <TableCell>{result.score}</TableCell>
                        <TableCell>
                          <Badge tone={result.passed ? "green" : "red"}>
                            {result.passed ? "Passed" : "Not passed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Button onClick={handleConfirm} loading={pending}>
                  Publish {results.length} result{results.length === 1 ? "" : "s"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
