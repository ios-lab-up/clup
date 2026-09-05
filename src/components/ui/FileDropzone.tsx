"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  id?: string;
  name: string;
  accept?: string;
  label?: string;
  hint?: string;
  required?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Input de archivo con drag & drop. Mantiene un <input type="file"> nativo
 * sincronizado (vía DataTransfer) para que siga funcionando dentro de un
 * <form> normal — el server action lo lee con formData.get(name) igual que
 * un input de archivo cualquiera.
 */
export function FileDropzone({
  id,
  name,
  accept,
  label = "Drag your file here",
  hint = "or click to browse from your computer",
  required,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function setFile(file: File | null) {
    if (!inputRef.current) return;

    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputRef.current.files = dataTransfer.files;
      setFileName(file.name);
      setFileSize(file.size);
    } else {
      inputRef.current.value = "";
      setFileName(null);
      setFileSize(null);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) setFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragging && "border-wine-700 bg-wine-50",
        !isDragging && !fileName && "border-gray-300 bg-gray-50 hover:border-wine-300 hover:bg-wine-50/40",
        !isDragging && fileName && "border-green-300 bg-green-50",
      )}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        onClick={(event) => event.stopPropagation()}
      />

      {fileName ? (
        <>
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <p className="text-sm font-medium text-gray-900">{fileName}</p>
          {fileSize !== null && <p className="text-xs text-gray-500">{formatSize(fileSize)}</p>}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFile(null);
            }}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
            Remove file
          </button>
        </>
      ) : (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-wine-100 text-wine-700">
            {isDragging ? <FileSpreadsheet className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
          </span>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{hint}</p>
        </>
      )}
    </div>
  );
}
