/**
 * Deriva la matrícula del correo institucional cuando la parte local es
 * puramente numérica y el dominio es `up.edu.mx` (ej. `0218982@up.edu.mx` ->
 * `"0218982"`). Para correos de docentes/personal (`isiguenza@up.edu.mx`) o
 * externos devuelve `null` — ahí la matrícula se captura a mano en el onboarding.
 */
export function deriveStudentIdFromEmail(email: string): string | null {
  const match = /^(\d+)@up\.edu\.mx$/i.exec(email.trim());
  return match ? match[1] : null;
}
