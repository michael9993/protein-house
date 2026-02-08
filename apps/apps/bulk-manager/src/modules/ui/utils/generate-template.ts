import * as XLSX from "xlsx";
import { getTargetFieldsInfo, getSampleRow } from "@/modules/import/field-mapper";

function getTemplateData(entityType: string) {
  const fields = getTargetFieldsInfo(entityType);
  const sample = getSampleRow(entityType);
  if (fields.length === 0) return null;

  const headers = fields.map((f) => f.name);
  const descriptions = fields.map(
    (f) => `${f.required ? "(required)" : "(optional)"} ${f.description}`
  );
  const examples = fields.map((f) => sample[f.name] || "");
  return { headers, descriptions, examples };
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download a CSV template file for the given entity type.
 * Row 1: Field names (headers)
 * Row 2: Descriptions with (required)/(optional) prefix
 * Row 3: Example values
 */
export function generateTemplateCSV(entityType: string, entityLabel: string) {
  const data = getTemplateData(entityType);
  if (!data) return;

  const escapeCSV = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = [
    data.headers.map(escapeCSV).join(","),
    data.descriptions.map(escapeCSV).join(","),
    data.examples.map(escapeCSV).join(","),
  ];

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${entityLabel.toLowerCase()}-template.csv`);
}

/**
 * Generate and download an Excel template file for the given entity type.
 * Row 1: Field names (headers)
 * Row 2: Descriptions with (required)/(optional) prefix
 * Row 3: Example values
 * Includes auto-sized columns and styled header row.
 */
export function generateTemplateExcel(entityType: string, entityLabel: string) {
  const data = getTemplateData(entityType);
  if (!data) return;

  const aoa = [data.headers, data.descriptions, data.examples];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-size columns
  worksheet["!cols"] = data.headers.map((h, i) => {
    const maxLen = Math.max(h.length, data.descriptions[i].length, data.examples[i].length);
    return { wch: Math.min(maxLen + 2, 50) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, entityLabel);

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${entityLabel.toLowerCase()}-template.xlsx`);
}
