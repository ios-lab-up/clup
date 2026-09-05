import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { upsertProfileFromClerkUser } from "@/lib/auth/current-profile";

/**
 * Sincronización eager de Profile ante user.created/user.updated.
 * Optimización, no dependencia dura: el lazy-upsert de getCurrentProfile()
 * ya es autoritativo, así que el dev local funciona sin exponer este webhook.
 */
export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch {
    return new Response("Firma de webhook inválida.", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    const primaryEmail = user.email_addresses.find(
      (address) => address.id === user.primary_email_address_id,
    )?.email_address;

    if (primaryEmail) {
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || primaryEmail;
      await upsertProfileFromClerkUser({ clerkUserId: user.id, email: primaryEmail, name });
    }
  }

  return new Response("OK", { status: 200 });
}
