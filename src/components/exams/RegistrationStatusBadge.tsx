import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { RegistrationStatus } from "@/generated/prisma/client";

const TONE_BY_STATUS: Record<RegistrationStatus, BadgeTone> = {
  PENDING: "yellow",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "gray",
};

// El label se resuelve en el caller (admin usa REGISTRATION_STATUS_LABELS en
// inglés; público/alumno usa el namespace "Statuses" de next-intl) para que
// este componente sirva a ambos sin depender de un locale context.
export function RegistrationStatusBadge({ status, label }: { status: RegistrationStatus; label: string }) {
  return <Badge tone={TONE_BY_STATUS[status]}>{label}</Badge>;
}
