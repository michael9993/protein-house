import { z } from "zod";

import { createLogger } from "@/logger";

const logger = createLogger("pricing:price-drift-detector");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const PriceDriftDirectionSchema = z.enum(["up", "down", "none"]);

export type PriceDriftDirection = z.infer<typeof PriceDriftDirectionSchema>;

export const PriceDriftResultSchema = z.object({
  /** True when the price has drifted beyond the threshold. */
  drifted: z.boolean(),
  /** Signed percentage change: positive = price went up, negative = price went down. */
  driftPercent: z.number(),
  /** Direction of the drift. */
  direction: PriceDriftDirectionSchema,
  /** The configured threshold percentage. */
  threshold: z.number(),
});

export type PriceDriftResult = z.infer<typeof PriceDriftResultSchema>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

/**
 * Default drift threshold: flag if the supplier price changed by more than
 * 15% from what was listed at product sync time.
 */
export const DEFAULT_DRIFT_THRESHOLD_PERCENT = 15;

// ---------------------------------------------------------------------------
// Price Drift Check
// ---------------------------------------------------------------------------

/**
 * Detect if a supplier's current price has drifted significantly from the
 * price recorded when the product was last synced/listed.
 *
 * A positive drift means the supplier raised their price (our margin shrinks).
 * A negative drift means the supplier lowered their price (our margin grows,
 * but the listed price on our storefront may be too high).
 *
 * @param currentPrice    - The supplier's current price (fetched now)
 * @param listedPrice     - The price we have on file from the last sync
 * @param thresholdPercent - Maximum acceptable drift (default 15%)
 */
export function checkPriceDrift(
  currentPrice: number,
  listedPrice: number,
  thresholdPercent: number = DEFAULT_DRIFT_THRESHOLD_PERCENT,
): PriceDriftResult {
  // Edge case: listed price is zero — we cannot compute a percentage.
  if (listedPrice <= 0) {
    logger.warn("Price drift check: listed price is zero or negative", {
      currentPrice,
      listedPrice,
      thresholdPercent,
    });

    const drifted = currentPrice > 0;

    return {
      drifted,
      driftPercent: drifted ? Infinity : 0,
      direction: drifted ? "up" : "none",
      threshold: thresholdPercent,
    };
  }

  const driftPercent = ((currentPrice - listedPrice) / listedPrice) * 100;

  let direction: PriceDriftDirection;

  if (driftPercent > 0) {
    direction = "up";
  } else if (driftPercent < 0) {
    direction = "down";
  } else {
    direction = "none";
  }

  const absDrift = Math.abs(driftPercent);
  const drifted = absDrift > thresholdPercent;

  logger.info("Price drift check", {
    currentPrice,
    listedPrice,
    driftPercent: driftPercent.toFixed(2),
    direction,
    thresholdPercent,
    drifted,
  });

  return {
    drifted,
    driftPercent,
    direction,
    threshold: thresholdPercent,
  };
}
