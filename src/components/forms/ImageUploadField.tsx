"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, X } from "lucide-react";
import { createContentImageUploadPolicy } from "@/features/admin-content/actions";
import { IMAGE_ALLOWED_MIME_TYPES, IMAGE_MAX_SIZE_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  name: string;
  kind: "announcement" | "faq";
  initialImageKey?: string | null;
  initialImageUrl?: string | null;
}

type Status = "idle" | "uploading" | "done" | "error";

/**
 * Drag-and-drop de imagen con subida directa a R2 (presigned PUT), igual
 * patrón que DocumentUploadField pero para contenido público (Avisos/FAQs)
 * subido por el admin. El input hidden `name` lleva el imageKey resultante
 * para que el form padre lo lea con FormData, igual que el resto de los
 * managers de admin.
 */
export function ImageUploadField({ name, kind, initialImageKey, initialImageUrl }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageKey, setImageKey] = useState(initialImageKey ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl ?? null);
  const [status, setStatus] = useState<Status>(initialImageKey ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    if (!IMAGE_ALLOWED_MIME_TYPES.includes(file.type as (typeof IMAGE_ALLOWED_MIME_TYPES)[number])) {
      setStatus("error");
      setError("Invalid file type. Use JPG, PNG or WEBP.");
      return;
    }
    if (file.size > IMAGE_MAX_SIZE_BYTES) {
      setStatus("error");
      setError("File can't be larger than 5 MB.");
      return;
    }

    setStatus("uploading");
    setPreviewUrl(URL.createObjectURL(file));

    const policyResult = await createContentImageUploadPolicy({ kind, mimeType: file.type, size: file.size });
    if (!policyResult.ok) {
      setStatus("error");
      setError(policyResult.message);
      return;
    }

    const { url, headers, key } = policyResult.data;
    const uploadResponse = await fetch(url, { method: "PUT", headers, body: file });
    if (!uploadResponse.ok) {
      setStatus("error");
      setError("Upload failed. Try again.");
      return;
    }

    setStatus("done");
    setImageKey(key);
  }

  function handleRemove() {
    setStatus("idle");
    setImageKey("");
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name={name} value={imageKey} />
      <div
        onClick={() => status !== "uploading" && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          isDragging && "border-wine-700 bg-wine-50",
          !isDragging && status !== "done" && status !== "error" && "border-gray-300 bg-gray-50 hover:border-wine-300 hover:bg-wine-50/40",
          !isDragging && status === "done" && "border-green-300 bg-green-50",
          status === "error" && "border-red-300 bg-red-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ALLOWED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          onClick={(event) => event.stopPropagation()}
        />

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview de una imagen recién subida por el admin, no un asset optimizable de Next
          <img src={previewUrl} alt="" className="max-h-40 rounded object-contain" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wine-100 text-wine-700">
            {status === "uploading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
          </span>
        )}

        <p className="text-xs font-medium text-gray-900">
          {status === "uploading" ? "Uploading…" : status === "done" ? "Image uploaded" : "Drag an image here or click to browse"}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}

        {previewUrl && status !== "uploading" && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleRemove();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" /> Remove image
          </button>
        )}
      </div>
    </div>
  );
}
