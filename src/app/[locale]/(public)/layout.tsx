import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Forzado a dinámico: el Header depende de la sesión (Clerk) y el contenido
// (exámenes/FAQs/instrucciones) es administrable y debe reflejarse siempre
// al toque, sin depender de heurísticas implícitas de prerenderizado.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
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
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
