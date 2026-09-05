import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "wine" | "gold" | "green" | "red" | "yellow" | "gray" | "blue";

const TONE_CLASSES: Record<BadgeTone, string> = {
  wine: "bg-wine-100 text-wine-800",
  gold: "bg-gold-100 text-gold-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  gray: "bg-gray-100 text-gray-800",
  blue: "bg-blue-100 text-blue-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "gray", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
