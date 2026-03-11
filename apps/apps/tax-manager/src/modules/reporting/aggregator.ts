import { TaxTransactionLog } from "@/modules/tax-engine/types";

export interface MonthlySummaryRow {
  countryCode: string;
  countryArea?: string;
  currency: string;
  netTotal: number;
  grossTotal: number;
  taxTotal: number;
  transactionCount: number;
  averageTaxRate: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  rows: MonthlySummaryRow[];
  totals: {
    netTotal: number;
    grossTotal: number;
    taxTotal: number;
    transactionCount: number;
  };
}

/**
 * Aggregate transaction logs into monthly summaries grouped by country.
 */
export function aggregateByMonth(
  transactions: TaxTransactionLog[],
  year: number,
  month: number
): MonthlySummary {
  const targetPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const filtered = transactions.filter((t) => t.timestamp.startsWith(targetPrefix));

  const byCountry = new Map<
    string,
    {
      countryCode: string;
      countryArea?: string;
      currency: string;
      netTotal: number;
      grossTotal: number;
      taxTotal: number;
      count: number;
      rateSum: number;
    }
  >();

  for (const t of filtered) {
    const key = `${t.countryCode}:${t.countryArea ?? ""}:${t.currency}`;
    const existing = byCountry.get(key);

    if (existing) {
      existing.netTotal += t.netTotal;
      existing.grossTotal += t.grossTotal;
      existing.taxTotal += t.taxTotal;
      existing.count += 1;
      existing.rateSum += t.taxRate;
    } else {
      byCountry.set(key, {
        countryCode: t.countryCode,
        countryArea: t.countryArea,
        currency: t.currency,
        netTotal: t.netTotal,
        grossTotal: t.grossTotal,
        taxTotal: t.taxTotal,
        count: 1,
        rateSum: t.taxRate,
      });
    }
  }

  const rows: MonthlySummaryRow[] = Array.from(byCountry.values())
    .map((entry) => ({
      countryCode: entry.countryCode,
      countryArea: entry.countryArea,
      currency: entry.currency,
      netTotal: round2(entry.netTotal),
      grossTotal: round2(entry.grossTotal),
      taxTotal: round2(entry.taxTotal),
      transactionCount: entry.count,
      averageTaxRate: round2((entry.rateSum / entry.count) * 100),
    }))
    .sort((a, b) => b.taxTotal - a.taxTotal);

  const totals = {
    netTotal: round2(rows.reduce((s, r) => s + r.netTotal, 0)),
    grossTotal: round2(rows.reduce((s, r) => s + r.grossTotal, 0)),
    taxTotal: round2(rows.reduce((s, r) => s + r.taxTotal, 0)),
    transactionCount: rows.reduce((s, r) => s + r.transactionCount, 0),
  };

  return { year, month, rows, totals };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
