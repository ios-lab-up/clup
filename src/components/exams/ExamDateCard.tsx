import { getLocale, getTranslations } from "next-intl/server";
import { Calendar, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ExamDateStatusBadge } from "@/components/exams/ExamDateStatusBadge";
import { getExamDateStatus } from "@/lib/exam-date-status";
import { examTypeLabel } from "@/lib/exam-type";
import { Link } from "@/i18n/navigation";
import type { Exam, ExamDate, Term } from "@/generated/prisma/client";

export async function ExamDateCard({
  examDate,
}: {
  examDate: ExamDate & { exam: Exam; term: Term };
}) {
  const status = getExamDateStatus(examDate);
  const [locale, t, tStatuses, tExamType] = await Promise.all([
    getLocale(),
    getTranslations("ExamDateCard"),
    getTranslations("Statuses"),
    getTranslations("ExamType"),
  ]);
  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "long" });

  return (
    <Card className="transition-colors hover:border-wine-300">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-500">
              {examTypeLabel(examDate.exam.type, examDate.exam.name, tExamType("genericExam"))}
            </p>
            <h3 className="text-lg font-bold text-gray-900">
              {examDate.exam.name} • {examDate.term.name} {examDate.term.year}
            </h3>
          </div>
          <ExamDateStatusBadge status={status} label={tStatuses(status)} />
        </div>

        <div className="space-y-1.5 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-wine-700" />
            {t("examDate", { date: dateFormatter.format(examDate.examDate) })}
          </p>
          <p className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-wine-700" />
            {t("registrationWindow", {
              start: dateFormatter.format(examDate.registrationStartDate),
              end: dateFormatter.format(examDate.registrationEndDate),
            })}
          </p>
        </div>

        <Link
          href={`/examenes/${examDate.id}`}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800"
        >
          {t("viewDetail")}
        </Link>
      </CardContent>
    </Card>
  );
}
