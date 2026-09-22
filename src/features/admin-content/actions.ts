"use server";

import { requireAdmin } from "@/lib/auth/guards";
import { getStorage } from "@/lib/storage";
import { toUserMessage } from "@/lib/errors";
import { IMAGE_MAX_SIZE_BYTES } from "@/lib/constants";
import { contentImageUploadPolicySchema } from "@/lib/validations/content.schema";
import type { ActionResult } from "@/types";
import type { UploadPolicy } from "@/lib/storage";

const KIND_PREFIXES = {
  announcement: "announcements",
  faq: "faqs",
} as const;

/** Policy de subida presignada (PUT) para la imagen de un aviso o FAQ. */
export async function createContentImageUploadPolicy(input: unknown): Promise<ActionResult<UploadPolicy>> {
  try {
    await requireAdmin();
    const parsed = contentImageUploadPolicySchema.parse(input);
    const key = `content/${KIND_PREFIXES[parsed.kind]}/${crypto.randomUUID()}`;
    const policy = await getStorage().createUploadPolicy(key, parsed.mimeType, IMAGE_MAX_SIZE_BYTES);
    return { ok: true, data: policy };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
