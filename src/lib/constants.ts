export const DOCUMENT_MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export const DOCUMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const REQUIRED_DOCUMENT_TYPES = [
  "PAYMENT_PROOF",
  "UNIVERSITY_ID_FRONT",
  "INE_FRONT",
  "INE_BACK",
] as const;

// Usado por el admin (fijo en inglés, sin selector de idioma). El equivalente
// para público/alumno vive en los namespaces "DocumentTypes"/"Statuses" de
// messages/{en,es}.json.
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PAYMENT_PROOF: "Proof of payment",
  UNIVERSITY_ID_FRONT: "University ID (front)",
  INE_FRONT: "INE (front)",
  INE_BACK: "INE (back)",
};

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending approval",
  APPROVED: "Enrolled",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const EXAM_DATE_STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Registration opening soon",
  OPEN: "Registration open",
  CLOSED: "Registration closed",
};

export const DOCUMENT_DOWNLOAD_URL_TTL_SECONDS = 60;

export const CRON_SECRET_HEADER = "x-cron-secret";
