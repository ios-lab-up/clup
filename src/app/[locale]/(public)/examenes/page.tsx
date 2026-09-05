import { getTranslations } from "next-intl/server";
import { listPublicExamDates } from "@/features/exams/queries";
import { ExamDateCard } from "@/components/exams/ExamDateCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Upcoming exams • CLUP" };

export default async function ExamenesPage() {
  const [examDates, t] = await Promise.all([listPublicExamDates(), getTranslations("ExamsListPage")]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mt-2 text-gray-600">{t("subtitle")}</p>

      {examDates.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("noExamsScheduled")} />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examDates.map((examDate) => (
            <ExamDateCard key={examDate.id} examDate={examDate} />
          ))}
        </div>
      )}
    </div>
  );
}
