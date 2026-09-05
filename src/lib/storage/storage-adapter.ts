export interface UploadPolicy {
  /** URL presignada a la que el navegador hace PUT del archivo. */
  url: string;
  /** Header obligatorio que debe enviar el navegador en el PUT. */
  headers: Record<string, string>;
  key: string;
}

export interface StoredObjectMetadata {
  size: number;
  contentType: string;
}

/**
 * Abstracción de storage de archivos. Nada fuera de lib/storage debe importar
 * un SDK de proveedor directamente — cambiar de proveedor implica escribir un
 * nuevo adapter, no tocar el resto de la app.
 */
export interface StorageAdapter {
  /**
   * URL de subida presignada (PUT) — el navegador sube directo al proveedor.
   * Se usa PUT (no POST) porque Cloudflare R2 no implementa presigned POST.
   * La validación real de tamaño/MIME se refuerza server-side con headObject
   * antes de persistir la inscripción.
   */
  createUploadPolicy(key: string, contentType: string, maxSizeBytes: number): Promise<UploadPolicy>;
  /** URL de descarga presignada de corta duración, para servir un objeto privado. */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  /** Metadata real del objeto ya subido (tamaño/MIME), para revalidar server-side. */
  headObject(key: string): Promise<StoredObjectMetadata | null>;
  /** Descarga el objeto completo en memoria (para empaquetar en ZIP, etc.). */
  getObjectBuffer(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
  deleteObject(key: string): Promise<void>;
}
