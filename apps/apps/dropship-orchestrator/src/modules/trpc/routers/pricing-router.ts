import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";
import {
  PricingRuleSchema,
  DEFAULT_RULES,
  resolveRule,
  applyRule,
} from "@/modules/pricing/pricing-rules";
import type { PricingRule } from "@/modules/pricing/pricing-rules";
import {
  ExchangeRateSchema,
  DEFAULT_RATES,
  isRateStale,
  rateDaysAge,
  convertCurrency,
} from "@/modules/pricing/currency-converter";
import type { ExchangeRate } from "@/modules/pricing/currency-converter";

const logger = createLogger("PricingRouter");

// ---------------------------------------------------------------------------
// GraphQL for reading/writing app metadata
// ---------------------------------------------------------------------------

const FETCH_APP_METADATA = gql`
  query FetchPricingAppMetadata {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const UPDATE_PRIVATE_METADATA = gql`
  mutation UpdatePricingAppMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        ... on App {
          id
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const METADATA_KEY_RULES = "dropship-pricing-rules";
const METADATA_KEY_RATES = "dropship-exchange-rates";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAppMetadata(client: any): Promise<{ appId: string; meta: Record<string, string> }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();
  if (error || !data?.app) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch app metadata" });
  }
  const meta: Record<string, string> = {};
  for (const entry of data.app.privateMetadata || []) {
    meta[entry.key] = entry.value;
  }
  return { appId: data.app.id, meta };
}

function parseRules(raw: string | undefined): PricingRule[] {
  if (!raw) return DEFAULT_RULES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

function parseRates(raw: string | undefined): ExchangeRate[] {
  if (!raw) return DEFAULT_RATES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RATES;
  } catch {
    return DEFAULT_RATES;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const pricingRouter = router({
  // Get all pricing rules
  getRules: protectedClientProcedure.query(async ({ ctx }) => {
    const { meta } = await getAppMetadata(ctx.apiClient);
    return { rules: parseRules(meta[METADATA_KEY_RULES]) };
  }),

  // Save pricing rules
  saveRules: protectedClientProcedure
    .input(z.object({ rules: z.array(PricingRuleSchema) }))
    .mutation(async ({ ctx, input }) => {
      const { appId } = await getAppMetadata(ctx.apiClient);
      await ctx.apiClient
        .mutation(UPDATE_PRIVATE_METADATA, {
          id: appId,
          input: [{ key: METADATA_KEY_RULES, value: JSON.stringify(input.rules) }],
        })
        .toPromise();
      logger.info("Pricing rules saved", { count: input.rules.length });
      return { ok: true };
    }),

  // Get exchange rates
  getRates: protectedClientProcedure.query(async ({ ctx }) => {
    const { meta } = await getAppMetadata(ctx.apiClient);
    const rates = parseRates(meta[METADATA_KEY_RATES]);
    return {
      rates,
      warnings: rates
        .filter((r) => isRateStale(r))
        .map((r) => ({
          pair: `${r.from}→${r.to}`,
          daysOld: rateDaysAge(r),
          message: `Exchange rate ${r.from}→${r.to} is ${rateDaysAge(r)} days old. Consider updating.`,
        })),
    };
  }),

  // Save exchange rates
  saveRates: protectedClientProcedure
    .input(z.object({ rates: z.array(ExchangeRateSchema) }))
    .mutation(async ({ ctx, input }) => {
      const { appId } = await getAppMetadata(ctx.apiClient);
      await ctx.apiClient
        .mutation(UPDATE_PRIVATE_METADATA, {
          id: appId,
          input: [{ key: METADATA_KEY_RATES, value: JSON.stringify(input.rates) }],
        })
        .toPromise();
      logger.info("Exchange rates saved", { count: input.rates.length });
      return { ok: true };
    }),

  // Preview pricing: compute retail prices for a set of products
  previewPricing: protectedClientProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            name: z.string(),
            costPrice: z.number(),
            supplierId: z.string().optional(),
            categorySlug: z.string().optional(),
          }),
        ),
        targetCurrency: z.string().default("USD"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { meta } = await getAppMetadata(ctx.apiClient);
      const rules = parseRules(meta[METADATA_KEY_RULES]);
      const rates = parseRates(meta[METADATA_KEY_RATES]);

      const results = input.products.map((p) => {
        const rule = resolveRule(rules, {
          supplierId: p.supplierId,
          categorySlug: p.categorySlug,
        });

        const retailUSD = rule ? applyRule(rule, p.costPrice) : p.costPrice * 2.5;
        let retailTarget = retailUSD;
        let costTarget = p.costPrice;

        if (input.targetCurrency !== "USD") {
          retailTarget = convertCurrency(retailUSD, "USD", input.targetCurrency, rates) ?? retailUSD;
          costTarget = convertCurrency(p.costPrice, "USD", input.targetCurrency, rates) ?? p.costPrice;
        }

        const margin = retailTarget - costTarget;
        const marginPercent = retailTarget > 0 ? (margin / retailTarget) * 100 : 0;

        return {
          name: p.name,
          costPrice: Math.round(costTarget * 100) / 100,
          retailPrice: Math.round(retailTarget * 100) / 100,
          margin: Math.round(margin * 100) / 100,
          marginPercent: Math.round(marginPercent * 10) / 10,
          appliedRule: rule?.name ?? "Default 2.5x",
          currency: input.targetCurrency,
        };
      });

      return { results };
    }),
});
