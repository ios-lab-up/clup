import { listExamDates } from "@/features/admin-examdates/queries";
import { CsvImportWizard } from "@/components/admin/CsvImportWizard";
import { examTypeLabel } from "@/lib/exam-type";

export const metadata = { title: "Import results • Admin CLUP" };

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function ImportarResultadosPage() {
  const examDates = await listExamDates();

  const examDateOptions = examDates.map((examDate) => ({
    id: examDate.id,
    termLabel: `${examDate.term.name} ${examDate.term.year}`,
    examLabel: examTypeLabel(examDate.exam.type, examDate.exam.name),
    dateLabel: dateFormatter.format(examDate.examDate),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Import results</h1>
      <p className="mt-1 text-gray-600">Bulk-upload scores via CSV (columns: student_id, score).</p>

      <div className="mt-6">
        <CsvImportWizard examDates={examDateOptions} />
      </div>
    </div>
  );
}
