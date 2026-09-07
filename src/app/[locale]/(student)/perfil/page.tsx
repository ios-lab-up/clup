import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { listActiveFacultiesWithCareers } from "@/features/catalog/queries";
import { ProfileForm } from "@/components/forms/ProfileForm";

export const metadata = { title: "Profile • CLUP" };

export default async function PerfilPage() {
  const authProfile = await requireOnboarding();
  const [t, faculties, profile] = await Promise.all([
    getTranslations("Profile"),
    listActiveFacultiesWithCareers(),
    prisma.profile.findUniqueOrThrow({
      where: { id: authProfile.id },
      include: { career: { select: { id: true, facultyId: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mt-1 text-gray-600">{t("subtitle")}</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <ProfileForm
          studentName={profile.name}
          studentEmail={profile.email}
          studentId={profile.studentId ?? ""}
          currentFacultyId={profile.career?.facultyId ?? null}
          currentCareerId={profile.career?.id ?? null}
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
