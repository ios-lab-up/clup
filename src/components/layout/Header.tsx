import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface HeaderLabels {
  signIn: string;
  myPanel: string;
  signOut: string;
  roleAdmin: string;
  roleStudent: string;
}

const DEFAULT_LABELS: HeaderLabels = {
  signIn: "Sign in",
  myPanel: "My dashboard",
  signOut: "Sign out",
  roleAdmin: "Administrator",
  roleStudent: "Student",
};

interface HeaderProps {
  // Admin vive fuera del esquema de locale (next-intl) — este flag evita que
  // el Header, compartido con (public)/(student), monte el selector EN/ES ahí.
  showLanguageSwitcher?: boolean;
  labels?: HeaderLabels;
}

export async function Header({ showLanguageSwitcher = false, labels = DEFAULT_LABELS }: HeaderProps = {}) {
  const [profile, user] = await Promise.all([getCurrentProfile(), currentUser()]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Universidad Panamericana" width={44} height={44} className="h-11 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          {showLanguageSwitcher && <LanguageSwitcher />}

          {profile ? (
            <UserMenu
              name={profile.name}
              email={profile.email}
              imageUrl={user?.imageUrl ?? null}
              role={profile.role === "ADMIN" ? "ADMIN" : "STUDENT"}
              labels={labels}
            />
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800"
            >
              {labels.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
