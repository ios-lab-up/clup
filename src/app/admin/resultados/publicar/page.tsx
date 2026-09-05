import { listExamDates } from "@/features/admin-examdates/queries";
import { BulkPublishWizard } from "@/components/admin/BulkPublishWizard";
import { examTypeLabel } from "@/lib/exam-type";

export const metadata = { title: "Publish results • Admin CLUP" };

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function PublicarResultadosPage() {
  const examDates = await listExamDates();

  const examDateOptions = examDates.map((examDate) => ({
    id: examDate.id,
    termLabel: `${examDate.term.name} ${examDate.term.year}`,
    examLabel: examTypeLabel(examDate.exam.type, examDate.exam.name),
    dateLabel: dateFormatter.format(examDate.examDate),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Publish results</h1>
      <p className="mt-1 text-gray-600">
        Choose an exam date to review and bulk-publish the results already captured.
      </p>

      <div className="mt-6">
        <BulkPublishWizard examDates={examDateOptions} />
      </div>
    </div>
  );
}
