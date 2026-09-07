import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Forzado a dinámico: el Header depende de la sesión (Clerk) y el contenido
// (exámenes/FAQs/instrucciones) es administrable y debe reflejarse siempre
// al toque, sin depender de heurísticas implícitas de prerenderizado.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Un alumno logueado que aún no completa el onboarding no avanza a ningún
  // lado — ni siquiera al sitio público — hasta contestarlo. Anónimos = null.
  const profile = await getCurrentProfile();
  if (profile?.role === "STUDENT" && !profile.onboardedAt) redirect("/onboarding");

  const t = await getTranslations("Header");

  return (
    <>
      <Header
        showLanguageSwitcher
        labels={{
          signIn: t("signIn"),
          myPanel: t("myPanel"),
          profile: t("profile"),
          signOut: t("signOut"),
          roleAdmin: t("roleAdmin"),
          roleStudent: t("roleStudent"),
        }}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
