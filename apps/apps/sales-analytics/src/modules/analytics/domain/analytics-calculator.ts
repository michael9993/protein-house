import { Result, ok, err } from "neverthrow";
import { format, parseISO, startOfDay, startOfWeek, startOfMonth } from "date-fns";

import {
  type OrderAnalyticsFragment,
  OrderStatus,
  OrderGrantedRefundStatusEnum,
  OrderChargeStatusEnum,
} from "../../../../generated/graphql";
import type {
  DashboardKPIs,
  KPITrend,
  TopProduct,
  CategoryData,
  RecentOrder,
  RevenueDataPoint,
  TrendDirection,
  CurrencyInfo,
  OrderTypeFilter,
} from "./kpi-types";
import { formatCurrency, formatCompactNumber } from "./money";
import type { Granularity } from "./time-range";

/**
 * Error types for analytics calculations
 */
export class AnalyticsCalculationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AnalyticsCalculationError";
  }
}

// ─── Status & Refund Helpers ────────────────────────────────────────────────

/**
 * Filter orders by included statuses (client-side).
 * If no filter provided, returns all orders.
 */
export function filterOrdersByStatus(
  orders: OrderAnalyticsFragment[],
  includedStatuses?: OrderStatus[]
): OrderAnalyticsFragment[] {
  if (!includedStatuses || includedStatuses.length === 0) return orders;
  return orders.filter((o) => includedStatuses.includes(o.status));
}

/**
 * Filter orders by charge status (client-side).
 * Uses chargeStatus (OrderChargeStatusEnum) which includes refund statuses
 * (REFUNDED, PARTIALLY_REFUNDED) — matches Dashboard behavior.
 * If no filter provided, returns all orders.
 */
export function filterOrdersByChargeStatus(
  orders: OrderAnalyticsFragment[],
  includedStatuses?: OrderChargeStatusEnum[]
): OrderAnalyticsFragment[] {
  if (!includedStatuses || includedStatuses.length === 0) return orders;
  return orders.filter((o) => includedStatuses.includes(o.chargeStatus));
}

/**
 * Get the total refunded amount for an order.
 * Uses Saleor's `totalRefunded` field (actual money returned to customer via transactions).
 * Falls back to summing successful grantedRefunds if totalRefunded is not available.
 */
export function getOrderRefundAmount(order: OrderAnalyticsFragment): number {
  // Primary: use totalRefunded (reflects actual transaction refunds)
  if (order.totalRefunded && order.totalRefunded.amount > 0) {
    return order.totalRefunded.amount;
  }

  // Fallback: sum successful grantedRefunds
  return (order.grantedRefunds ?? [])
    .filter((r) => r.status === OrderGrantedRefundStatusEnum.Success)
    .reduce((sum, r) => sum + r.amount.amount, 0);
}

/**
 * Whether an order has any refund (partial or full).
 * Checks both totalRefunded and grantedRefunds.
 */
export function hasSuccessfulRefund(order: OrderAnalyticsFragment): boolean {
  if (order.totalRefunded && order.totalRefunded.amount > 0) {
    return true;
  }
  return (order.grantedRefunds ?? []).some(
    (r) => r.status === OrderGrantedRefundStatusEnum.Success
  );
}

// ─── Currency Detection ─────────────────────────────────────────────────────

/**
 * Detect currencies in orders and return currency information
 */
export function detectCurrencies(orders: OrderAnalyticsFragment[]): CurrencyInfo {
  if (orders.length === 0) {
    return {
      currencies: [],
      primaryCurrency: "USD",
      isMultiCurrency: false,
    };
  }

  const currencySet = new Set<string>();
  const currencyCounts = new Map<string, number>();

  for (const order of orders) {
    const currency = order.total.gross.currency;
    currencySet.add(currency);
    currencyCounts.set(currency, (currencyCounts.get(currency) || 0) + 1);
  }

  const currencies = Array.from(currencySet);
  const isMultiCurrency = currencies.length > 1;

  // Find the most common currency as primary
  let primaryCurrency = "USD";
  let maxCount = 0;
  for (const [currency, count] of currencyCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      primaryCurrency = currency;
    }
  }

  return {
    currencies: currencies.sort(),
    primaryCurrency,
    isMultiCurrency,
  };
}

// ─── Order Filtering ────────────────────────────────────────────────────────

/**
 * Filter orders by currency
 */
function filterOrdersByCurrency(
  orders: OrderAnalyticsFragment[],
  currency: string
): OrderAnalyticsFragment[] {
  return orders.filter((order) => order.total.gross.currency === currency);
}

/**
 * Check if an order line is a dropship item.
 * Looks for `dropship.supplier` key in product metadata.
 */
export function isDropshipLine(line: OrderAnalyticsFragment["lines"][number]): boolean {
  const metadata = line.variant?.product?.metadata ?? [];
  return metadata.some((m) => m.key === "dropship.supplier");
}

/**
 * Check if an order contains any dropship line items.
 */
export function isDropshipOrder(order: OrderAnalyticsFragment): boolean {
  return order.lines.some(isDropshipLine);
}

/**
 * Filter orders by order type (all, dropship, non-dropship).
 */
export function filterOrdersByType(
  orders: OrderAnalyticsFragment[],
  orderType: OrderTypeFilter
): OrderAnalyticsFragment[] {
  if (orderType === "all") return orders;
  if (orderType === "dropship") return orders.filter(isDropshipOrder);
  return orders.filter((o) => !isDropshipOrder(o));
}

// ─── Trend Calculation ──────────────────────────────────────────────────────

/**
 * Calculate the trend between two values
 */
function calculateTrend(current: number, previous: number): KPITrend {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "neutral",
    };
  }

  const change = ((current - previous) / previous) * 100;
  let direction: TrendDirection = "neutral";

  if (change > 0.5) {
    direction = "up";
  } else if (change < -0.5) {
    direction = "down";
  }

  return {
    value: Math.abs(change),
    direction,
  };
}

// ─── KPI Helpers ────────────────────────────────────────────────────────────

interface KPIRawValues {
  gmv: number;
  netRevenue: number;
  totalRefunds: number;
  refundRate: number;
  cancellationRate: number;
  totalOrders: number;
  aov: number;
  itemsSold: number;
  uniqueCustomers: number;
}

function computeRawKPIs(orders: OrderAnalyticsFragment[]): KPIRawValues {
  const totalOrders = orders.length;

  const gmv = orders.reduce((sum, o) => sum + o.total.gross.amount, 0);

  const canceledOrders = orders.filter((o) => o.status === OrderStatus.Canceled);
  const nonCanceledOrders = orders.filter((o) => o.status !== OrderStatus.Canceled);

  const canceledTotal = canceledOrders.reduce((sum, o) => sum + o.total.gross.amount, 0);

  // Only count refunds from non-canceled orders to avoid double-subtraction
  // (canceled orders already have their full total removed)
  const totalRefunds = nonCanceledOrders.reduce((sum, o) => sum + getOrderRefundAmount(o), 0);

  const netRevenue = gmv - totalRefunds - canceledTotal;

  // Refund rate: % of non-canceled orders that had refunds (partial or full)
  const ordersWithRefund = nonCanceledOrders.filter(hasSuccessfulRefund).length;
  const nonCanceledCount = nonCanceledOrders.length;
  const refundRate = nonCanceledCount > 0 ? (ordersWithRefund / nonCanceledCount) * 100 : 0;

  const cancellationRate = totalOrders > 0 ? (canceledOrders.length / totalOrders) * 100 : 0;

  // AOV based on net revenue and non-canceled orders
  const aov = nonCanceledCount > 0 ? netRevenue / nonCanceledCount : 0;

  // Items sold excludes canceled orders
  const itemsSold = orders
    .filter((o) => o.status !== OrderStatus.Canceled)
    .reduce((sum, o) => sum + o.lines.reduce((ls, l) => ls + l.quantity, 0), 0);

  // Unique customers from non-canceled orders
  const uniqueCustomers = new Set(
    orders
      .filter((o) => o.status !== OrderStatus.Canceled && o.user)
      .map((o) => o.user!.id)
  ).size;

  return {
    gmv,
    netRevenue,
    totalRefunds,
    refundRate,
    cancellationRate,
    totalOrders,
    aov,
    itemsSold,
    uniqueCustomers,
  };
}

// ─── Main KPIs ──────────────────────────────────────────────────────────────

/**
 * Calculate all KPIs from order data.
 * Orders should already be filtered by status before calling this.
 */
export function calculateKPIs(
  orders: OrderAnalyticsFragment[],
  previousPeriodOrders: OrderAnalyticsFragment[],
  currency: string
): Result<DashboardKPIs, AnalyticsCalculationError> {
  try {
    const filteredOrders = filterOrdersByCurrency(orders, currency);
    const filteredPreviousOrders = filterOrdersByCurrency(previousPeriodOrders, currency);

    const current = computeRawKPIs(filteredOrders);
    const prev = computeRawKPIs(filteredPreviousOrders);

    return ok({
      gmv: {
        label: "Gross Revenue",
        value: formatCurrency(current.gmv, currency),
        trend: calculateTrend(current.gmv, prev.gmv),
        previousValue: formatCurrency(prev.gmv, currency),
      },
      netRevenue: {
        label: "Net Revenue",
        value: formatCurrency(current.netRevenue, currency),
        trend: calculateTrend(current.netRevenue, prev.netRevenue),
        previousValue: formatCurrency(prev.netRevenue, currency),
      },
      totalRefunds: {
        label: "Total Refunds",
        value: formatCurrency(current.totalRefunds, currency),
        trend: calculateTrend(current.totalRefunds, prev.totalRefunds),
        previousValue: formatCurrency(prev.totalRefunds, currency),
      },
      refundRate: {
        label: "Refund Rate",
        value: `${current.refundRate.toFixed(1)}%`,
        trend: calculateTrend(current.refundRate, prev.refundRate),
        previousValue: `${prev.refundRate.toFixed(1)}%`,
      },
      cancellationRate: {
        label: "Cancellation Rate",
        value: `${current.cancellationRate.toFixed(1)}%`,
        trend: calculateTrend(current.cancellationRate, prev.cancellationRate),
        previousValue: `${prev.cancellationRate.toFixed(1)}%`,
      },
      totalOrders: {
        label: "Total Orders",
        value: formatCompactNumber(current.totalOrders),
        trend: calculateTrend(current.totalOrders, prev.totalOrders),
        previousValue: formatCompactNumber(prev.totalOrders),
      },
      averageOrderValue: {
        label: "Avg Order Value",
        value: formatCurrency(current.aov, currency),
        trend: calculateTrend(current.aov, prev.aov),
        previousValue: formatCurrency(prev.aov, currency),
      },
      itemsSold: {
        label: "Items Sold",
        value: formatCompactNumber(current.itemsSold),
        trend: calculateTrend(current.itemsSold, prev.itemsSold),
        previousValue: formatCompactNumber(prev.itemsSold),
      },
      uniqueCustomers: {
        label: "Unique Customers",
        value: formatCompactNumber(current.uniqueCustomers),
        trend: calculateTrend(current.uniqueCustomers, prev.uniqueCustomers),
        previousValue: formatCompactNumber(prev.uniqueCustomers),
      },
    });
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate KPIs", error));
  }
}

// ─── Top Products ───────────────────────────────────────────────────────────

/**
 * Calculate top products by revenue.
 * Excludes canceled orders from rankings.
 */
export function calculateTopProducts(
  orders: OrderAnalyticsFragment[],
  currency: string,
  limit: number = 10
): Result<TopProduct[], AnalyticsCalculationError> {
  try {
    const filteredOrders = filterOrdersByCurrency(orders, currency).filter(
      (o) => o.status !== OrderStatus.Canceled
    );

    const productMap = new Map<
      string,
      { name: string; revenue: number; quantity: number }
    >();

    for (const order of filteredOrders) {
      for (const line of order.lines) {
        const productName = line.productName;
        const existing = productMap.get(productName) || {
          name: productName,
          revenue: 0,
          quantity: 0,
        };

        productMap.set(productName, {
          name: productName,
          revenue: existing.revenue + line.totalPrice.gross.amount,
          quantity: existing.quantity + line.quantity,
        });
      }
    }

    const products = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return ok(products);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate top products", error));
  }
}

// ─── Top Categories ─────────────────────────────────────────────────────────

/**
 * Calculate top categories by revenue.
 * Excludes canceled orders from rankings.
 */
export function calculateTopCategories(
  orders: OrderAnalyticsFragment[],
  currency: string,
  limit: number = 10
): Result<CategoryData[], AnalyticsCalculationError> {
  try {
    const filteredOrders = filterOrdersByCurrency(orders, currency).filter(
      (o) => o.status !== OrderStatus.Canceled
    );

    const categoryMap = new Map<string, number>();

    for (const order of filteredOrders) {
      for (const line of order.lines) {
        const categoryName = line.variant?.product?.category?.name || "Uncategorized";
        const existing = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, existing + line.totalPrice.gross.amount);
      }
    }

    const categories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    return ok(categories);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate top categories", error));
  }
}

// ─── Revenue Over Time ──────────────────────────────────────────────────────

/**
 * Calculate revenue over time for charts.
 * Includes GMV, net revenue, and refunds per time bucket.
 */
export function calculateRevenueOverTime(
  orders: OrderAnalyticsFragment[],
  currency: string,
  granularity: Granularity
): Result<RevenueDataPoint[], AnalyticsCalculationError> {
  try {
    const filteredOrders = filterOrdersByCurrency(orders, currency);

    const dataMap = new Map<
      string,
      { revenue: number; netRevenue: number; refunds: number; orders: number }
    >();

    for (const order of filteredOrders) {
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

      const isCanceled = order.status === OrderStatus.Canceled;
      const orderGross = order.total.gross.amount;
      // Only count refunds from non-canceled orders (canceled orders are fully excluded)
      const refundAmount = isCanceled ? 0 : getOrderRefundAmount(order);

      const existing = dataMap.get(dateKey) || {
        revenue: 0,
        netRevenue: 0,
        refunds: 0,
        orders: 0,
      };

      dataMap.set(dateKey, {
        revenue: existing.revenue + orderGross,
        netRevenue:
          existing.netRevenue + (isCanceled ? 0 : orderGross - refundAmount),
        refunds: existing.refunds + refundAmount,
        orders: existing.orders + 1,
      });
    }

    const sortedData = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        netRevenue: data.netRevenue,
        refunds: data.refunds,
        orders: data.orders,
      }));

    return ok(sortedData);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate revenue over time", error));
  }
}

// ─── Product Performance ────────────────────────────────────────────────────

/**
 * Product performance data with daily revenue for sparkline
 */
export interface ProductPerformance {
  name: string;
  revenue: number;
  quantity: number;
  percentOfTotal: number;
  dailyRevenue: number[];
}

/**
 * Calculate product performance with daily revenue series for sparklines.
 * Excludes canceled orders.
 */
export function calculateProductPerformance(
  orders: OrderAnalyticsFragment[],
  currency: string
): Result<ProductPerformance[], AnalyticsCalculationError> {
  try {
    const filteredOrders = filterOrdersByCurrency(orders, currency).filter(
      (o) => o.status !== OrderStatus.Canceled
    );

    const productMap = new Map<
      string,
      { name: string; revenue: number; quantity: number; dailyMap: Map<string, number> }
    >();

    for (const order of filteredOrders) {
      const dateKey = format(startOfDay(parseISO(order.created)), "yyyy-MM-dd");
      for (const line of order.lines) {
        const productName = line.productName;
        const existing = productMap.get(productName) || {
          name: productName,
          revenue: 0,
          quantity: 0,
          dailyMap: new Map<string, number>(),
        };

        existing.revenue += line.totalPrice.gross.amount;
        existing.quantity += line.quantity;
        existing.dailyMap.set(dateKey, (existing.dailyMap.get(dateKey) || 0) + line.totalPrice.gross.amount);
        productMap.set(productName, existing);
      }
    }

    const totalRevenue = Array.from(productMap.values()).reduce((sum, p) => sum + p.revenue, 0);

    // Get all unique dates sorted
    const allDates = new Set<string>();
    for (const product of productMap.values()) {
      for (const date of product.dailyMap.keys()) {
        allDates.add(date);
      }
    }
    const sortedDates = Array.from(allDates).sort();

    const products: ProductPerformance[] = Array.from(productMap.values())
      .map((p) => ({
        name: p.name,
        revenue: p.revenue,
        quantity: p.quantity,
        percentOfTotal: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
        dailyRevenue: sortedDates.map((date) => p.dailyMap.get(date) || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return ok(products);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate product performance", error));
  }
}

// ─── Recent Orders ──────────────────────────────────────────────────────────

/**
 * Format orders for the recent orders table.
 * Includes charge status and refund amount for each order.
 */
export function formatRecentOrders(
  orders: OrderAnalyticsFragment[],
  limit: number = 10
): Result<RecentOrder[], AnalyticsCalculationError> {
  try {
    const recentOrders = orders.slice(0, limit).map((order) => ({
      id: order.id,
      number: order.number || order.id.slice(-8),
      date: order.created,
      customer: order.user?.email || "Guest",
      total: {
        amount: order.total.gross.amount,
        currency: order.total.gross.currency,
      },
      status: order.status,
      chargeStatus: order.chargeStatus,
      refundAmount: getOrderRefundAmount(order),
    }));

    return ok(recentOrders);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to format recent orders", error));
  }
}
