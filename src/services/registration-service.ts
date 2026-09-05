import type { PrismaClient, DocumentType } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { getExamDateStatus } from "@/lib/exam-date-status";

export interface RegistrationDocumentInput {
  type: DocumentType;
  storageKey: string;
  mimeType: string;
  size: number;
}

export interface CreateRegistrationInput {
  profileId: string;
  examDateId: string;
  documents: RegistrationDocumentInput[];
}

export interface CreateRegistrationMessages {
  examDateNotAvailable: string;
  registrationNotOpenYet: string;
  registrationClosed: string;
  alreadyRegistered: string;
}

/**
 * Valida ventana de inscripción, inactividad y duplicados, y crea la
 * inscripción junto con sus documentos en una sola transacción.
 * Es la validación autoritativa — nunca confiar en la del frontend.
 * `messages` viene de getTranslations("Errors") resuelto en el caller (lado
 * alumno, dentro del esquema de locale).
 */
export async function createRegistration(
  db: PrismaClient,
  input: CreateRegistrationInput,
  messages: CreateRegistrationMessages,
) {
  const examDate = await db.examDate.findUnique({ where: { id: input.examDateId } });

  if (!examDate || !examDate.active) {
    throw new AppError(messages.examDateNotAvailable);
  }

  const status = getExamDateStatus(examDate);
  if (status === "UPCOMING") {
    throw new AppError(messages.registrationNotOpenYet);
  }
  if (status === "CLOSED") {
    throw new AppError(messages.registrationClosed);
  }

  const existing = await db.registration.findUnique({
    where: { profileId_examDateId: { profileId: input.profileId, examDateId: input.examDateId } },
  });
  if (existing) {
    throw new AppError(messages.alreadyRegistered);
  }

  return db.registration.create({
    data: {
      profileId: input.profileId,
      examDateId: input.examDateId,
      status: "PENDING",
      documents: { create: input.documents },
    },
    include: { documents: true, examDate: { include: { exam: true, term: true } }, profile: true },
  });
}

export async function approveRegistration(db: PrismaClient, registrationId: string) {
  return db.registration.update({
    where: { id: registrationId },
    data: { status: "APPROVED", rejectionReason: null },
    include: { profile: true, examDate: { include: { exam: true, term: true } } },
  });
}

export async function rejectRegistration(
  db: PrismaClient,
  registrationId: string,
  reason: string | null,
) {
  return db.registration.update({
    where: { id: registrationId },
    data: { status: "REJECTED", rejectionReason: reason },
    include: { profile: true, examDate: { include: { exam: true, term: true } } },
  });
}
