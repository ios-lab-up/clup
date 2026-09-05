import { NextResponse } from "next/server";

// Liveness check para Dokploy (y cualquier otro orquestador): responde 200
// mientras el proceso de Next esté arriba, sin depender de DB/Clerk/R2, para
// no reiniciar el contenedor por una falla transitoria de un servicio externo.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
