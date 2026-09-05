import Link from "next/link";
import { CheckCircle2, Download, Send, Upload } from "lucide-react";
import { listRegistrations } from "@/features/admin-registrations/queries";
import { listTerms } from "@/features/admin-terms/queries";
import { listExams } from "@/features/admin-exams/queries";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { examTypeLabel } from "@/lib/exam-type";

export const metadata = { title: "Results • Admin CLUP" };

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

interface PageProps {
  searchParams: Promise<{ termId?: string; examId?: string }>;
}

export default async function AdminResultsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [registrations, terms, exams] = await Promise.all([
    listRegistrations({
      status: "APPROVED",
      termId: params.termId || undefined,
      examId: params.examId || undefined,
    }),
    listTerms(),
    listExams(),
  ]);

  // Agrupa por term → examen para una vista más visual y fácil de escanear.
  const groups = new Map<
    string,
    {
      termLabel: string;
      examLabel: string;
      registrations: typeof registrations;
    }
  >();

  for (const registration of registrations) {
    const key = `${registration.examDate.term.id}::${registration.examDate.exam.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        termLabel: `${registration.examDate.term.name} ${registration.examDate.term.year}`,
        examLabel: examTypeLabel(registration.examDate.exam.type, registration.examDate.exam.name),
        registrations: [],
      });
    }
    groups.get(key)!.registrations.push(registration);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="mt-1 text-gray-600">Capture and publish results for approved registrations.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/resultados/publicar"
            className="inline-flex items-center gap-2 rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800"
          >
            <Send className="h-4 w-4" /> Publish results
          </Link>
          <Link
            href="/admin/resultados/importar"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </Link>
          <a
            href="/api/admin/results/export"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <div className="w-56">
          <Select name="termId" defaultValue={params.termId ?? ""}>
            <option value="">All terms</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} {term.year}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Select name="examId" defaultValue={params.examId ?? ""}>
            <option value="">All exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {examTypeLabel(exam.type, exam.name)}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Filter
        </button>
        {(params.termId || params.examId) && (
          <Link
            href="/admin/resultados"
            className="inline-flex items-center px-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 space-y-8">
        {groups.size === 0 ? (
          <EmptyState title="No approved registrations match these filters" />
        ) : (
          Array.from(groups.values()).map((group) => {
            const publishedCount = group.registrations.filter((r) => r.result?.published).length;
            return (
              <div key={`${group.termLabel}-${group.examLabel}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{group.examLabel}</h2>
                    <span className="text-sm text-gray-500">{group.termLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {publishedCount} / {group.registrations.length} published
                  </div>
                </div>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Student</TableHeaderCell>
                      <TableHeaderCell>Date</TableHeaderCell>
                      <TableHeaderCell>Score</TableHeaderCell>
                      <TableHeaderCell>Result</TableHeaderCell>
                      <TableHeaderCell>Published</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.registrations.map((registration) => (
                      <ClickableRow key={registration.id} href={`/admin/resultados/${registration.id}`}>
                        <TableCell className="font-medium text-gray-900">{registration.profile.name}</TableCell>
                        <TableCell>{dateFormatter.format(registration.examDate.examDate)}</TableCell>
                        <TableCell>{registration.result?.score ?? "•"}</TableCell>
                        <TableCell>
                          {registration.result ? (
                            <Badge tone={registration.result.passed ? "green" : "red"}>
                              {registration.result.passed ? "Passed" : "Not passed"}
                            </Badge>
                          ) : (
                            <Badge tone="gray">Not captured</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge tone={registration.result?.published ? "green" : "gray"}>
                            {registration.result?.published ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </ClickableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
