import { z } from "zod";

import { createLogger } from "@/logger";

const logger = createLogger("pricing:cost-ceiling");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const CostCeilingResultSchema = z.object({
  /** True when the supplier cost is within the ceiling. */
  passed: z.boolean(),
  /** The actual supplier cost as a percentage of the sell price. */
  actualPercent: z.number(),
  /** The maximum allowed percentage (the ceiling). */
  maxPercent: z.number(),
});

export type CostCeilingResult = z.infer<typeof CostCeilingResultSchema>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

/**
 * Default ceiling: supplier cost must be at most 70% of the sell price.
 * This leaves a minimum 30% gross margin before shipping.
 */
export const DEFAULT_COST_CEILING_PERCENT = 70;

// ---------------------------------------------------------------------------
// Cost Ceiling Check
// ---------------------------------------------------------------------------

/**
 * Verify that the supplier cost does not exceed a configurable percentage
 * of the customer sell price.
 *
 * Example: If the sell price is $100 and the ceiling is 70%, the supplier
 * cost must be <= $70 for the check to pass.
 *
 * @param supplierCost   - Cost charged by the supplier
 * @param sellPrice      - Price the customer pays
 * @param ceilingPercent - Maximum allowed cost as % of sell price (default 70)
 */
export function checkCostCeiling(
  supplierCost: number,
  sellPrice: number,
  ceilingPercent: number = DEFAULT_COST_CEILING_PERCENT,
): CostCeilingResult {
  // Edge case: if sell price is 0 or negative, cost ceiling always fails
  // (we cannot sell something for free and still cover costs).
  if (sellPrice <= 0) {
    logger.warn("Cost ceiling check: sell price is zero or negative", {
      supplierCost,
      sellPrice,
      ceilingPercent,
    });

    return {
      passed: false,
      actualPercent: supplierCost > 0 ? Infinity : 0,
      maxPercent: ceilingPercent,
    };
  }

  const actualPercent = (supplierCost / sellPrice) * 100;
  const maxAllowedCost = sellPrice * (ceilingPercent / 100);
  const passed = supplierCost <= maxAllowedCost;

  logger.info("Cost ceiling check", {
    supplierCost,
    sellPrice,
    ceilingPercent,
    actualPercent: actualPercent.toFixed(2),
    maxAllowedCost,
    passed,
  });

  return {
    passed,
    actualPercent,
    maxPercent: ceilingPercent,
  };
}
