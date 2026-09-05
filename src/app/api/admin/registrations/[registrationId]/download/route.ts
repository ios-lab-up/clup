import JSZip from "jszip";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getStorage } from "@/lib/storage";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ registrationId: string }>;
}

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Descarga un ZIP con todos los documentos de una inscripción. Solo admin. */
export async function GET(_request: Request, { params }: RouteParams) {
  await requireAdmin();
  const { registrationId } = await params;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { documents: true, profile: true },
  });

  if (!registration) {
    return new Response(null, { status: 404 });
  }

  const storage = getStorage();
  const zip = new JSZip();
  let added = 0;

  for (const document of registration.documents) {
    const object = await storage.getObjectBuffer(document.storageKey);
    if (!object) continue;
    const ext = EXT_BY_MIME[document.mimeType] ?? "bin";
    const label = DOCUMENT_TYPE_LABELS[document.type] ?? document.type;
    zip.file(`${slugify(label)}.${ext}`, object.body);
    added++;
  }

  if (added === 0) {
    return new Response("No hay documentos disponibles.", { status: 404 });
  }

  const content = await zip.generateAsync({ type: "uint8array" });
  // Nombre del archivo: "<nombre del alumno> - <id>.zip"
  const filename = `${slugify(registration.profile.name)} - ${registration.id}.zip`;

  return new Response(content as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
