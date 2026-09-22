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

export interface ResubmitRegistrationInput {
  registrationId: string;
  profileId: string;
  documents: RegistrationDocumentInput[];
}

export interface ResubmitRegistrationMessages {
  registrationNotFound: string;
  onlyRejectedCanResubmit: string;
  examDateNotAvailable: string;
  registrationClosed: string;
}

/**
 * Reabre una inscripción RECHAZADA con documentos nuevos, en vez de crear una
 * inscripción nueva — evita el @@unique([profileId, examDateId]) y preserva
 * el mismo "intento" (misma fila, mismo historial de audit log). Reemplaza
 * (upsert) los documentos por tipo y regresa la inscripción a PENDING.
 */
export async function resubmitRegistration(
  db: PrismaClient,
  input: ResubmitRegistrationInput,
  messages: ResubmitRegistrationMessages,
) {
  const registration = await db.registration.findUnique({
    where: { id: input.registrationId },
    include: { examDate: true },
  });

  if (!registration || registration.profileId !== input.profileId) {
    throw new AppError(messages.registrationNotFound);
  }
  if (registration.status !== "REJECTED") {
    throw new AppError(messages.onlyRejectedCanResubmit);
  }
  if (!registration.examDate.active) {
    throw new AppError(messages.examDateNotAvailable);
  }
  if (getExamDateStatus(registration.examDate) === "CLOSED") {
    throw new AppError(messages.registrationClosed);
  }

  return db.$transaction(async (tx) => {
    for (const document of input.documents) {
      await tx.document.upsert({
        where: { registrationId_type: { registrationId: input.registrationId, type: document.type } },
        update: { storageKey: document.storageKey, mimeType: document.mimeType, size: document.size },
        create: { registrationId: input.registrationId, ...document },
      });
    }

    return tx.registration.update({
      where: { id: input.registrationId },
      data: { status: "PENDING", rejectionReason: null },
      include: { documents: true, examDate: { include: { exam: true, term: true } }, profile: true },
    });
  });
}
