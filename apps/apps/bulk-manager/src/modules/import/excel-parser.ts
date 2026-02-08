import * as XLSX from "xlsx";

/**
 * Parse Excel file content (base64-encoded) into an array of row objects.
 * Optionally specify a sheet name; defaults to the first sheet.
 */
export function parseExcel(
  base64Content: string,
  sheetName?: string
): Record<string, string>[] {
  const workbook = XLSX.read(base64Content, { type: "base64" });

  const targetSheet = sheetName || workbook.SheetNames[0];

  if (!targetSheet || !workbook.Sheets[targetSheet]) {
    throw new Error(
      `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
    );
  }

  const sheet = workbook.Sheets[targetSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
    raw: false,
  });

  // Normalize all values to strings
  return rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key.trim()] = String(value ?? "").trim();
    }
    return normalized;
  });
}

/**
 * Get sheet names from an Excel file.
 */
export function getExcelSheetNames(base64Content: string): string[] {
  const workbook = XLSX.read(base64Content, { type: "base64" });
  return workbook.SheetNames;
}
