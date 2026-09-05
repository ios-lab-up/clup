import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CLUP • Centro de Lenguas UP",
  description: "Registration and results for TOEIC/TOEFL exams at Centro de Lenguas, Universidad Panamericana.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // admin/sign-in viven fuera del segmento [locale] (ver plan de i18n), así que
  // el <html lang> no puede depender de params locale: se lee de la cookie que
  // pone el middleware de next-intl para las rutas que sí están dentro.
  const locale = (await cookies()).get("NEXT_LOCALE")?.value ?? "en";

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
      </html>
    </ClerkProvider>
  );
}
