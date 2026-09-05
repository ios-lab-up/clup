"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getStorage } from "@/lib/storage";
import { sendMail } from "@/lib/mail/send-mail";
import { registrationCreatedEmail } from "@/lib/mail/templates/registration-created";
import { AppError } from "@/lib/errors";
import { toUserMessage } from "@/lib/errors";
import { createRegistration } from "@/services/registration-service";
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_SIZE_BYTES,
} from "@/lib/constants";
import { buildUploadPolicyRequestSchema } from "@/lib/validations/document.schema";
import { buildSubmitRegistrationSchema } from "@/lib/validations/registration.schema";
import type { ActionResult } from "@/types";
import type { UploadPolicy } from "@/lib/storage";

export async function createDocumentUploadPolicy(input: unknown): Promise<ActionResult<UploadPolicy>> {
  const [tDocumentUpload, tErrors] = await Promise.all([
    getTranslations("DocumentUpload"),
    getTranslations("Errors"),
  ]);

  try {
    const profile = await requireAuth();
    const schema = buildUploadPolicyRequestSchema({
      invalidFileType: tDocumentUpload("invalidFileType"),
      fileTooLarge: tDocumentUpload("fileTooLarge"),
    });
    const parsed = schema.parse(input);

    const examDate = await prisma.examDate.findUnique({ where: { id: parsed.examDateId } });
    if (!examDate || !examDate.active) {
      throw new AppError(tErrors("examDateNotAvailable"));
    }

    const key = `registrations/${profile.id}/${parsed.examDateId}/${parsed.documentType}-${crypto.randomUUID()}`;
    const policy = await getStorage().createUploadPolicy(key, parsed.mimeType, DOCUMENT_MAX_SIZE_BYTES);

    return { ok: true, data: policy };
  } catch (error) {
    return { ok: false, message: toUserMessage(error, tErrors("generic")) };
  }
}

export async function submitRegistration(input: unknown): Promise<ActionResult<{ registrationId: string }>> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations("Validation"),
    getTranslations("Errors"),
  ]);

  try {
    const profile = await requireAuth();
    const schema = buildSubmitRegistrationSchema({
      studentIdMinLength: tValidation("studentIdMinLength"),
      studentIdMaxLength: tValidation("studentIdMaxLength"),
      studentIdInvalidChars: tValidation("studentIdInvalidChars"),
      selectExamDate: tValidation("selectExamDate"),
      mustUploadAllDocuments: tValidation("mustUploadAllDocuments"),
    });
    const parsed = schema.parse(input);

    // Cada documento debe pertenecer a esta subida (prefijo del key) — evita
    // que alguien reutilice el storageKey de otra inscripción.
    const expectedPrefix = `registrations/${profile.id}/${parsed.examDateId}/`;
    for (const doc of parsed.documents) {
      if (!doc.storageKey.startsWith(expectedPrefix)) {
        throw new AppError(tErrors("invalidDocument"));
      }
      if (!DOCUMENT_ALLOWED_MIME_TYPES.includes(doc.mimeType as (typeof DOCUMENT_ALLOWED_MIME_TYPES)[number])) {
        throw new AppError(tErrors("invalidFileType"));
      }

      // Revalidación autoritativa: confirma tamaño/tipo reales contra R2, no
      // lo que el cliente declaró.
      const metadata = await getStorage().headObject(doc.storageKey);
      if (!metadata || metadata.size > DOCUMENT_MAX_SIZE_BYTES) {
        throw new AppError(tErrors("documentInvalidOrTooLarge"));
      }
    }

    // La matrícula se captura una sola vez; en inscripciones posteriores se
    // conserva la ya registrada (solo un admin puede corregirla).
    if (!profile.studentId) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { studentId: parsed.studentId },
      });
    }

    const registration = await createRegistration(
      prisma,
      {
        profileId: profile.id,
        examDateId: parsed.examDateId,
        documents: parsed.documents.map((doc) => ({
          type: doc.type,
          storageKey: doc.storageKey,
          mimeType: doc.mimeType,
          size: doc.size,
        })),
      },
      {
        examDateNotAvailable: tErrors("examDateNotAvailable"),
        registrationNotOpenYet: tErrors("registrationNotOpenYet"),
        registrationClosed: tErrors("registrationClosed"),
        alreadyRegistered: tErrors("alreadyRegistered"),
      },
    );

    const email = registrationCreatedEmail({
      studentName: profile.name,
      examName: registration.examDate.exam.name,
      termName: `${registration.examDate.term.name} ${registration.examDate.term.year}`,
      examDate: registration.examDate.examDate,
    });
    await sendMail({ to: profile.email, ...email });

    revalidatePath("/dashboard");
    return { ok: true, data: { registrationId: registration.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error, tErrors("generic")) };
  }
}
