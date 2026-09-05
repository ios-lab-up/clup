"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fila de tabla que navega al detalle al hacer click. Las celdas de acciones
 * deben envolver su contenido en <StopClick> para no disparar la navegación.
 */
export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className={cn("cursor-pointer transition-colors hover:bg-gray-50", className)}
    >
      {children}
    </tr>
  );
}

/** Evita que los clicks dentro (botones de acción, diálogos) naveguen la fila. */
export function StopClick({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      onClick={(event) => event.stopPropagation()}
      role="presentation"
    >
      {children}
    </div>
  );
}
