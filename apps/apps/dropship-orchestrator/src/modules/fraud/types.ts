import { z } from "zod";

// ---------------------------------------------------------------------------
// Fraud Rule Names
// ---------------------------------------------------------------------------

export const FraudRuleNameEnum = {
  VELOCITY_CHECK: "velocity_check",
  ADDRESS_MISMATCH: "address_mismatch",
  VALUE_THRESHOLD: "value_threshold",
  BLACKLIST_MATCH: "blacklist_match",
  NEW_CUSTOMER_HIGH_VALUE: "new_customer_high_value",
} as const;

export const FraudRuleNameSchema = z.enum([
  "velocity_check",
  "address_mismatch",
  "value_threshold",
  "blacklist_match",
  "new_customer_high_value",
]);

export type FraudRuleName = z.infer<typeof FraudRuleNameSchema>;

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

export const FraudSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export type FraudSeverity = z.infer<typeof FraudSeveritySchema>;

/**
 * Numeric weight for each severity level. Used to compute a composite score.
 */
export const SEVERITY_WEIGHTS: Record<FraudSeverity, number> = {
  low: 10,
  medium: 25,
  high: 50,
  critical: 100,
} as const;

// ---------------------------------------------------------------------------
// Fraud Flag
// ---------------------------------------------------------------------------

export const FraudFlagSchema = z.object({
  rule: FraudRuleNameSchema,
  severity: FraudSeveritySchema,
  message: z.string(),
  details: z.record(z.string(), z.unknown()),
});

export type FraudFlag = z.infer<typeof FraudFlagSchema>;

// ---------------------------------------------------------------------------
// Fraud Check Result
// ---------------------------------------------------------------------------

export const FraudCheckResultSchema = z.object({
  passed: z.boolean(),
  flags: z.array(FraudFlagSchema),
  score: z.number().min(0).max(100),
});

export type FraudCheckResult = z.infer<typeof FraudCheckResultSchema>;

// ---------------------------------------------------------------------------
// Fraud Config — stored in app metadata, all fields have sensible defaults
// ---------------------------------------------------------------------------

export const FraudConfigSchema = z.object({
  /** Max orders allowed per customer email in a 1-hour sliding window. */
  maxOrdersPerHour: z.number().int().positive().default(3),

  /** Max total spend allowed per customer email in a 24-hour sliding window (USD). */
  maxSpendPer24h: z.number().positive().default(500),

  /** Orders above this value are flagged as high-value. */
  highValueThreshold: z.number().positive().default(200),

  /** Lower threshold applied to first-time customers. */
  newCustomerHighValueThreshold: z.number().positive().default(100),

  /** Whether a billing/shipping country mismatch should block the order. */
  billingShippingMismatchBlocking: z.boolean().default(false),

  /** Which fraud rules are active. All enabled by default. */
  enabledRules: z
    .array(FraudRuleNameSchema)
    .default([
      "velocity_check",
      "address_mismatch",
      "value_threshold",
      "blacklist_match",
      "new_customer_high_value",
    ]),
});

export type FraudConfig = z.infer<typeof FraudConfigSchema>;

// ---------------------------------------------------------------------------
// Blacklist
// ---------------------------------------------------------------------------

export const BlacklistEntryTypeSchema = z.enum(["email", "address", "phone", "ip"]);

export type BlacklistEntryType = z.infer<typeof BlacklistEntryTypeSchema>;

export const BlacklistEntrySchema = z.object({
  type: BlacklistEntryTypeSchema,
  value: z.string().min(1),
  addedAt: z.string().datetime(),
  reason: z.string(),
});

export type BlacklistEntry = z.infer<typeof BlacklistEntrySchema>;

// ---------------------------------------------------------------------------
// Order summary — lightweight shape used by fraud rules
// ---------------------------------------------------------------------------

export const OrderSummarySchema = z.object({
  email: z.string().email(),
  total: z.number().nonnegative(),
  createdAt: z.string().datetime(),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;

// ---------------------------------------------------------------------------
// Order shape passed into the fraud checker
// ---------------------------------------------------------------------------

export const OrderForFraudCheckSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  email: z.string().email(),
  total: z.number().nonnegative(),
  isNewCustomer: z.boolean(),
  billingCountry: z.string().length(2),
  shippingCountry: z.string().length(2),
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string().length(2),
    phone: z.string(),
  }),
  recentOrders: z.array(OrderSummarySchema),
});

export type OrderForFraudCheck = z.infer<typeof OrderForFraudCheckSchema>;

// ---------------------------------------------------------------------------
// Exception Record — orders that require manual review
// ---------------------------------------------------------------------------

export const ExceptionReasonSchema = z.enum([
  "fraud_velocity",
  "fraud_address",
  "fraud_value",
  "fraud_blacklist",
  "cost_ceiling",
  "daily_spend_limit",
  "low_stock",
  "supplier_error",
  "multi_supplier",
]);

export type ExceptionReason = z.infer<typeof ExceptionReasonSchema>;

export const ExceptionStatusSchema = z.enum([
  "pending_review",
  "approved",
  "rejected",
  "auto_resolved",
]);

export type ExceptionStatus = z.infer<typeof ExceptionStatusSchema>;

export const ExceptionRecordSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  reason: ExceptionReasonSchema,
  details: z.string(),
  status: ExceptionStatusSchema,
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  resolvedBy: z.string().optional(),
});

export type ExceptionRecord = z.infer<typeof ExceptionRecordSchema>;
