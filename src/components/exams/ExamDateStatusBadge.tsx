import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { ExamDateStatus } from "@/lib/exam-date-status";

const TONE_BY_STATUS: Record<ExamDateStatus, BadgeTone> = {
  UPCOMING: "gray",
  OPEN: "green",
  CLOSED: "red",
};

// Ver nota en RegistrationStatusBadge: label resuelto por el caller.
export function ExamDateStatusBadge({ status, label }: { status: ExamDateStatus; label: string }) {
  return <Badge tone={TONE_BY_STATUS[status]}>{label}</Badge>;
}
