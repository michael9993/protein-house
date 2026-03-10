import { TaxTransactionLog } from "@/modules/tax-engine/types";

const HEADERS = [
  "Transaction ID",
  "Date",
  "Type",
  "Channel",
  "Country",
  "State/Area",
  "Currency",
  "Net Total",
  "Gross Total",
  "Tax Amount",
  "Tax Rate (%)",
  "Lines Count",
  "Matched Rule",
];

/**
 * Generate a CSV string from transaction logs for a given month.
 */
export function generateCsv(
  transactions: TaxTransactionLog[],
  year: number,
  month: number
): { csv: string; filename: string } {
  const targetPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const filtered = transactions.filter((t) => t.timestamp.startsWith(targetPrefix));

  if (filtered.length === 0) {
    return {
      csv: HEADERS.join(",") + "\n",
      filename: `tax-report-${year}-${String(month).padStart(2, "0")}-empty.csv`,
    };
  }

  const rows = filtered.map((t) =>
    [
      t.id,
      t.timestamp,
      t.type,
      t.channelSlug,
      t.countryCode,
      t.countryArea ?? "",
      t.currency,
      t.netTotal.toFixed(2),
      t.grossTotal.toFixed(2),
      t.taxTotal.toFixed(2),
      (t.taxRate * 100).toFixed(2),
      t.linesCount,
      t.ruleName ?? "Default",
    ]
      .map(escapeCsvField)
      .join(",")
  );

  const csv = [HEADERS.join(","), ...rows].join("\n");

  return {
    csv,
    filename: `tax-report-${year}-${String(month).padStart(2, "0")}.csv`,
  };
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
