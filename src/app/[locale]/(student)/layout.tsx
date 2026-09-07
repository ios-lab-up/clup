import { getTranslations } from "next-intl/server";
import { requireOnboarding } from "@/lib/auth/guards";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  // Regresa a /onboarding al alumno que aún no completa la encuesta inicial.
  await requireOnboarding();
  const t = await getTranslations("Header");

  return (
    <>
      <Header
        showLanguageSwitcher
        labels={{
          signIn: t("signIn"),
          myPanel: t("myPanel"),
          signOut: t("signOut"),
          roleAdmin: t("roleAdmin"),
          roleStudent: t("roleStudent"),
        }}
      />
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </>
  );
}
