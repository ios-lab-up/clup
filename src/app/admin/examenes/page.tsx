import { listCatalogForOverrides, listExams } from "@/features/admin-exams/queries";
import { ExamsManager } from "@/components/admin/ExamsManager";

export const metadata = { title: "Exams • Admin CLUP" };

export default async function AdminExamsPage() {
  const [exams, faculties] = await Promise.all([listExams(), listCatalogForOverrides()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
      <p className="mt-1 text-gray-600">
        Manage exam types and their passing minimums. Each exam has a general default; you can
        override it per faculty or per program.
      </p>
      <div className="mt-6">
        <ExamsManager
          exams={exams.map((exam) => ({
            id: exam.id,
            type: exam.type,
            name: exam.name,
            description: exam.description,
            passingScore: exam.passingScore,
            active: exam.active,
            passingScores: exam.passingScores.map((row) => ({
              id: row.id,
              scope: row.careerId ? ("CAREER" as const) : ("FACULTY" as const),
              targetName: row.career?.name ?? row.faculty?.name ?? "—",
              score: row.score,
            })),
          }))}
          faculties={faculties.filter((faculty) => !faculty.isExternal)}
        />
      </div>
    </div>
  );
}
