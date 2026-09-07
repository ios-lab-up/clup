import Image from "next/image";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { SignOutButton } from "@clerk/nextjs";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// El onboarding vive fuera del esquema de locale de next-intl (igual que
// /admin y /sign-in, ver LOCALE_EXCLUDED_PREFIXES en src/proxy.ts). El idioma
// se toma de la cookie NEXT_LOCALE que deja el LanguageSwitcher.
export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-full flex-col bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
            <Image
              src="/logo.svg"
              alt="Universidad Panamericana"
              width={44}
              height={44}
              className="h-11 w-auto"
            />
            <SignOutButton redirectUrl="/">
              <button type="button" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                {locale === "es" ? "Cerrar sesión" : "Sign out"}
              </button>
            </SignOutButton>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
