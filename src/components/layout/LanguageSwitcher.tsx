"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALES = ["en", "es"] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          aria-label={value === "en" ? t("switchToEnglish") : t("switchToSpanish")}
          aria-current={locale === value}
          onClick={() => router.replace(pathname, { locale: value })}
          className={cn(
            "px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
            locale === value ? "bg-wine-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
