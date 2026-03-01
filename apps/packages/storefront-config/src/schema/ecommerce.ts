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

export const ShippingSettingsSchema = z.object({
  enabled: z.boolean(),
  freeShippingThreshold: z.number().nullable(),
  showEstimatedDelivery: z.boolean(),
  deliverySlots: z.boolean(),
  defaultEstimatedMinDays: z.number().min(0).default(2),
  defaultEstimatedMaxDays: z.number().min(0).default(5),
  estimatedDeliveryFormat: z.enum(["range", "max"]).default("range"),
  priceAdjustment: ShippingPriceAdjustmentSchema.optional(),
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
