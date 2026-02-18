import { createLogger } from "@/logger";

import { type FraudConfig, FraudConfigSchema } from "./types";

const logger = createLogger("fraud-config");

// ---------------------------------------------------------------------------
// Default Fraud Configuration
// ---------------------------------------------------------------------------

/**
 * Sensible defaults for fraud detection. All rules enabled, thresholds tuned
 * for a mid-size dropshipping store.
 */
export const DEFAULT_FRAUD_CONFIG: FraudConfig = {
  maxOrdersPerHour: 3,
  maxSpendPer24h: 500,
  highValueThreshold: 200,
  newCustomerHighValueThreshold: 100,
  billingShippingMismatchBlocking: false,
  enabledRules: [
    "velocity_check",
    "address_mismatch",
    "value_threshold",
    "blacklist_match",
    "new_customer_high_value",
  ],
};

// ---------------------------------------------------------------------------
// Config merge helper
// ---------------------------------------------------------------------------

/**
 * Deep-merge a partial config (e.g. loaded from app metadata) with the
 * defaults. Validates the result through the Zod schema so downstream code
 * can rely on the full shape.
 *
 * Invalid fields are silently dropped and replaced with defaults; a warning
 * is logged so operators can fix their stored config.
 */
export function mergeFraudConfig(stored: Partial<FraudConfig>): FraudConfig {
  const merged = { ...DEFAULT_FRAUD_CONFIG, ...stored };

  const result = FraudConfigSchema.safeParse(merged);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    // Log at ERROR level so this is never missed — operators need to know
    // their custom fraud thresholds aren't active.
    logger.error(
      "CRITICAL: Stored fraud config invalid — falling back to DEFAULT thresholds. " +
        "Admin-configured fraud rules are NOT active until the config is fixed.",
      { fieldErrors },
    );

    return DEFAULT_FRAUD_CONFIG;
  }

  return result.data;
}
