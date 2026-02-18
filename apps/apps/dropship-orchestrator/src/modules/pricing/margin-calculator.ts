import { z } from "zod";

import { createLogger } from "@/logger";

const logger = createLogger("pricing:margin-calculator");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const MarginResultSchema = z.object({
  /** Absolute margin: sellPrice - supplierCost - shippingCost */
  margin: z.number(),
  /** Margin as a percentage of sell price (0-100 range, can be negative) */
  marginPercent: z.number(),
  /** True when margin > 0 */
  profitable: z.boolean(),
});

export type MarginResult = z.infer<typeof MarginResultSchema>;

export const OrderLineWithCostSchema = z.object({
  lineId: z.string().min(1),
  sellPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  supplierCost: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
});

export type OrderLineWithCost = z.infer<typeof OrderLineWithCostSchema>;

export const OrderMarginResultSchema = z.object({
  /** Total revenue from the order (sum of sellPrice * quantity). */
  totalRevenue: z.number(),
  /** Total supplier cost (sum of supplierCost * quantity). */
  totalCost: z.number(),
  /** Total shipping cost across all lines. */
  totalShipping: z.number(),
  /** Net margin: totalRevenue - totalCost - totalShipping. */
  totalMargin: z.number(),
  /** Margin as percentage of totalRevenue. 0 if totalRevenue is 0. */
  marginPercent: z.number(),
  /** Line IDs that are individually unprofitable. */
  unprofitableLines: z.array(z.string()),
});

export type OrderMarginResult = z.infer<typeof OrderMarginResultSchema>;

// ---------------------------------------------------------------------------
// Single-line margin
// ---------------------------------------------------------------------------

/**
 * Calculate the margin for a single product/line.
 *
 * @param sellPrice     - The price the customer pays
 * @param supplierCost  - The cost from the supplier
 * @param shippingCost  - The shipping cost to deliver the item
 */
export function calculateMargin(
  sellPrice: number,
  supplierCost: number,
  shippingCost: number,
): MarginResult {
  const margin = sellPrice - supplierCost - shippingCost;
  const marginPercent = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
  const profitable = margin > 0;

  logger.debug("Margin calculated", {
    sellPrice,
    supplierCost,
    shippingCost,
    margin,
    marginPercent: marginPercent.toFixed(2),
    profitable,
  });

  return { margin, marginPercent, profitable };
}

// ---------------------------------------------------------------------------
// Full-order margin
// ---------------------------------------------------------------------------

/**
 * Calculate the aggregate margin for an entire order, and identify any
 * individual lines that are unprofitable.
 */
export function calculateOrderMargin(orderLines: OrderLineWithCost[]): OrderMarginResult {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalShipping = 0;
  const unprofitableLines: string[] = [];

  for (const line of orderLines) {
    const lineRevenue = line.sellPrice * line.quantity;
    const lineCost = line.supplierCost * line.quantity;
    const lineShipping = line.shippingCost;

    totalRevenue += lineRevenue;
    totalCost += lineCost;
    totalShipping += lineShipping;

    const lineMargin = lineRevenue - lineCost - lineShipping;

    if (lineMargin <= 0) {
      unprofitableLines.push(line.lineId);
    }
  }

  const totalMargin = totalRevenue - totalCost - totalShipping;
  const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  logger.info("Order margin calculated", {
    totalRevenue,
    totalCost,
    totalShipping,
    totalMargin,
    marginPercent: marginPercent.toFixed(2),
    unprofitableLineCount: unprofitableLines.length,
    lineCount: orderLines.length,
  });

  return {
    totalRevenue,
    totalCost,
    totalShipping,
    totalMargin,
    marginPercent,
    unprofitableLines,
  };
}
