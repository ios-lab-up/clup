import { ZodError } from "zod";

/**
 * Error de aplicación con un mensaje seguro para mostrar al usuario.
 * Cualquier otro error (Prisma, red, etc.) se traduce a un mensaje genérico
 * antes de llegar a la UI — nunca se expone el detalle técnico.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

const GENERIC_MESSAGE = "Something went wrong. Please try again in a moment.";

/**
 * Convierte cualquier error capturado en un mensaje seguro para el usuario,
 * logueando el detalle real en el servidor para debugging. `fallback` deja
 * que el caller pase un mensaje ya traducido (lado alumno, dentro del
 * esquema de locale); el admin no lo pasa y usa el default en inglés.
 */
export function toUserMessage(error: unknown, fallback: string = GENERIC_MESSAGE): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  console.error("[CLUP] Unexpected error:", error);
  return fallback;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
