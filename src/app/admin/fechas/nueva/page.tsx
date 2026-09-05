import { listTerms } from "@/features/admin-terms/queries";
import { listExams } from "@/features/admin-exams/queries";
import { ExamDateForm } from "@/components/admin/ExamDateForm";

export const metadata = { title: "New exam date • Admin CLUP" };

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function NuevaFechaPage({ searchParams }: PageProps) {
  const { termId } = await searchParams;
  const [terms, exams] = await Promise.all([listTerms(), listExams()]);

  const backHref = termId ? `/admin/terms?termId=${termId}` : "/admin/terms";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New exam date</h1>
      <div className="mt-6">
        <ExamDateForm terms={terms} exams={exams} defaultTermId={termId} backHref={backHref} />
      </div>
    </div>
  );
}
