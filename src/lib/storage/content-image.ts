import "server-only";
import { getStorage } from "@/lib/storage";
import { AppError } from "@/lib/errors";
import { IMAGE_ALLOWED_MIME_TYPES, IMAGE_MAX_SIZE_BYTES } from "@/lib/constants";

/**
 * Revalida server-side que un imageKey subido por el admin (Avisos/FAQs) sea
 * un objeto real en R2 y cumpla mime/tamaño — nunca se confía en lo que el
 * cliente declaró, mismo criterio que la revalidación de documentos de
 * inscripción (ver submitRegistration).
 */
export async function assertValidContentImageKey(imageKey: string | null): Promise<void> {
  if (!imageKey) return;

  const metadata = await getStorage().headObject(imageKey);
  if (
    !metadata ||
    metadata.size > IMAGE_MAX_SIZE_BYTES ||
    !IMAGE_ALLOWED_MIME_TYPES.includes(metadata.contentType as (typeof IMAGE_ALLOWED_MIME_TYPES)[number])
  ) {
    throw new AppError("La imagen subida no es válida o excede el tamaño permitido.");
  }
}
