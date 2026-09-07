/**
 * Emite el bloque SQL del catálogo (facultades + carreras) desde
 * `src/lib/catalog-data.ts`, para pegarlo en la migración del catálogo.
 *
 *   npx tsx scripts/gen-catalog-sql.ts
 *
 * Idempotente (`ON CONFLICT DO NOTHING`): seguro si la migración se re-corre.
 */
import { CATALOG } from "../src/lib/catalog-data";

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;

const lines: string[] = [
  "-- Catálogo institucional inicial (facultades + carreras).",
  "-- Generado desde src/lib/catalog-data.ts (scripts/gen-catalog-sql.ts).",
  "-- Los cambios posteriores se hacen desde /admin/catalogo, NO re-seedeando.",
  "",
  'INSERT INTO "Faculty" ("id", "name", "slug", "order", "isExternal", "active", "updatedAt") VALUES',
];

lines.push(
  CATALOG.map(
    (f) =>
      `  (${q(f.id)}, ${q(f.name)}, ${q(f.slug)}, ${f.order}, ${f.isExternal}, true, CURRENT_TIMESTAMP)`,
  ).join(",\n") + '\nON CONFLICT ("id") DO NOTHING;',
);

const careers = CATALOG.flatMap((f) => f.careers.map((c) => ({ ...c, facultyId: f.id })));

lines.push(
  "",
  'INSERT INTO "Career" ("id", "facultyId", "name", "order", "active", "updatedAt") VALUES',
  careers
    .map(
      (c) =>
        `  (${q(c.id)}, ${q(c.facultyId)}, ${q(c.name)}, ${c.order}, true, CURRENT_TIMESTAMP)`,
    )
    .join(",\n") + '\nON CONFLICT ("id") DO NOTHING;',
);

process.stdout.write(lines.join("\n") + "\n");
