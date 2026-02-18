import { z } from "zod";

import { createLogger } from "@/logger";

const logger = createLogger("pricing:daily-spend-tracker");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const SpendEntrySchema = z.object({
  /** ISO 8601 date string (YYYY-MM-DD). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  /** Amount spent in the base currency. */
  amount: z.number().nonnegative(),
  /** The Saleor order ID. */
  orderId: z.string().min(1),
  /** The supplier that fulfilled this order. */
  supplierId: z.string().min(1),
});

export type SpendEntry = z.infer<typeof SpendEntrySchema>;

export const DailyLimitResultSchema = z.object({
  /** True when the projected spend (current + this order) is within the limit. */
  passed: z.boolean(),
  /** Total spend so far today, before this order. */
  currentSpend: z.number(),
  /** Projected spend if this order is approved: currentSpend + orderCost. */
  projectedSpend: z.number(),
  /** The configured daily spend limit. */
  limit: z.number(),
});

export type DailyLimitResult = z.infer<typeof DailyLimitResultSchema>;

// ---------------------------------------------------------------------------
// Retention policy
// ---------------------------------------------------------------------------

/** Spend entries older than this many days are cleaned up. */
const RETENTION_DAYS = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Sum all spend entries for a given date.
 */
export function getDailySpend(date: string, spendLog: SpendEntry[]): number {
  const total = spendLog
    .filter((entry) => entry.date === date)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return total;
}

/**
 * Add a new spend entry to the log and clean up entries older than the
 * retention window (30 days by default).
 *
 * Returns a new array — the original is not mutated.
 */
export function addSpendEntry(
  entry: SpendEntry,
  spendLog: SpendEntry[],
  now: Date = new Date(),
): SpendEntry[] {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const cutoffDate = formatDate(cutoff);

  // Filter out expired entries and append the new one
  const cleaned = spendLog.filter((e) => e.date >= cutoffDate);
  const updated = [...cleaned, entry];

  const removedCount = spendLog.length - cleaned.length;

  if (removedCount > 0) {
    logger.info("Cleaned up expired spend entries", {
      removedCount,
      cutoffDate,
      remainingCount: updated.length,
    });
  }

  logger.debug("Spend entry added", {
    date: entry.date,
    amount: entry.amount,
    orderId: entry.orderId,
    supplierId: entry.supplierId,
    totalEntries: updated.length,
  });

  return updated;
}

/**
 * Check whether a new order would exceed the daily spend limit.
 *
 * @param currentSpend - Total already spent today (from {@link getDailySpend})
 * @param orderCost    - The cost of the order being evaluated
 * @param limit        - The configured daily spend limit
 */
export function checkDailyLimit(
  currentSpend: number,
  orderCost: number,
  limit: number,
): DailyLimitResult {
  const projectedSpend = currentSpend + orderCost;
  const passed = projectedSpend <= limit;

  logger.info("Daily spend limit check", {
    currentSpend,
    orderCost,
    projectedSpend,
    limit,
    passed,
  });

  return {
    passed,
    currentSpend,
    projectedSpend,
    limit,
  };
}
