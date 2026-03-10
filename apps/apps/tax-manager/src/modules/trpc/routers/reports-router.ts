import { z } from "zod";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { TaxManagerConfigSchema, TaxTransactionLogSchema } from "@/modules/tax-engine/schemas";
import { createLogger } from "@/logger";

const logger = createLogger("reports-router");

const METADATA_KEY = "tax-manager-config";
const TRANSACTIONS_KEY = "tax-manager-transactions";

async function fetchMetadataByKey(saleorApiUrl: string, appToken: string, key: string) {
  const query = `query { app { id privateMetadata { key value } } }`;
  const url = saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  const appId = json.data?.app?.id;
  const metadata = json.data?.app?.privateMetadata ?? [];
  const entry = metadata.find((m: any) => m.key === key);
  return { appId, value: entry?.value ? JSON.parse(entry.value) : null };
}

export const reportsRouter = router({
  monthlySummary: protectedClientProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2099),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { value: transactions } = await fetchMetadataByKey(
        ctx.saleorApiUrl,
        ctx.appToken,
        TRANSACTIONS_KEY
      );

      if (!transactions || !Array.isArray(transactions)) {
        return { summary: [], totalNet: 0, totalGross: 0, totalTax: 0, transactionCount: 0 };
      }

      const targetMonth = `${input.year}-${String(input.month).padStart(2, "0")}`;

      const filtered = transactions.filter((t: any) => t.timestamp?.startsWith(targetMonth));

      // Group by country
      const byCountry = new Map<string, { net: number; gross: number; tax: number; count: number; rate: number }>();

      for (const t of filtered) {
        const key = t.countryCode ?? "UNKNOWN";
        const existing = byCountry.get(key) ?? { net: 0, gross: 0, tax: 0, count: 0, rate: t.taxRate ?? 0 };
        existing.net += t.netTotal ?? 0;
        existing.gross += t.grossTotal ?? 0;
        existing.tax += t.taxTotal ?? 0;
        existing.count += 1;
        byCountry.set(key, existing);
      }

      const summary = Array.from(byCountry.entries()).map(([country, data]) => ({
        countryCode: country,
        netTotal: Math.round(data.net * 100) / 100,
        grossTotal: Math.round(data.gross * 100) / 100,
        taxTotal: Math.round(data.tax * 100) / 100,
        transactionCount: data.count,
        averageRate: Math.round(data.rate * 10000) / 100,
      }));

      return {
        summary: summary.sort((a, b) => b.taxTotal - a.taxTotal),
        totalNet: Math.round(filtered.reduce((s: number, t: any) => s + (t.netTotal ?? 0), 0) * 100) / 100,
        totalGross: Math.round(filtered.reduce((s: number, t: any) => s + (t.grossTotal ?? 0), 0) * 100) / 100,
        totalTax: Math.round(filtered.reduce((s: number, t: any) => s + (t.taxTotal ?? 0), 0) * 100) / 100,
        transactionCount: filtered.length,
      };
    }),

  exportCsv: protectedClientProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2099),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { value: transactions } = await fetchMetadataByKey(
        ctx.saleorApiUrl,
        ctx.appToken,
        TRANSACTIONS_KEY
      );

      if (!transactions || !Array.isArray(transactions)) {
        return { csv: "No transactions found", filename: "empty.csv" };
      }

      const targetMonth = `${input.year}-${String(input.month).padStart(2, "0")}`;
      const filtered = transactions.filter((t: any) => t.timestamp?.startsWith(targetMonth));

      const headers = [
        "Date",
        "Type",
        "Channel",
        "Country",
        "State",
        "Currency",
        "Net Total",
        "Gross Total",
        "Tax Amount",
        "Tax Rate (%)",
        "Lines",
        "Rule",
      ];

      const rows = filtered.map((t: any) => [
        t.timestamp,
        t.type,
        t.channelSlug,
        t.countryCode,
        t.countryArea ?? "",
        t.currency,
        t.netTotal,
        t.grossTotal,
        t.taxTotal,
        (t.taxRate * 100).toFixed(2),
        t.linesCount,
        t.ruleName ?? "Default",
      ]);

      const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");

      return {
        csv,
        filename: `tax-report-${input.year}-${String(input.month).padStart(2, "0")}.csv`,
      };
    }),
});
