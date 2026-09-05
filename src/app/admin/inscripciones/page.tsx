import { Download } from "lucide-react";
import { listRegistrations } from "@/features/admin-registrations/queries";
import { listTerms } from "@/features/admin-terms/queries";
import { listExams } from "@/features/admin-exams/queries";
import { Select } from "@/components/ui/Input";
import { RegistrationStatusBadge } from "@/components/exams/RegistrationStatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { RegistrationRowActions } from "@/components/admin/RegistrationRowActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { REGISTRATION_STATUS_LABELS } from "@/lib/constants";
import type { RegistrationStatus } from "@/generated/prisma/client";

export const metadata = { title: "Registrations • Admin CLUP" };

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

interface PageProps {
  searchParams: Promise<{ termId?: string; examId?: string; status?: string; q?: string }>;
}

export default async function AdminRegistrationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [registrations, terms, exams] = await Promise.all([
    listRegistrations({
      termId: params.termId || undefined,
      examId: params.examId || undefined,
      status: (params.status as RegistrationStatus | undefined) || undefined,
      query: params.q || undefined,
    }),
    listTerms(),
    listExams(),
  ]);

  const exportQuery = new URLSearchParams();
  if (params.termId) exportQuery.set("termId", params.termId);
  if (params.examId) exportQuery.set("examId", params.examId);
  if (params.status) exportQuery.set("status", params.status);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
          <p className="mt-1 text-gray-600">Filter and review student registrations.</p>
        </div>
        <a
          href={`/api/admin/registrations/export?${exportQuery.toString()}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <form method="get" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Select name="termId" defaultValue={params.termId ?? ""}>
          <option value="">All terms</option>
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name} {term.year}
            </option>
          ))}
        </Select>
        <Select name="examId" defaultValue={params.examId ?? ""}>
          <option value="">All exams</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Enrolled</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search student, email or student ID"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wine-700 focus:outline-none focus:ring-1 focus:ring-wine-700"
        />
        <button
          type="submit"
          className="col-span-1 rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800 sm:col-span-4 sm:w-fit"
        >
          Filter
        </button>
      </form>

      <div className="mt-6">
        {registrations.length === 0 ? (
          <EmptyState title="No registrations match these filters" />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Exam</TableHeaderCell>
                <TableHeaderCell>Term</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Result</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.map((registration) => (
                <ClickableRow key={registration.id} href={`/admin/inscripciones/${registration.id}`}>
                  <TableCell className="font-medium text-gray-900">{registration.profile.name}</TableCell>
                  <TableCell>{registration.profile.email}</TableCell>
                  <TableCell>{registration.examDate.exam.name}</TableCell>
                  <TableCell>
                    {registration.examDate.term.name} {registration.examDate.term.year}
                  </TableCell>
                  <TableCell>{dateFormatter.format(registration.examDate.examDate)}</TableCell>
                  <TableCell>
                    <RegistrationStatusBadge status={registration.status} label={REGISTRATION_STATUS_LABELS[registration.status]} />
                  </TableCell>
                  <TableCell>
                    {registration.result?.published
                      ? `${registration.result.score} (${registration.result.passed ? "Passed" : "Not passed"})`
                      : "Pending"}
                  </TableCell>
                  <TableCell>
                    <RegistrationRowActions
                      registrationId={registration.id}
                      studentName={registration.profile.name}
                    />
                  </TableCell>
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
