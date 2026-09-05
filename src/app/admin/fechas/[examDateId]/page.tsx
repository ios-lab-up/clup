import { notFound } from "next/navigation";
import { listTerms } from "@/features/admin-terms/queries";
import { listExams } from "@/features/admin-exams/queries";
import { getExamDateById } from "@/features/admin-examdates/queries";
import { ExamDateForm } from "@/components/admin/ExamDateForm";

export const metadata = { title: "Edit exam date • Admin CLUP" };

interface PageProps {
  params: Promise<{ examDateId: string }>;
}

export default async function EditarFechaPage({ params }: PageProps) {
  const { examDateId } = await params;
  const [terms, exams, examDate] = await Promise.all([
    listTerms(),
    listExams(),
    getExamDateById(examDateId),
  ]);

  if (!examDate) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Edit date • {examDate.exam.name} {examDate.term.name} {examDate.term.year}
      </h1>
      <div className="mt-6">
        <ExamDateForm
          terms={terms}
          exams={exams}
          examDate={examDate}
          backHref={`/admin/terms?termId=${examDate.termId}`}
        />
      </div>
    </div>
  );
}
