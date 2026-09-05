import { z } from "zod";

export const settingSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1, { error: "El valor no puede estar vacío." }),
});

export const paymentPortalUrlSchema = z.url({ error: "Ingresa una URL válida (https://...)." });
