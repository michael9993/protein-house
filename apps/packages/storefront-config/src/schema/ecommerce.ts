import { z } from "zod";

export const CurrencySettingsSchema = z.object({
  default: z.string(),
  supported: z.array(z.string()),
});

export const ShippingSettingsSchema = z.object({
  enabled: z.boolean(),
  freeShippingThreshold: z.number().nullable(),
  showEstimatedDelivery: z.boolean(),
  deliverySlots: z.boolean(),
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
