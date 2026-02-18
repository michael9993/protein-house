import { createLogger } from "@/logger";

import type { FraudConfig, FraudFlag, OrderSummary } from "../types";

const logger = createLogger("fraud-rule:velocity-check");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ordersWithinWindow(orders: OrderSummary[], windowMs: number, now: Date): OrderSummary[] {
  const cutoff = now.getTime() - windowMs;

  return orders.filter((o) => {
    const ts = new Date(o.createdAt).getTime();

    return ts >= cutoff;
  });
}

// ---------------------------------------------------------------------------
// Velocity Check
// ---------------------------------------------------------------------------

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Check order velocity for a given customer email.
 *
 * Two independent checks:
 *   1. Number of orders in the last hour exceeds `maxOrdersPerHour`.
 *   2. Total spend in the last 24 hours exceeds `maxSpendPer24h`.
 *
 * Returns one flag for the *most severe* violation found, or `null` if clean.
 */
export function checkVelocity(
  customerEmail: string,
  recentOrders: OrderSummary[],
  config: FraudConfig,
  now: Date = new Date(),
): FraudFlag | null {
  const email = customerEmail.toLowerCase().trim();

  // Filter to only this customer's orders
  const customerOrders = recentOrders.filter((o) => o.email.toLowerCase().trim() === email);

  // --- Check 1: orders per hour ---
  const ordersLastHour = ordersWithinWindow(customerOrders, ONE_HOUR_MS, now);

  if (ordersLastHour.length >= config.maxOrdersPerHour) {
    logger.info("Velocity flag: too many orders in last hour", {
      email,
      count: ordersLastHour.length,
      limit: config.maxOrdersPerHour,
    });

    return {
      rule: "velocity_check",
      severity: "high",
      message: `Customer placed ${ordersLastHour.length} orders in the last hour (limit: ${config.maxOrdersPerHour})`,
      details: {
        email,
        ordersInLastHour: ordersLastHour.length,
        limit: config.maxOrdersPerHour,
      },
    };
  }

  // --- Check 2: total spend in 24h ---
  const ordersLast24h = ordersWithinWindow(customerOrders, TWENTY_FOUR_HOURS_MS, now);
  const totalSpend24h = ordersLast24h.reduce((sum, o) => sum + o.total, 0);

  if (totalSpend24h >= config.maxSpendPer24h) {
    logger.info("Velocity flag: 24h spend limit exceeded", {
      email,
      totalSpend24h,
      limit: config.maxSpendPer24h,
    });

    return {
      rule: "velocity_check",
      severity: "high",
      message: `Customer spent $${totalSpend24h.toFixed(2)} in the last 24 hours (limit: $${config.maxSpendPer24h})`,
      details: {
        email,
        totalSpend24h,
        orderCount24h: ordersLast24h.length,
        limit: config.maxSpendPer24h,
      },
    };
  }

  return null;
}
