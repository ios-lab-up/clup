import { ArrowRight, CalendarClock, ClipboardList, GraduationCap } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getMyRegistrations } from "@/features/registrations/queries";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { listActiveInstructions } from "@/features/content/queries";
import { Card, CardContent } from "@/components/ui/Card";
import { RegistrationStatusBadge } from "@/components/exams/RegistrationStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { examTypeLabel } from "@/lib/exam-type";
import { Link } from "@/i18n/navigation";

export const metadata = { title: "My dashboard • CLUP" };

export default async function DashboardPage() {
  const [registrations, profile, instructions, locale, t, tStatuses, tExamType] = await Promise.all([
    getMyRegistrations(),
    getCurrentProfile(),
    listActiveInstructions(),
    getLocale(),
    getTranslations("StudentDashboard"),
    getTranslations("Statuses"),
    getTranslations("ExamType"),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "long" });
  const now = new Date();

  // Próximo examen: inscripción aprobada cuyo examen aún no ocurre, la más cercana.
  const nextExam = registrations
    .filter((r) => r.status === "APPROVED" && r.examDate.examDate >= now)
    .sort((a, b) => a.examDate.examDate.getTime() - b.examDate.examDate.getTime())[0];

  const approvedCount = registrations.filter((r) => r.status === "APPROVED").length;
  const publishedResults = registrations.filter((r) => r.result?.published);
  const passedCount = publishedResults.filter((r) => r.result?.passed).length;

  const firstName = profile?.name.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("greeting", { name: firstName ? `, ${firstName}` : "" })}</h1>
      <p className="mt-1 text-gray-600">{t("subtitle")}</p>

      {/* Resumen */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-wine-700 p-2">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("nextExam")}</p>
              <p className="font-semibold text-gray-900">
                {nextExam ? dateFormatter.format(nextExam.examDate.examDate) : t("noUpcomingExams")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-gold-500 p-2">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("approvedRegistrations")}</p>
              <p className="font-semibold text-gray-900">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-wine-900 p-2">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("passedExams")}</p>
              <p className="font-semibold text-gray-900">
                {passedCount} / {publishedResults.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximo examen destacado */}
      {nextExam && (
        <Card className="mt-6 border-wine-200 bg-wine-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-wine-700">{t("yourNextExam")}</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {nextExam.examDate.exam.name} • {dateFormatter.format(nextExam.examDate.examDate)}
              </h2>
              {nextExam.examDate.instructions && (
                <p className="mt-1 max-w-xl text-sm text-gray-600">{nextExam.examDate.instructions}</p>
              )}
            </div>
            <Link
              href={`/mis-examenes/${nextExam.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800"
            >
              {t("viewDetail")} <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Mis exámenes */}
      <h2 className="mt-10 text-xl font-bold text-gray-900">{t("myExams")}</h2>
      {registrations.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={t("noRegistrationsTitle")}
            description={t("noRegistrationsDescription")}
            action={
              <Link href="/examenes" className="text-sm font-medium text-wine-700 hover:text-wine-800">
                {t("viewUpcomingExams")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {registrations.map((registration) => (
            <Link key={registration.id} href={`/mis-examenes/${registration.id}`}>
              <Card className="transition-colors hover:border-wine-300">
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold-500">
                      {examTypeLabel(
                        registration.examDate.exam.type,
                        registration.examDate.exam.name,
                        tExamType("genericExam"),
                      )}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {registration.examDate.exam.name} • {registration.examDate.term.name}{" "}
                      {registration.examDate.term.year}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <CalendarClock className="h-4 w-4" />
                      {dateFormatter.format(registration.examDate.examDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RegistrationStatusBadge status={registration.status} label={tStatuses(registration.status)} />
                    {registration.result?.published ? (
                      <Badge tone={registration.result.passed ? "green" : "red"}>
                        {registration.result.passed
                          ? t("passedWithScore", { score: registration.result.score })
                          : t("notPassedWithScore", { score: registration.result.score })}
                      </Badge>
                    ) : (
                      <Badge tone="gray">{t("resultPending")}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Instrucciones generales */}
      {instructions.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold text-gray-900">{t("instructions")}</h2>
          <div className="mt-4 space-y-3">
            {instructions.map((instruction) => (
              <Card key={instruction.id}>
                <CardContent>
                  <h3 className="font-semibold text-gray-900">{instruction.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{instruction.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
