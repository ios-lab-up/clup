"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  // Las fechas de examen viven dentro de cada Term (pestaña "Fechas de
  // examen" en /admin/terms/[id]), por eso /admin/fechas también activa esta.
  { href: "/admin/terms", label: "Terms", alsoActiveOn: ["/admin/fechas"] },
  { href: "/admin/examenes", label: "Exams" },
  { href: "/admin/catalogo", label: "Catalog" },
  { href: "/admin/inscripciones", label: "Registrations" },
  { href: "/admin/resultados", label: "Results" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/instrucciones", label: "Instructions" },
  { href: "/admin/configuracion", label: "Settings" },
  { href: "/admin/administradores", label: "Administrators" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href) || item.alsoActiveOn?.some((p) => pathname.startsWith(p));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-wine-700 text-wine-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
