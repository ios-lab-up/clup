/**
 * Catálogo institucional inicial: facultad/escuela -> carreras.
 *
 * Fuente única para:
 *  - el `INSERT` del catálogo en la migración `*_catalog_and_onboarding` (se
 *    genera desde aquí con `scripts/gen-catalog-sql` — NO se re-seedea prod);
 *  - `prisma/seed.ts` (DBs locales frescas, upserts idempotentes).
 *
 * Después del primer deploy la DB es la fuente de verdad: los cambios se hacen
 * desde Settings › Catalog en el admin, no editando esta lista.
 *
 * Nombres tal cual el catálogo oficial (MAYÚSCULAS, "LICENCIATURA EN …"). Las
 * variantes de plan ("(Plan 20)", "CD. UP") se colapsan a una sola carrera.
 */

import { slugify } from "./slugify";

export interface CatalogCareer {
  id: string;
  name: string;
  order: number;
}

export interface CatalogFaculty {
  id: string;
  slug: string;
  name: string;
  order: number;
  isExternal: boolean;
  careers: CatalogCareer[];
}

function faculty(
  name: string,
  order: number,
  careerNames: string[],
  options: { isExternal?: boolean; slug?: string } = {},
): CatalogFaculty {
  const slug = options.slug ?? slugify(name);
  return {
    id: `fac-${slug}`,
    slug,
    name,
    order,
    isExternal: options.isExternal ?? false,
    careers: careerNames.map((careerName, index) => ({
      id: `car-${slug}-${slugify(careerName.replace(/^LICENCIATURA EN /i, ""))}`,
      name: careerName,
      order: index,
    })),
  };
}

export const CATALOG: CatalogFaculty[] = [
  faculty("BELLAS ARTES", 0, ["LICENCIATURA EN MÚSICA E INNOVACIÓN"]),
  faculty("CIENCIAS DE LA SALUD", 1, [
    "LICENCIATURA EN ENFERMERÍA",
    "LICENCIATURA EN MÉDICO CIRUJANO",
    "LICENCIATURA EN PSICOLOGÍA",
  ]),
  faculty("CIENCIAS EMPRESARIALES", 2, [
    "LICENCIATURA EN ADMINISTRACIÓN Y DIRECCIÓN",
    "LICENCIATURA EN FINANZAS CUANTITATIVAS",
    "LICENCIATURA EN MERCADOTECNIA Y ESTRATEGIA DE DATOS",
  ]),
  faculty("COMUNICACIÓN", 3, ["LICENCIATURA EN COMUNICACIÓN"]),
  faculty("DERECHO", 4, ["LICENCIATURA EN DERECHO"]),
  faculty("EMPRESARIALES", 5, [
    "LICENCIATURA EN ADMINISTRACIÓN Y DIRECCIÓN DEL TALENTO",
    "LICENCIATURA EN ADMINISTRACIÓN Y FINANZAS",
    "LICENCIATURA EN ADMINISTRACIÓN Y MERCADOTECNIA",
    "LICENCIATURA EN ADMINISTRACIÓN Y NEGOCIOS INTERNACIONALES",
    "LICENCIATURA EN ADMINISTRACIÓN Y RECURSOS HUMANOS",
    "LICENCIATURA EN CONTADURÍA",
    "LICENCIATURA EN INTELIGENCIA DE NEGOCIOS",
    "LICENCIATURA EN MERCADOTECNIA Y ESTRATEGIA DE DATOS",
  ]),
  faculty("ESDAI", 6, [
    "LICENCIATURA EN ADMINISTRACIÓN Y HOSPITALIDAD",
    "LICENCIATURA EN DIRECCIÓN DE NEGOCIOS GASTRONÓMICOS",
    "LICENCIATURA EN HOSPITALIDAD Y DIRECCIÓN",
  ]),
  faculty("FILOSOFÍA", 7, ["LICENCIATURA EN FILOSOFÍA"]),
  faculty("GOBIERNO Y ECONOMÍA", 8, [
    "LICENCIATURA EN ECONOMÍA",
    "LICENCIATURA EN GOBIERNO",
  ]),
  faculty("INGENIERÍA", 9, [
    "LICENCIATURA EN INGENIERÍA EN ANIMACIÓN Y VIDEOJUEGOS",
    "LICENCIATURA EN INGENIERÍA EN INDUSTRIAL E INNOVACIÓN BASADA EN DATOS",
    "LICENCIATURA EN INGENIERÍA EN INNOVACIÓN Y DISEÑO",
    "LICENCIATURA EN INGENIERÍA EN INTELIGENCIA DE DATOS Y CIBERSEGURIDAD",
    "LICENCIATURA EN INGENIERÍA INDUSTRIAL Y GESTIÓN DE LA INNOVACIÓN",
    "LICENCIATURA EN INGENIERÍA MECÁNICA",
    "LICENCIATURA EN INGENIERÍA MECATRÓNICA",
    "LICENCIATURA EN MATEMÁTICAS APLICADAS",
  ]),
  faculty("PEDAGOGÍA", 10, ["LICENCIATURA EN PEDAGOGÍA"]),
  faculty("DOCENTE / EXTERNO", 99, [], { isExternal: true, slug: "docente-externo" }),
];
