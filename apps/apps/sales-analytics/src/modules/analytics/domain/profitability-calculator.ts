import { Result, ok, err } from "neverthrow";
import { format, parseISO, startOfDay, startOfWeek, startOfMonth } from "date-fns";

import type { OrderAnalyticsFragment } from "../../../../generated/graphql";
import { AnalyticsCalculationError } from "./analytics-calculator";
import type { ProfitabilityData, ProfitabilityDataPoint } from "./kpi-types";
import type { Granularity } from "./time-range";

/**
 * Resolve cost price for a single order line.
 * Priority: 1) variant.channelListings costPrice (matching channel)
 *           2) any channelListing with costPrice
 *           3) product privateMetadata dropship.costPrice
 *           4) product public metadata dropship.costPrice
 *           5) null (no cost data)
 */
function resolveLineCost(
  line: OrderAnalyticsFragment["lines"][number],
  channelSlug: string | undefined
): number | null {
  const listings = line.variant?.channelListings ?? [];

  // 1. Try Saleor native costPrice from matching channel listing
  if (channelSlug) {
    const channelListing = listings.find((l) => l.channel.slug === channelSlug);
    if (channelListing?.costPrice) {
      return channelListing.costPrice.amount;
    }
  }

  // 2. Fallback: first listing with a costPrice
  const anyListing = listings.find((l) => l.costPrice);
  if (anyListing?.costPrice) {
    return anyListing.costPrice.amount;
  }

  // 3. Try dropship.costPrice from product privateMetadata
  const privateMeta = line.variant?.product?.privateMetadata ?? [];
  const costMeta = privateMeta.find((m) => m.key === "dropship.costPrice");
  if (costMeta?.value) {
    const parsed = parseFloat(costMeta.value);
    if (!isNaN(parsed)) return parsed;
  }

  // 4. Also check public metadata (CSV import puts it there)
  const publicMeta = line.variant?.product?.metadata ?? [];
  const publicCostMeta = publicMeta.find((m) => m.key === "dropship.costPrice");
  if (publicCostMeta?.value) {
    const parsed = parseFloat(publicCostMeta.value);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
}

/**
 * Calculate profitability P&L from orders.
 */
export function calculateProfitability(
  orders: OrderAnalyticsFragment[],
  currency: string,
  channelSlug?: string
): Result<ProfitabilityData, AnalyticsCalculationError> {
  try {
    const filtered = orders.filter((o) => o.total.gross.currency === currency);

    let grossRevenue = 0;
    let shippingRevenue = 0;
    let cogs = 0;
    let discountsTotal = 0;
    let linesWithCost = 0;
    let linesTotal = 0;

    for (const order of filtered) {
      grossRevenue += order.total.gross.amount;
      shippingRevenue += order.shippingPrice?.gross?.amount ?? 0;

      for (const discount of order.discounts ?? []) {
        discountsTotal += discount.amount.amount;
      }

      for (const line of order.lines) {
        linesTotal += 1;
        const unitCost = resolveLineCost(line, channelSlug);
        if (unitCost !== null) {
          cogs += unitCost * line.quantity;
          linesWithCost += 1;
        }
      }
    }

    const grossProfit = grossRevenue - cogs;
    const netRevenue = grossRevenue - cogs - discountsTotal;
    const marginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    return ok({
      grossRevenue,
      shippingRevenue,
      cogs,
      cogsAvailable: linesWithCost > 0,
      discounts: discountsTotal,
      grossProfit,
      netRevenue,
      marginPercent,
      orderCount: filtered.length,
      linesWithCost,
      linesTotal,
    });
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate profitability", error));
  }
}

/**
 * Calculate profitability over time for charts.
 */
export function calculateProfitabilityOverTime(
  orders: OrderAnalyticsFragment[],
  currency: string,
  granularity: Granularity,
  channelSlug?: string
): Result<ProfitabilityDataPoint[], AnalyticsCalculationError> {
  try {
    const filtered = orders.filter((o) => o.total.gross.currency === currency);

    const dataMap = new Map<string, { revenue: number; cogs: number }>();

    for (const order of filtered) {
      const orderDate = parseISO(order.created);
      let dateKey: string;

      switch (granularity) {
        case "day":
          dateKey = format(startOfDay(orderDate), "yyyy-MM-dd");
          break;
        case "week":
          dateKey = format(startOfWeek(orderDate), "yyyy-MM-dd");
          break;
        case "month":
          dateKey = format(startOfMonth(orderDate), "yyyy-MM");
          break;
      }

      const existing = dataMap.get(dateKey) || { revenue: 0, cogs: 0 };
      existing.revenue += order.total.gross.amount;

      for (const line of order.lines) {
        const unitCost = resolveLineCost(line, channelSlug);
        if (unitCost !== null) {
          existing.cogs += unitCost * line.quantity;
        }
      }

      dataMap.set(dateKey, existing);
    }

    const result = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cogs: data.cogs,
        profit: data.revenue - data.cogs,
      }));

    return ok(result);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate profitability over time", error));
  }
}
