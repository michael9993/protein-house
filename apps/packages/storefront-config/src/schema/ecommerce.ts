import { z } from "zod";

export const CurrencySettingsSchema = z.object({
  default: z.string(),
  supported: z.array(z.string()),
});

export const ShippingPriceAdjustmentSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum([
    "round_down",
    "round_up",
    "flat_discount",
    "flat_markup",
    "percentage_discount",
    "percentage_markup",
  ]).default("round_down"),
  value: z.number().min(0).default(10),
  minPrice: z.number().min(0).default(0),
});

export const ShippingFreeRuleSchema = z.object({
  /** Whether the conditional free shipping rule is active */
  enabled: z.boolean().default(false),
  /** Cart subtotal must be >= this to qualify */
  cartMinimum: z.number().min(0).default(100),
  /** Only make methods free if their base price is <= this (0 = no limit) */
  maxMethodPrice: z.number().min(0).default(0),
  /** Only apply to methods whose name contains this string (empty = all methods) */
  methodNameFilter: z.string().default(""),
});

export const ShippingDiscountRuleSchema = z.object({
  /** Whether the cart-based discount is active */
  enabled: z.boolean().default(false),
  /** Cart subtotal must be >= this to trigger */
  cartMinimum: z.number().min(0).default(50),
  /** "flat" = fixed amount off, "percentage" = percent off */
  type: z.enum(["flat", "percentage"]).default("percentage"),
  /** Discount value (currency amount or percentage 0-100) */
  value: z.number().min(0).default(10),
  /** Only discount methods priced <= this (0 = no limit) */
  maxMethodPrice: z.number().min(0).default(0),
  /** Adjusted price won't go below this */
  minPrice: z.number().min(0).default(0),
  /** Only apply to methods whose name contains this string (empty = all methods) */
  methodNameFilter: z.string().default(""),
});

export const DropshipShippingSchema = z.object({
  /** Enable margin protection — blocks free/discounted shipping when unprofitable */
  marginProtectionEnabled: z.boolean().default(false),
  /** Minimum acceptable margin percentage (0-100) */
  marginThreshold: z.number().min(0).max(100).default(15),
  /** Store original CJ prices in order metadata for cost tracking */
  trackOriginalPrices: z.boolean().default(true),
});

export const ShippingSettingsSchema = z.object({
  enabled: z.boolean(),
  freeShippingThreshold: z.number().nullable(),
  showEstimatedDelivery: z.boolean(),
  deliverySlots: z.boolean(),
  defaultEstimatedMinDays: z.number().min(0).default(2),
  defaultEstimatedMaxDays: z.number().min(0).default(5),
  estimatedDeliveryFormat: z.enum(["range", "max"]).default("range"),
  priceAdjustment: ShippingPriceAdjustmentSchema.optional(),
  freeShippingRule: ShippingFreeRuleSchema.optional(),
  discountRule: ShippingDiscountRuleSchema.optional(),
  /** Show original price with strikethrough when a rule changes the price */
  showOriginalPrice: z.boolean().default(true),
  /** Dropship-specific shipping settings (margin protection, cost tracking) */
  dropship: DropshipShippingSchema.optional(),
});

export const TaxSettingsSchema = z.object({
  showPricesWithTax: z.boolean(),
  taxIncludedInPrice: z.boolean(),
});

export const InventorySettingsSchema = z.object({
  showStockLevel: z.boolean(),
  lowStockThreshold: z.number(),
  allowBackorders: z.boolean(),
});

export const CheckoutSettingsSchema = z.object({
  minOrderAmount: z.number().nullable(),
  maxOrderAmount: z.number().nullable(),
  termsRequired: z.boolean(),
});

export const EcommerceSchema = z.object({
  currency: CurrencySettingsSchema,
  shipping: ShippingSettingsSchema,
  tax: TaxSettingsSchema,
  inventory: InventorySettingsSchema,
  checkout: CheckoutSettingsSchema,
});
