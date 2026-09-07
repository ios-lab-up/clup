import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getExamDateStatus } from "@/lib/exam-date-status";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { Alert } from "@/components/ui/Alert";
import { redirect } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ examDateId: string }>;
}

export default async function InscripcionPage({ params }: PageProps) {
  const authProfile = await requireOnboarding();
  const { examDateId } = await params;
  const [locale, t, profile] = await Promise.all([
    getLocale(),
    getTranslations("RegistrationPage"),
    prisma.profile.findUniqueOrThrow({
      where: { id: authProfile.id },
      include: { career: { select: { name: true } } },
    }),
  ]);

  const examDate = await prisma.examDate.findUnique({
    where: { id: examDateId },
    include: { exam: true, term: true },
  });
  if (!examDate || !examDate.active) notFound();

  const existingRegistration = await prisma.registration.findUnique({
    where: { profileId_examDateId: { profileId: profile.id, examDateId } },
  });
  if (existingRegistration) {
    redirect({ href: `/mis-examenes/${existingRegistration.id}`, locale });
  }

  const status = getExamDateStatus(examDate);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-500">{examDate.exam.type}</p>
      <h1 className="text-2xl font-bold text-gray-900">
        {t("title", { examName: examDate.exam.name, termName: examDate.term.name, termYear: examDate.term.year })}
      </h1>

      {status !== "OPEN" ? (
        <Alert variant="warning" className="mt-6">
          {status === "UPCOMING" ? t("registrationOpeningSoon") : t("registrationClosed")}
        </Alert>
      ) : (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <RegistrationForm
            examDateId={examDate.id}
            studentName={profile.name}
            studentEmail={profile.email}
            studentId={profile.studentId ?? ""}
            career={profile.career?.name ?? null}
          />
        </div>
      )}
    </div>
  );
}
