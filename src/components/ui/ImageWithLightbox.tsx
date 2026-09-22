"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ImageWithLightboxProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Imagen clickeable que abre una vista de pantalla completa (object-contain,
 * nunca recorta). Pensada para imágenes de contenido (avisos/FAQs) que
 * pueden venir en cualquier proporción — el thumbnail en el layout normal
 * también debe usar object-contain, esto solo resuelve el "verla completa".
 */
export function ImageWithLightbox({ src, alt, className }: ImageWithLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de R2, no un asset estático de Next */}
      <img
        src={src}
        alt={alt}
        className={className}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de R2, no un asset estático de Next */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full rounded object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
