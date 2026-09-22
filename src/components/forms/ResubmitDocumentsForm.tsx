"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DocumentUploadField, type UploadedDocument } from "@/components/forms/DocumentUploadField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { resubmitRegistration } from "@/features/registrations/actions";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/constants";

interface ResubmitDocumentsFormProps {
  registrationId: string;
  examDateId: string;
}

export function ResubmitDocumentsForm({ registrationId, examDateId }: ResubmitDocumentsFormProps) {
  const t = useTranslations("MyExamPage");
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, UploadedDocument>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDocumentsUploaded = useMemo(
    () => REQUIRED_DOCUMENT_TYPES.every((type) => documents[type]),
    [documents],
  );
  const canSubmit = allDocumentsUploaded && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await resubmitRegistration({
      registrationId,
      documents: Object.values(documents),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">{t("resubmitSubtitle")}</p>

      <div className="space-y-3">
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

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={!canSubmit} loading={submitting} className="w-full">
        {t("resubmitButton")}
      </Button>
    </form>
  );
}
