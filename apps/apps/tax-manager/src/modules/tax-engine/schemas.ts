import { z } from "zod";

export const TaxRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  countryCode: z.string().length(2),
  countryArea: z.string().optional(),
  taxRate: z.number().min(0).max(1),
  shippingTaxRate: z.number().min(0).max(1).nullable(),
  priority: z.number().int().min(0).default(0),
  enabled: z.boolean().default(true),
});

export const ChannelTaxConfigSchema = z.object({
  channelSlug: z.string().min(1),
  enabled: z.boolean().default(true),
  pricesIncludeTax: z.boolean().default(false),
  defaultTaxRate: z.number().min(0).max(1).default(0),
  exportZeroRating: z.object({
    enabled: z.boolean().default(true),
    domesticCountryCode: z.string().length(2).default("IL"),
  }).default({}),
});

export const TaxManagerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  rules: z.array(TaxRuleSchema).default([]),
  channels: z.array(ChannelTaxConfigSchema).default([]),
  logTransactions: z.boolean().default(false),
});

export const TaxTransactionLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string(),
  type: z.enum(["checkout", "order"]),
  channelSlug: z.string(),
  countryCode: z.string(),
  countryArea: z.string().optional(),
  currency: z.string(),
  netTotal: z.number(),
  grossTotal: z.number(),
  taxTotal: z.number(),
  taxRate: z.number(),
  linesCount: z.number(),
  ruleId: z.string().nullable(),
  ruleName: z.string().nullable(),
});
