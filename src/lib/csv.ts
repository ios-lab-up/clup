import Papa from "papaparse";

export interface ParsedCsvRow {
  row: Record<string, string>;
  index: number;
}

export interface ParseCsvResult {
  headers: string[];
  rows: ParsedCsvRow[];
  errors: string[];
}

/**
 * Parsea un CSV en filas de texto crudo. La validación semántica de columnas
 * y valores es responsabilidad del llamador (ver csv-import-service).
 */
export function parseCsv(content: string): ParseCsvResult {
  const result = Papa.parse<Record<string, string>>(content.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data.map((row, index) => ({ row, index: index + 2 })); // +2: fila 1 es el header
  const errors = result.errors.map(
    (error) => `Fila ${(error.row ?? 0) + 2}: ${error.message}`,
  );

  return { headers, rows, errors };
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  return Papa.unparse(
    { fields: columns as string[], data: rows.map((row) => columns.map((col) => row[col] ?? "")) },
    { newline: "\r\n" },
  );
}
