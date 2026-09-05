import { notFound } from "next/navigation";
import { ArrowRight, Calendar, ClipboardList, CreditCard, Info } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getPublicExamDateDetail } from "@/features/exams/queries";
import { getSetting } from "@/features/content/queries";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import { ExamDateStatusBadge } from "@/components/exams/ExamDateStatusBadge";
import { getExamDateStatus } from "@/lib/exam-date-status";
import { examTypeLabel } from "@/lib/exam-type";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ examDateId: string }>;
}

export default async function ExamDateDetailPage({ params }: PageProps) {
  const { examDateId } = await params;
  const [examDate, paymentPortalUrl, locale, t, tStatuses, tExamType] = await Promise.all([
    getPublicExamDateDetail(examDateId),
    getSetting("payment_portal_url"),
    getLocale(),
    getTranslations("ExamDatePage"),
    getTranslations("Statuses"),
    getTranslations("ExamType"),
  ]);

  if (!examDate) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const status = getExamDateStatus(examDate);

  // Si el alumno ya está inscrito a esta fecha, mostramos un acceso directo a
  // su inscripción en el panel en vez del botón de inscribirse.
  const profile = await getCurrentProfile();
  const existingRegistration = profile
    ? await prisma.registration.findUnique({
        where: { profileId_examDateId: { profileId: profile.id, examDateId: examDate.id } },
        select: { id: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-500">
        {examTypeLabel(examDate.exam.type, examDate.exam.name, tExamType("genericExam"))}
      </p>
      <div className="mt-1 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {examDate.exam.name} • {examDate.term.name} {examDate.term.year}
        </h1>
        <ExamDateStatusBadge status={status} label={tStatuses(status)} />
      </div>
      {examDate.exam.description && <p className="mt-2 text-gray-600">{examDate.exam.description}</p>}

      <Card className="mt-8">
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-wine-700" />
            <div>
              <p className="font-medium text-gray-900">{t("examDateLabel")}</p>
              <p className="text-sm text-gray-600">{dateFormatter.format(examDate.examDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-0.5 h-5 w-5 text-wine-700" />
            <div>
              <p className="font-medium text-gray-900">{t("registrationPeriod")}</p>
              <p className="text-sm text-gray-600">
                {dateFormatter.format(examDate.registrationStartDate)} •{" "}
                {dateFormatter.format(examDate.registrationEndDate)}
              </p>
            </div>
          </div>
          {examDate.info && (
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-wine-700" />
              <div>
                <p className="font-medium text-gray-900">{t("relevantInfo")}</p>
                <p className="text-sm text-gray-600">{examDate.info}</p>
              </div>
            </div>
          )}
          {examDate.instructions && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">{t("instructions")}</p>
              <p className="mt-1 text-sm text-gray-600">{examDate.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        {existingRegistration ? (
          <Link
            href={`/mis-examenes/${existingRegistration.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-wine-700 px-6 py-3 text-sm font-medium text-white hover:bg-wine-800"
          >
            {t("viewInMyDashboard")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <>
            {status === "OPEN" && (
              <Link
                href={`/inscripcion/${examDate.id}`}
                className="rounded-lg bg-wine-700 px-6 py-3 text-sm font-medium text-white hover:bg-wine-800"
              >
                {t("registerCta")}
              </Link>
            )}
            {status === "UPCOMING" && (
              <span className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-500">
                {tStatuses("UPCOMING")}
              </span>
            )}
            {status === "CLOSED" && (
              <span className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-500">
                {tStatuses("CLOSED")}
              </span>
            )}
          </>
        )}
        {paymentPortalUrl && (
          <a
            href={paymentPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gold-300 px-6 py-3 text-sm font-medium text-gold-700 hover:bg-gold-50"
          >
            <CreditCard className="h-4 w-4" />
            {t("payExam")}
          </a>
        )}
      </div>
    </div>
  );
}
