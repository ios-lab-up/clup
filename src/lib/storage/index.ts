import "server-only";
import { R2StorageAdapter } from "@/lib/storage/r2-storage-adapter";
import type { StorageAdapter } from "@/lib/storage/storage-adapter";

let instance: StorageAdapter | null = null;

// Instanciación perezosa: evita fallar en tiempo de build/import si las
// credenciales de R2 todavía no están configuradas en el entorno.
export function getStorage(): StorageAdapter {
  if (!instance) {
    instance = new R2StorageAdapter();
  }
  return instance;
}

export type { StorageAdapter, UploadPolicy, StoredObjectMetadata } from "@/lib/storage/storage-adapter";
