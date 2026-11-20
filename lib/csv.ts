/**
 * Minimal, dependency-free CSV writer for admin exports.
 *
 * Two details matter more than formatting:
 *  • spreadsheet formula injection — a cell beginning with `=`, `+`, `-`, `@`
 *    is executed by Excel/Sheets, so every such value is prefixed with a
 *    single quote before quoting;
 *  • a UTF-8 BOM, so Excel on Windows opens Urdu/accented text correctly.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  // Neutralise formula triggers before any quoting.
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => cell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => cell(c.value(row))).join(","));
  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
