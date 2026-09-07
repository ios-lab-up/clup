import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/guards";
import { listActiveFacultiesWithCareers } from "@/features/catalog/queries";
import { deriveStudentIdFromEmail } from "@/lib/student-id";
import { OnboardingForm } from "@/components/forms/OnboardingForm";

export const metadata = { title: "Onboarding • CLUP" };

export default async function OnboardingPage() {
  const profile = await requireAuth();

  // Admins y alumnos ya onboardeados no tienen nada que hacer aquí.
  if (profile.role === "ADMIN" || profile.onboardedAt) {
    redirect("/dashboard");
  }

  const [t, faculties, cookieStore] = await Promise.all([
    getTranslations("Onboarding"),
    listActiveFacultiesWithCareers(),
    cookies(),
  ]);
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "es" ? "es" : "en";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mt-1 text-gray-600">{t("subtitle")}</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <OnboardingForm
          studentName={profile.name}
          studentEmail={profile.email}
          derivedStudentId={deriveStudentIdFromEmail(profile.email)}
          existingStudentId={profile.studentId}
          dashboardHref={locale === "es" ? "/es/dashboard" : "/dashboard"}
          faculties={faculties.map((faculty) => ({
            id: faculty.id,
            name: faculty.name,
            isExternal: faculty.isExternal,
            careers: faculty.careers.map((career) => ({ id: career.id, name: career.name })),
          }))}
        />
      </div>
    </div>
  );
}
