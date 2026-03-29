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
  channelSlug: string | undefined,
  orderCurrency: string
): number | null {
  const listings = line.variant?.channelListings ?? [];

  // 1. Try Saleor native costPrice from matching channel listing
  if (channelSlug) {
    const channelListing = listings.find((l) => l.channel.slug === channelSlug);
    if (channelListing?.costPrice) {
      return channelListing.costPrice.amount;
    }
  }

  // 2. Fallback: first listing with costPrice IN THE SAME CURRENCY
  // Without currency check, ILS costs get treated as USD (e.g., ₪67 → $67)
  const sameCurrencyListing = listings.find(
    (l) => l.costPrice && l.costPrice.currency === orderCurrency
  );
  if (sameCurrencyListing?.costPrice) {
    return sameCurrencyListing.costPrice.amount;
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

/** PayPal fee structure: percentage + fixed fee per transaction */
const PAYPAL_FEE_PERCENT = 0.034; // 3.40%
const PAYPAL_FEE_FIXED = 0.30; // $0.30 per transaction

/**
 * Get a metadata value from order metadata (public first, then private).
 * Shipping data (shipping.*, dropship.*) is in public metadata.
 * Product cost data (dropship.costPrice) is in private metadata.
 */
function getOrderMeta(order: OrderAnalyticsFragment, key: string): string | null {
  // Check public metadata first (where shipping/checkout data lives)
  const pubMeta = order.metadata?.find((m) => m.key === key);
  if (pubMeta?.value) return pubMeta.value;
  // Fallback to private metadata
  const privMeta = order.privateMetadata?.find((m) => m.key === key);
  return privMeta?.value ?? null;
}

/**
 * Calculate the actual CJ shipping cost for an order from metadata.
 * Returns the real supplier cost, or null if no dropship metadata.
 */
function getActualShippingCost(order: OrderAnalyticsFragment): number | null {
  const methodName = getOrderMeta(order, "shipping.methodName");
  const originalPricesRaw = getOrderMeta(order, "dropship.shippingOriginalPrices");

  if (methodName && originalPricesRaw) {
    try {
      const prices = JSON.parse(originalPricesRaw) as Record<string, number>;
      if (prices[methodName] !== undefined) {
        return prices[methodName];
      }
    } catch { /* ignore parse errors */ }
  }

  // Fallback: try shipping.originalCost
  const originalCost = getOrderMeta(order, "shipping.originalCost");
  if (originalCost) {
    const parsed = parseFloat(originalCost);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
}

/**
 * Estimate PayPal transaction fee for an order.
 * PayPal charges ~3.49% + $0.49 per transaction.
 */
function estimatePayPalFee(orderTotal: number): number {
  if (orderTotal <= 0) return 0;
  return orderTotal * PAYPAL_FEE_PERCENT + PAYPAL_FEE_FIXED;
}

/**
 * Calculate profitability P&L from orders.
 * Excludes canceled orders from all calculations.
 * Subtracts refunds, shipping subsidy, and payment fees from profit.
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
    let shippingCost = 0;
    let cogs = 0;
    let discountsTotal = 0;
    let refundsTotal = 0;
    let shippingSubsidy = 0;
    let paymentFees = 0;
    let linesWithCost = 0;
    let linesTotal = 0;

    for (const order of filtered) {
      grossRevenue += order.total.gross.amount;
      const customerPaidShipping = order.shippingPrice?.gross?.amount ?? 0;
      shippingRevenue += customerPaidShipping;
      refundsTotal += getOrderRefundAmount(order);

      // Actual CJ shipping cost vs what customer paid
      const actualCost = getActualShippingCost(order);
      if (actualCost !== null) {
        shippingCost += actualCost;
        const subsidy = actualCost - customerPaidShipping;
        if (subsidy > 0) shippingSubsidy += subsidy;
      } else {
        shippingCost += customerPaidShipping; // fallback: assume cost = customer paid
      }

      // Payment processing fees (estimated)
      paymentFees += estimatePayPalFee(order.total.gross.amount);

      for (const discount of order.discounts ?? []) {
        discountsTotal += discount.amount.amount;
      }

      for (const line of order.lines) {
        linesTotal += 1;
        const unitCost = resolveLineCost(line, channelSlug, currency);
        if (unitCost !== null) {
          cogs += unitCost * line.quantity;
          linesWithCost += 1;
        }
      }
    }

    // Net Revenue = what was actually collected (gross minus refunds and shipping)
    const netRevenue = grossRevenue - refundsTotal - shippingRevenue;
    // Gross Profit = net revenue minus all costs
    const grossProfit = netRevenue - cogs - discountsTotal - shippingSubsidy - paymentFees;
    // Margin based on net revenue (what was actually collected)
    const marginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    return ok({
      grossRevenue,
      shippingRevenue,
      shippingCost,
      cogs,
      cogsAvailable: linesWithCost > 0,
      discounts: discountsTotal,
      refunds: refundsTotal,
      shippingSubsidy,
      paymentFees,
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

    const dataMap = new Map<string, { revenue: number; shipping: number; cogs: number; refunds: number }>();

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

      const existing = dataMap.get(dateKey) || { revenue: 0, shipping: 0, cogs: 0, refunds: 0 };
      existing.revenue += order.total.gross.amount;
      existing.shipping += order.shippingPrice?.gross?.amount ?? 0;
      existing.refunds += getOrderRefundAmount(order);

      for (const line of order.lines) {
        const unitCost = resolveLineCost(line, channelSlug, currency);
        if (unitCost !== null) {
          existing.cogs += unitCost * line.quantity;
        }
      }

      dataMap.set(dateKey, existing);
    }

    const result = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const netRev = data.revenue - data.refunds - data.shipping;
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
