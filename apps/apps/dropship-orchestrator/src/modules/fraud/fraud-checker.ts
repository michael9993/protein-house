import { createLogger } from "@/logger";

import type { BlacklistEntry, FraudCheckResult, FraudConfig, FraudFlag, OrderForFraudCheck } from "./types";
import { SEVERITY_WEIGHTS } from "./types";
import { checkAddressMismatch, validateAddressFormat } from "./rules/address-validation";
import { checkBlacklist } from "./rules/blacklist";
import { checkValueThreshold } from "./rules/value-threshold";
import { checkVelocity } from "./rules/velocity-check";

const logger = createLogger("fraud-checker");

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

/** Maximum possible score — anything above this is clamped. */
const MAX_SCORE = 100;

/** Score threshold below which the order passes. */
const PASS_THRESHOLD = 50;

/**
 * Sum severity weights for all flags, capped at 100.
 */
function calculateScore(flags: FraudFlag[]): number {
  const raw = flags.reduce((sum, flag) => sum + SEVERITY_WEIGHTS[flag.severity], 0);

  return Math.min(raw, MAX_SCORE);
}

// ---------------------------------------------------------------------------
// Main fraud check orchestrator
// ---------------------------------------------------------------------------

/**
 * Run all enabled fraud rules against an order and produce a composite result.
 *
 * The order **passes** if the composite score is below {@link PASS_THRESHOLD}
 * (currently 50). A score of 50 or above fails the check and the order should
 * be queued for manual review or rejected.
 *
 * @param order    - Order data to check
 * @param config   - Fraud configuration (thresholds, enabled rules)
 * @param blacklist - Blacklist entries to match against
 * @returns A {@link FraudCheckResult} with all flags and a composite score
 */
export function runFraudChecks(
  order: OrderForFraudCheck,
  config: FraudConfig,
  blacklist: BlacklistEntry[],
): FraudCheckResult {
  const flags: FraudFlag[] = [];
  const enabled = new Set(config.enabledRules);

  logger.info("Running fraud checks", {
    orderId: order.orderId,
    enabledRules: config.enabledRules,
    isNewCustomer: order.isNewCustomer,
    total: order.total,
  });

  // --- Velocity check ---
  if (enabled.has("velocity_check")) {
    const velocityFlag = checkVelocity(order.email, order.recentOrders, config);

    if (velocityFlag) {
      flags.push(velocityFlag);
    }
  }

  // --- Address mismatch ---
  if (enabled.has("address_mismatch")) {
    const mismatchFlag = checkAddressMismatch(
      order.billingCountry,
      order.shippingCountry,
      config,
    );

    if (mismatchFlag) {
      flags.push(mismatchFlag);
    }

    // Also validate address format
    const formatFlag = validateAddressFormat(order.shippingAddress);

    if (formatFlag) {
      flags.push(formatFlag);
    }
  }

  // --- Value threshold ---
  if (enabled.has("value_threshold") || enabled.has("new_customer_high_value")) {
    const valueFlag = checkValueThreshold(order.total, order.isNewCustomer, config);

    if (valueFlag) {
      // Only include the flag if the specific rule that produced it is enabled.
      // checkValueThreshold may return either "value_threshold" or
      // "new_customer_high_value" depending on the scenario.
      if (enabled.has(valueFlag.rule)) {
        flags.push(valueFlag);
      }
    }
  }

  // --- Blacklist ---
  if (enabled.has("blacklist_match")) {
    const blacklistFlag = checkBlacklist(order.email, order.shippingAddress, blacklist);

    if (blacklistFlag) {
      flags.push(blacklistFlag);
    }
  }

  // --- Composite score ---
  const score = calculateScore(flags);
  const passed = score < PASS_THRESHOLD;

  logger.info("Fraud check complete", {
    orderId: order.orderId,
    score,
    passed,
    flagCount: flags.length,
    flags: flags.map((f) => ({ rule: f.rule, severity: f.severity })),
  });

  return { passed, flags, score };
}
