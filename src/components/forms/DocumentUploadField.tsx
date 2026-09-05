"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { createDocumentUploadPolicy } from "@/features/registrations/actions";
import { DOCUMENT_ALLOWED_MIME_TYPES, DOCUMENT_MAX_SIZE_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface UploadedDocument {
  type: string;
  storageKey: string;
  mimeType: string;
  size: number;
}

interface DocumentUploadFieldProps {
  examDateId: string;
  documentType: string;
  onUploaded: (doc: UploadedDocument) => void;
  onCleared: (documentType: string) => void;
}

type Status = "idle" | "uploading" | "done" | "error";

export function DocumentUploadField({
  examDateId,
  documentType,
  onUploaded,
  onCleared,
}: DocumentUploadFieldProps) {
  const t = useTranslations("DocumentUpload");
  const tDocumentTypes = useTranslations("DocumentTypes");
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    if (!DOCUMENT_ALLOWED_MIME_TYPES.includes(file.type as (typeof DOCUMENT_ALLOWED_MIME_TYPES)[number])) {
      setStatus("error");
      setError(t("invalidFileType"));
      return;
    }
    if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
      setStatus("error");
      setError(t("fileTooLarge"));
      return;
    }

    setStatus("uploading");

    const policyResult = await createDocumentUploadPolicy({
      examDateId,
      documentType,
      mimeType: file.type,
      size: file.size,
    });

    if (!policyResult.ok) {
      setStatus("error");
      setError(policyResult.message);
      return;
    }

    const { url, headers, key } = policyResult.data;
    const uploadResponse = await fetch(url, { method: "PUT", headers, body: file });

    if (!uploadResponse.ok) {
      setStatus("error");
      setError(t("uploadFailed"));
      return;
    }

    setStatus("done");
    onUploaded({ type: documentType, storageKey: key, mimeType: file.type, size: file.size });
  }

  function handleClear() {
    setStatus("idle");
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared(documentType);
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed p-4 transition-colors",
        status === "done" ? "border-green-300 bg-green-50" : "border-gray-300",
        status === "error" && "border-red-300 bg-red-50",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {status === "done" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
          {status === "uploading" && <Loader2 className="h-5 w-5 animate-spin text-wine-700" />}
          {status === "idle" && <Upload className="h-5 w-5 text-gray-400" />}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {tDocumentTypes.has(documentType) ? tDocumentTypes(documentType) : documentType}
            </p>
            {fileName && <p className="text-xs text-gray-500">{fileName}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        {status === "done" ? (
          <button type="button" onClick={handleClear} className="text-xs font-medium text-wine-700 hover:underline">
            {t("change")}
          </button>
        ) : (
          <label className="cursor-pointer text-xs font-medium text-wine-700 hover:underline">
            {t("selectFile")}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
              disabled={status === "uploading"}
            />
          </label>
        )}
      </div>
    </div>
  );
}
