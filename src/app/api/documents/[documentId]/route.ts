import { NextResponse } from "next/server";
import { requireAuth, canAccessDocument } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getStorage } from "@/lib/storage";
import { DOCUMENT_DOWNLOAD_URL_TTL_SECONDS } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

/**
 * Sirve un documento privado vía redirect a una URL presignada de corta
 * duración, tras verificar autorización en cada solicitud. Acceso denegado
 * devuelve 404 (no 403) para no confirmar la existencia del recurso.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const profile = await requireAuth();
  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { registration: { select: { profileId: true } } },
  });

  if (!document || !canAccessDocument(profile, document)) {
    return new NextResponse(null, { status: 404 });
  }

  const url = await getStorage().getDownloadUrl(document.storageKey, DOCUMENT_DOWNLOAD_URL_TTL_SECONDS);
  return NextResponse.redirect(url, { status: 307 });
}
