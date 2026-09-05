import { ArrowLeft, Award, Calendar, ClipboardList, FileText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getMyRegistrationDetail } from "@/features/registrations/queries";
import { Card, CardContent } from "@/components/ui/Card";
import { RegistrationStatusBadge } from "@/components/exams/RegistrationStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function RegistrationDetailPage({ params }: PageProps) {
  const { registrationId } = await params;
  const [registration, locale, t, tStatuses, tDocumentTypes] = await Promise.all([
    getMyRegistrationDetail(registrationId),
    getLocale(),
    getTranslations("MyExamPage"),
    getTranslations("Statuses"),
    getTranslations("DocumentTypes"),
  ]);
  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-wine-700 hover:text-wine-800">
        <ArrowLeft className="h-4 w-4" />
        {t("backToMyExams")}
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {registration.examDate.exam.name} • {registration.examDate.term.name} {registration.examDate.term.year}
        </h1>
        <RegistrationStatusBadge status={registration.status} label={tStatuses(registration.status)} />
      </div>

      {registration.status === "REJECTED" && registration.rejectionReason && (
        <Alert variant="error" title={t("registrationRejected")} className="mt-4">
          {registration.rejectionReason}
        </Alert>
      )}

      <Card className="mt-6">
        <CardContent className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-wine-700" />
            {t("examDate", { date: dateFormatter.format(registration.examDate.examDate) })}
          </p>
          {registration.examDate.instructions && (
            <p className="flex items-start gap-2 text-sm text-gray-700">
              <ClipboardList className="mt-0.5 h-4 w-4 flex-shrink-0 text-wine-700" />
              {registration.examDate.instructions}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Award className="h-5 w-5 text-wine-700" />
            {t("result")}
          </h2>
          {registration.result?.published ? (
            <div className="mt-3 flex items-center gap-4">
              <p className="text-3xl font-bold text-gray-900">{registration.result.score}</p>
              <Badge tone={registration.result.passed ? "green" : "red"}>
                {registration.result.passed ? t("passed") : t("notPassed")}
              </Badge>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">{t("resultNotAvailable")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <FileText className="h-5 w-5 text-wine-700" />
            {t("submittedDocuments")}
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {registration.documents.map((document) => (
              <li key={document.id}>
                {tDocumentTypes.has(document.type) ? tDocumentTypes(document.type) : document.type}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
