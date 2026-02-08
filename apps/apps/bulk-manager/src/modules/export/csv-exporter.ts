import Papa from "papaparse";

/**
 * Convert an array of row objects to a CSV string.
 */
export function exportToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  return Papa.unparse(rows);
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
