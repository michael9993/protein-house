import * as XLSX from "xlsx";

/**
 * Convert an array of row objects to a base64-encoded Excel file.
 */
export function exportToExcel(
  rows: Record<string, unknown>[],
  sheetName: string = "Sheet1"
): string {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const maxWidths: number[] = [];
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    headers.forEach((header, colIdx) => {
      let maxLen = header.length;
      rows.forEach((row) => {
        const val = String(row[header] ?? "");
        if (val.length > maxLen) maxLen = val.length;
      });
      maxWidths[colIdx] = Math.min(maxLen + 2, 50);
    });
    worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));
  }

  const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  return buffer;
}

/**
 * Trigger an Excel file download in the browser.
 */
export function downloadExcel(base64Content: string, fileName: string): void {
  const byteChars = atob(base64Content);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
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
