import Papa from "papaparse";

/**
 * Parse CSV string content into an array of row objects.
 * Each row is a Record<string, string> where keys are column headers.
 */
export function parseCSV(content: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter(
      (e) => e.type !== "FieldMismatch"
    );
    if (criticalErrors.length > 0) {
      throw new Error(
        `CSV parsing errors: ${criticalErrors.map((e) => `Row ${e.row}: ${e.message}`).join("; ")}`
      );
    }
  }

  return result.data;
}

/**
 * Generate CSV string from an array of row objects.
 */
export function generateCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  return Papa.unparse(rows);
}
