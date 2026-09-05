export type ExamDateStatus = "UPCOMING" | "OPEN" | "CLOSED";

export interface ExamDateWindow {
  registrationStartDate: Date;
  registrationEndDate: Date;
}

/**
 * El estado de una ExamDate nunca se persiste — se deriva comparando `now`
 * contra la ventana de inscripción. Esto evita drift y jobs de sincronización.
 */
export function getExamDateStatus(
  { registrationStartDate, registrationEndDate }: ExamDateWindow,
  now: Date = new Date(),
): ExamDateStatus {
  if (now < registrationStartDate) return "UPCOMING";
  if (now > registrationEndDate) return "CLOSED";
  return "OPEN";
}

export function isRegistrationOpen(window: ExamDateWindow, now: Date = new Date()): boolean {
  return getExamDateStatus(window, now) === "OPEN";
}
