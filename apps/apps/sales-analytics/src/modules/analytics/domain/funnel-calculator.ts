import { Result, ok, err } from "neverthrow";

import { type OrderAnalyticsFragment, OrderStatus } from "../../../../generated/graphql";
import { AnalyticsCalculationError } from "./analytics-calculator";

export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface FunnelData {
  stages: FunnelStage[];
  totalOrders: number;
}

/**
 * Calculate order funnel based on order status progression.
 *
 * Since Saleor only creates orders after payment, the funnel tracks:
 * 1. Orders Placed (all) — checkout completed, payment captured
 * 2. Confirmed (not DRAFT/UNCONFIRMED) — order confirmed for processing
 * 3. Not Cancelled — orders that weren't cancelled
 * 4. Shipped (PARTIALLY_FULFILLED + FULFILLED + returned) — at least partially shipped
 * 5. Completed (FULFILLED only) — fully delivered, no returns
 *
 * Orders should already be filtered by status before calling this.
 */
export function calculateFunnelData(
  orders: OrderAnalyticsFragment[],
  currency?: string
): Result<FunnelData, AnalyticsCalculationError> {
  try {
    const filtered = currency
      ? orders.filter((o) => o.total.gross.currency === currency)
      : orders;

    const total = filtered.length;

    const confirmed = filtered.filter(
      (o) => o.status !== OrderStatus.Draft && o.status !== OrderStatus.Unconfirmed
    ).length;

    const notCancelled = filtered.filter(
      (o) =>
        o.status !== OrderStatus.Canceled &&
        o.status !== OrderStatus.Draft &&
        o.status !== OrderStatus.Unconfirmed
    ).length;

    const shippedStatuses: OrderStatus[] = [
      OrderStatus.PartiallyFulfilled,
      OrderStatus.Fulfilled,
      OrderStatus.PartiallyReturned,
      OrderStatus.Returned,
    ];
    const shipped = filtered.filter((o) => shippedStatuses.includes(o.status)).length;

    const completed = filtered.filter((o) => o.status === OrderStatus.Fulfilled).length;

    const stages: FunnelStage[] = [
      {
        name: "Orders Placed",
        count: total,
        conversionRate: 100,
        dropoffRate: 0,
      },
      {
        name: "Confirmed",
        count: confirmed,
        conversionRate: total > 0 ? (confirmed / total) * 100 : 0,
        dropoffRate: total > 0 ? ((total - confirmed) / total) * 100 : 0,
      },
      {
        name: "Not Cancelled",
        count: notCancelled,
        conversionRate: total > 0 ? (notCancelled / total) * 100 : 0,
        dropoffRate: confirmed > 0 ? ((confirmed - notCancelled) / confirmed) * 100 : 0,
      },
      {
        name: "Shipped",
        count: shipped,
        conversionRate: total > 0 ? (shipped / total) * 100 : 0,
        dropoffRate: notCancelled > 0 ? ((notCancelled - shipped) / notCancelled) * 100 : 0,
      },
      {
        name: "Completed",
        count: completed,
        conversionRate: total > 0 ? (completed / total) * 100 : 0,
        dropoffRate: shipped > 0 ? ((shipped - completed) / shipped) * 100 : 0,
      },
    ];

    return ok({ stages, totalOrders: total });
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate funnel data", error));
  }
}
