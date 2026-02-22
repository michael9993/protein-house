import { z } from "zod";
import { createLogger } from "@/logger";

const logger = createLogger("pricing:currency");

// ---------------------------------------------------------------------------
// Schema & Types
// ---------------------------------------------------------------------------

export const ExchangeRateSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  rate: z.number().positive(),
  updatedAt: z.string(), // ISO 8601
});

export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

export const ExchangeRatesConfigSchema = z.object({
  rates: z.array(ExchangeRateSchema).default([]),
});

export type ExchangeRatesConfig = z.infer<typeof ExchangeRatesConfigSchema>;

// ---------------------------------------------------------------------------
// Default rates
// ---------------------------------------------------------------------------

export const DEFAULT_RATES: ExchangeRate[] = [
  { from: "USD", to: "ILS", rate: 3.65, updatedAt: new Date().toISOString() },
  { from: "USD", to: "EUR", rate: 0.92, updatedAt: new Date().toISOString() },
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Convert an amount from one currency to another.
 * Returns null if no rate is found.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRate[],
): number | null {
  if (from === to) return amount;

  // Direct rate
  const direct = rates.find((r) => r.from === from && r.to === to);
  if (direct) return amount * direct.rate;

  // Inverse rate
  const inverse = rates.find((r) => r.from === to && r.to === from);
  if (inverse) return amount / inverse.rate;

  logger.warn("No exchange rate found", { from, to });
  return null;
}

/**
 * Check if an exchange rate is stale (older than threshold days).
 */
export function isRateStale(rate: ExchangeRate, thresholdDays = 7): boolean {
  const updatedMs = new Date(rate.updatedAt).getTime();
  const ageMs = Date.now() - updatedMs;
  return ageMs > thresholdDays * 24 * 60 * 60 * 1000;
}

/**
 * Get the age of a rate in days.
 */
export function rateDaysAge(rate: ExchangeRate): number {
  const ageMs = Date.now() - new Date(rate.updatedAt).getTime();
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

/**
 * Apply pricing with currency conversion for multi-channel.
 * Returns price in target currency.
 */
export function convertPrice(
  costPriceUSD: number,
  markupMultiplier: number,
  targetCurrency: string,
  rates: ExchangeRate[],
): { price: number; costPrice: number } | null {
  const retailUSD = costPriceUSD * markupMultiplier;

  if (targetCurrency === "USD") {
    return { price: retailUSD, costPrice: costPriceUSD };
  }

  const convertedPrice = convertCurrency(retailUSD, "USD", targetCurrency, rates);
  const convertedCost = convertCurrency(costPriceUSD, "USD", targetCurrency, rates);

  if (convertedPrice == null || convertedCost == null) return null;

  return { price: convertedPrice, costPrice: convertedCost };
}
