import { listExams } from "@/features/admin-exams/queries";
import { ExamsManager } from "@/components/admin/ExamsManager";

export const metadata = { title: "Exams • Admin CLUP" };

export default async function AdminExamsPage() {
  const exams = await listExams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
      <p className="mt-1 text-gray-600">Manage exam types (TOEIC, TOEFL).</p>
      <div className="mt-6">
        <ExamsManager exams={exams} />
      </div>
    </div>
  );
}
