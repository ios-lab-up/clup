"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DocumentUploadField, type UploadedDocument } from "@/components/forms/DocumentUploadField";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { submitRegistration } from "@/features/registrations/actions";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/constants";

interface RegistrationFormProps {
  examDateId: string;
  studentName: string;
  studentEmail: string;
  existingStudentId: string | null;
}

export function RegistrationForm({
  examDateId,
  studentName,
  studentEmail,
  existingStudentId,
}: RegistrationFormProps) {
  const t = useTranslations("RegistrationForm");
  const router = useRouter();
  const [studentId, setStudentId] = useState(existingStudentId ?? "");
  const [documents, setDocuments] = useState<Record<string, UploadedDocument>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDocumentsUploaded = useMemo(
    () => REQUIRED_DOCUMENT_TYPES.every((type) => documents[type]),
    [documents],
  );
  const canSubmit = allDocumentsUploaded && studentId.trim().length >= 4 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await submitRegistration({
      examDateId,
      studentId,
      documents: Object.values(documents),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/mis-examenes/${result.data.registrationId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("name")}</Label>
          <Input value={studentName} disabled />
        </div>
        <div>
          <Label>{t("institutionalEmail")}</Label>
          <Input value={studentEmail} disabled />
        </div>
      </div>

      <div>
        <Label htmlFor="studentId">{t("studentId")}</Label>
        <Input
          id="studentId"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          disabled={Boolean(existingStudentId)}
          placeholder={t("studentIdPlaceholder")}
          required
        />
        {existingStudentId && <p className="mt-1 text-xs text-gray-500">{t("studentIdAlreadyRegistered")}</p>}
      </div>

      <div>
        <Label>{t("requiredDocuments")}</Label>
        <div className="mt-2 space-y-3">
          {REQUIRED_DOCUMENT_TYPES.map((type) => (
            <DocumentUploadField
              key={type}
              examDateId={examDateId}
              documentType={type}
              onUploaded={(doc) => setDocuments((prev) => ({ ...prev, [type]: doc }))}
              onCleared={(clearedType) =>
                setDocuments((prev) => {
                  const next = { ...prev };
                  delete next[clearedType];
                  return next;
                })
              }
            />
          ))}
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={!canSubmit} loading={submitting} className="w-full">
        {t("confirmRegistration")}
      </Button>
    </form>
  );
}
