import type { HTMLAttributes } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: "bg-blue-50 border-blue-400 text-blue-800",
  success: "bg-green-50 border-green-400 text-green-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  error: "bg-red-50 border-red-400 text-red-800",
};

const VARIANT_ICONS: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  const Icon = VARIANT_ICONS[variant];
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-lg border-l-4 p-4 text-sm", VARIANT_CLASSES[variant], className)}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
      </div>
    </div>
  );
}
