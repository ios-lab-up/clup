"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconButtonTone = "default" | "danger";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: IconButtonTone;
  disabled?: boolean;
}

const TONE_CLASSES: Record<IconButtonTone, string> = {
  default: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
  danger: "text-gray-500 hover:bg-red-50 hover:text-red-600",
};

/** Botón de acción compacto con solo icono y tooltip accesible. */
export function IconButton({ icon: Icon, label, onClick, tone = "default", disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
