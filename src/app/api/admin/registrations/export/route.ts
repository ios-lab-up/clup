import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { exportRegistrationsCsv } from "@/services/csv-export-service";
import type { RegistrationStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const searchParams = request.nextUrl.searchParams;
  const csv = await exportRegistrationsCsv(prisma, {
    termId: searchParams.get("termId") ?? undefined,
    examId: searchParams.get("examId") ?? undefined,
    examDateId: searchParams.get("examDateId") ?? undefined,
    status: (searchParams.get("status") as RegistrationStatus | null) ?? undefined,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscripciones.csv"`,
    },
  });
}
