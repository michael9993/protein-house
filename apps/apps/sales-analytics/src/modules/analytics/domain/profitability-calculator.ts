import { Result, ok, err } from "neverthrow";
import { format, parseISO, startOfDay, startOfWeek, startOfMonth } from "date-fns";

import { type OrderAnalyticsFragment, OrderStatus } from "../../../../generated/graphql";
import { AnalyticsCalculationError, getOrderRefundAmount } from "./analytics-calculator";
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
 * Excludes canceled orders from all calculations.
 * Subtracts refunds from net revenue.
 */
export function calculateProfitability(
  orders: OrderAnalyticsFragment[],
  currency: string,
  channelSlug?: string
): Result<ProfitabilityData, AnalyticsCalculationError> {
  try {
    // Filter by currency and exclude canceled orders from P&L
    const filtered = orders
      .filter((o) => o.total.gross.currency === currency)
      .filter((o) => o.status !== OrderStatus.Canceled);

    let grossRevenue = 0;
    let shippingRevenue = 0;
    let cogs = 0;
    let discountsTotal = 0;
    let refundsTotal = 0;
    let linesWithCost = 0;
    let linesTotal = 0;

    for (const order of filtered) {
      grossRevenue += order.total.gross.amount;
      shippingRevenue += order.shippingPrice?.gross?.amount ?? 0;
      refundsTotal += getOrderRefundAmount(order);

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

    // Net Revenue = what was actually collected (gross minus refunds)
    const netRevenue = grossRevenue - refundsTotal;
    // Gross Profit = net revenue minus costs and discounts
    const grossProfit = netRevenue - cogs - discountsTotal;
    // Margin based on net revenue (what was actually collected)
    const marginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    return ok({
      grossRevenue,
      shippingRevenue,
      cogs,
      cogsAvailable: linesWithCost > 0,
      discounts: discountsTotal,
      refunds: refundsTotal,
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
 * Excludes canceled orders. Includes refunds per time bucket.
 */
export function calculateProfitabilityOverTime(
  orders: OrderAnalyticsFragment[],
  currency: string,
  granularity: Granularity,
  channelSlug?: string
): Result<ProfitabilityDataPoint[], AnalyticsCalculationError> {
  try {
    const filtered = orders
      .filter((o) => o.total.gross.currency === currency)
      .filter((o) => o.status !== OrderStatus.Canceled);

    const dataMap = new Map<string, { revenue: number; cogs: number; refunds: number }>();

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

      const existing = dataMap.get(dateKey) || { revenue: 0, cogs: 0, refunds: 0 };
      existing.revenue += order.total.gross.amount;
      existing.refunds += getOrderRefundAmount(order);

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
      .map(([date, data]) => {
        const netRev = data.revenue - data.refunds;
        return {
          date,
          revenue: netRev,
          cogs: data.cogs,
          refunds: data.refunds,
          profit: netRev - data.cogs,
        };
      });

    return ok(result);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate profitability over time", error));
  }
}
