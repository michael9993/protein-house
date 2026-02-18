import { createLogger } from "@/logger";

import type { FraudConfig, FraudFlag } from "../types";

const logger = createLogger("fraud-rule:value-threshold");

// ---------------------------------------------------------------------------
// Value Threshold Check
// ---------------------------------------------------------------------------

/**
 * Flag orders that exceed value thresholds.
 *
 * Two scenarios:
 *   1. New customer placing an order above `newCustomerHighValueThreshold`
 *      → severity "high" (more suspicious)
 *   2. Any customer placing an order above `highValueThreshold`
 *      → severity "medium" (informational flag)
 *
 * The new-customer check takes precedence: if both match, only the
 * new-customer flag is returned (it is the more actionable signal).
 */
export function checkValueThreshold(
  orderTotal: number,
  isNewCustomer: boolean,
  config: FraudConfig,
): FraudFlag | null {
  // --- New customer + high value (stricter threshold) ---
  if (isNewCustomer && orderTotal > config.newCustomerHighValueThreshold) {
    logger.info("Value threshold flag: new customer high value order", {
      orderTotal,
      threshold: config.newCustomerHighValueThreshold,
      isNewCustomer,
    });

    return {
      rule: "new_customer_high_value",
      severity: "high",
      message: `New customer placed a $${orderTotal.toFixed(2)} order (threshold: $${config.newCustomerHighValueThreshold})`,
      details: {
        orderTotal,
        threshold: config.newCustomerHighValueThreshold,
        isNewCustomer: true,
      },
    };
  }

  // --- General high value ---
  if (orderTotal > config.highValueThreshold) {
    logger.info("Value threshold flag: high value order", {
      orderTotal,
      threshold: config.highValueThreshold,
      isNewCustomer,
    });

    return {
      rule: "value_threshold",
      severity: "medium",
      message: `Order total $${orderTotal.toFixed(2)} exceeds high-value threshold ($${config.highValueThreshold})`,
      details: {
        orderTotal,
        threshold: config.highValueThreshold,
        isNewCustomer,
      },
    };
  }

  return null;
}
