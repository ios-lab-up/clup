import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        <nav className="flex gap-4">
          <Link href="/examenes" className="hover:text-wine-700">
            {t("exams")}
          </Link>
          <Link href="/faqs" className="hover:text-wine-700">
            {t("faqs")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
