import { z } from "zod";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { fetchMetadataValue, TRANSACTIONS_KEY } from "../config-repository";
import { aggregateByMonth } from "@/modules/reporting/aggregator";
import { generateCsv } from "@/modules/reporting/csv-export";
import { TaxTransactionLog } from "@/modules/tax-engine/types";

export const reportsRouter = router({
  monthlySummary: protectedClientProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2099),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { value: rawTransactions } = await fetchMetadataValue(
        ctx.saleorApiUrl!,
        ctx.appToken!,
        TRANSACTIONS_KEY
      );

      if (!rawTransactions || !Array.isArray(rawTransactions)) {
        return {
          summary: [],
          totalNet: 0,
          totalGross: 0,
          totalTax: 0,
          transactionCount: 0,
        };
      }

      const transactions = rawTransactions as TaxTransactionLog[];
      const result = aggregateByMonth(transactions, input.year, input.month);

      return {
        summary: result.rows.map((r) => ({
          countryCode: r.countryCode,
          countryArea: r.countryArea,
          netTotal: r.netTotal,
          grossTotal: r.grossTotal,
          taxTotal: r.taxTotal,
          transactionCount: r.transactionCount,
          averageRate: r.averageTaxRate,
        })),
        totalNet: result.totals.netTotal,
        totalGross: result.totals.grossTotal,
        totalTax: result.totals.taxTotal,
        transactionCount: result.totals.transactionCount,
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
      const { value: rawTransactions } = await fetchMetadataValue(
        ctx.saleorApiUrl!,
        ctx.appToken!,
        TRANSACTIONS_KEY
      );

      if (!rawTransactions || !Array.isArray(rawTransactions)) {
        return { csv: "No transactions found", filename: "empty.csv" };
      }

      const transactions = rawTransactions as TaxTransactionLog[];
      return generateCsv(transactions, input.year, input.month);
    }),
});
