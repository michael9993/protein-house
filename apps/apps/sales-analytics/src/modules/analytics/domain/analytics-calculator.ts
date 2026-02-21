import { Result, ok, err } from "neverthrow";
import { format, parseISO, startOfDay, startOfWeek, startOfMonth } from "date-fns";

import type { OrderAnalyticsFragment } from "../../../../generated/graphql";
import type {
  DashboardKPIs,
  KPITrend,
  TopProduct,
  CategoryData,
  RecentOrder,
  RevenueDataPoint,
  TrendDirection,
  CurrencyInfo,
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

/**
 * Calculate all KPIs from order data
 * Only includes orders in the specified currency to avoid mixing currencies
 */
export function calculateKPIs(
  orders: OrderAnalyticsFragment[],
  previousPeriodOrders: OrderAnalyticsFragment[],
  currency: string
): Result<DashboardKPIs, AnalyticsCalculationError> {
  try {
    // Filter orders to only include those in the specified currency
    const filteredOrders = filterOrdersByCurrency(orders, currency);
    const filteredPreviousOrders = filterOrdersByCurrency(previousPeriodOrders, currency);

    // Current period calculations (only for the specified currency)
    const gmv = filteredOrders.reduce((sum, o) => sum + o.total.gross.amount, 0);
    const totalOrders = filteredOrders.length;
    const aov = totalOrders > 0 ? gmv / totalOrders : 0;
    const itemsSold = filteredOrders.reduce(
      (sum, o) => sum + o.lines.reduce((lineSum, l) => lineSum + l.quantity, 0),
      0
    );
    const uniqueCustomers = new Set(
      filteredOrders.filter((o) => o.user).map((o) => o.user!.id)
    ).size;

    // Previous period calculations (only for the specified currency)
    const prevGmv = filteredPreviousOrders.reduce((sum, o) => sum + o.total.gross.amount, 0);
    const prevTotalOrders = filteredPreviousOrders.length;
    const prevAov = prevTotalOrders > 0 ? prevGmv / prevTotalOrders : 0;
    const prevItemsSold = filteredPreviousOrders.reduce(
      (sum, o) => sum + o.lines.reduce((lineSum, l) => lineSum + l.quantity, 0),
      0
    );
    const prevUniqueCustomers = new Set(
      filteredPreviousOrders.filter((o) => o.user).map((o) => o.user!.id)
    ).size;

    return ok({
      gmv: {
        label: "Gross Revenue",
        value: formatCurrency(gmv, currency),
        trend: calculateTrend(gmv, prevGmv),
        previousValue: formatCurrency(prevGmv, currency),
      },
      totalOrders: {
        label: "Total Orders",
        value: formatCompactNumber(totalOrders),
        trend: calculateTrend(totalOrders, prevTotalOrders),
        previousValue: formatCompactNumber(prevTotalOrders),
      },
      averageOrderValue: {
        label: "Avg Order Value",
        value: formatCurrency(aov, currency),
        trend: calculateTrend(aov, prevAov),
        previousValue: formatCurrency(prevAov, currency),
      },
      itemsSold: {
        label: "Items Sold",
        value: formatCompactNumber(itemsSold),
        trend: calculateTrend(itemsSold, prevItemsSold),
        previousValue: formatCompactNumber(prevItemsSold),
      },
      uniqueCustomers: {
        label: "Unique Customers",
        value: formatCompactNumber(uniqueCustomers),
        trend: calculateTrend(uniqueCustomers, prevUniqueCustomers),
        previousValue: formatCompactNumber(prevUniqueCustomers),
      },
    });
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate KPIs", error));
  }
}

/**
 * Calculate top products by revenue
 * Only includes orders in the specified currency
 */
export function calculateTopProducts(
  orders: OrderAnalyticsFragment[],
  currency: string,
  limit: number = 10
): Result<TopProduct[], AnalyticsCalculationError> {
  try {
    // Filter orders to only include those in the specified currency
    const filteredOrders = filterOrdersByCurrency(orders, currency);

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

/**
 * Calculate top categories by revenue
 * Only includes orders in the specified currency
 */
export function calculateTopCategories(
  orders: OrderAnalyticsFragment[],
  currency: string,
  limit: number = 10
): Result<CategoryData[], AnalyticsCalculationError> {
  try {
    // Filter orders to only include those in the specified currency
    const filteredOrders = filterOrdersByCurrency(orders, currency);

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

/**
 * Calculate revenue over time for charts
 * Only includes orders in the specified currency
 */
export function calculateRevenueOverTime(
  orders: OrderAnalyticsFragment[],
  currency: string,
  granularity: Granularity
): Result<RevenueDataPoint[], AnalyticsCalculationError> {
  try {
    // Filter orders to only include those in the specified currency
    const filteredOrders = filterOrdersByCurrency(orders, currency);

    const dataMap = new Map<string, { revenue: number; orders: number }>();

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

      const existing = dataMap.get(dateKey) || { revenue: 0, orders: 0 };
      dataMap.set(dateKey, {
        revenue: existing.revenue + order.total.gross.amount,
        orders: existing.orders + 1,
      });
    }

    // Sort by date
    const sortedData = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));

    return ok(sortedData);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate revenue over time", error));
  }
}

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
 * Calculate product performance with daily revenue series for sparklines
 */
export function calculateProductPerformance(
  orders: OrderAnalyticsFragment[],
  currency: string
): Result<ProductPerformance[], AnalyticsCalculationError> {
  try {
    const filteredOrders = filterOrdersByCurrency(orders, currency);

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

/**
 * Format orders for the recent orders table
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
    }));

    return ok(recentOrders);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to format recent orders", error));
  }
}
