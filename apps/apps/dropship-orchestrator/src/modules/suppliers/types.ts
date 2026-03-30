import { Result } from "neverthrow";
import { z } from "zod";

import { SupplierError } from "./errors";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const SupplierOrderStatusEnum = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
} as const;

export type SupplierOrderStatus =
  (typeof SupplierOrderStatusEnum)[keyof typeof SupplierOrderStatusEnum];

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().length(2, "Country must be a 2-letter ISO code"),
  phone: z.string().min(1, "Phone is required"),
});

export type Address = z.infer<typeof AddressSchema>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const AliExpressCredentialsSchema = z.object({
  type: z.literal("aliexpress"),
  appKey: z.string().min(1),
  appSecret: z.string().min(1),
  redirectUri: z.string().url(),
});

export const CJCredentialsSchema = z.object({
  type: z.literal("cj"),
  apiKey: z.string().min(1),
});

export const SupplierCredentialsSchema = z.discriminatedUnion("type", [
  AliExpressCredentialsSchema,
  CJCredentialsSchema,
]);

export type AliExpressCredentials = z.infer<typeof AliExpressCredentialsSchema>;
export type CJCredentials = z.infer<typeof CJCredentialsSchema>;
export type SupplierCredentials = z.infer<typeof SupplierCredentialsSchema>;

export interface AuthToken {
  accessToken: string;
  expiresAt: Date;
  refreshToken?: string;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export const SupplierOrderRequestSchema = z.object({
  supplierSku: z.string().min(1, "Supplier SKU is required"),
  /** AliExpress variant attribute string, e.g. "14:350853#Black;5:361386#M". Not used by CJ. */
  supplierSkuAttr: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  shippingAddress: AddressSchema,
  shippingMethod: z.string().min(1, "Shipping method is required"),
  idempotencyKey: z.string().uuid("Idempotency key must be a valid UUID"),
  /** Store-side line item ID — required by CJ to correlate line items for disputes/returns. */
  lineItemId: z.string().optional(),
  /** Full country name (e.g. "United States") — required by CJ for shipping label printing. */
  countryName: z.string().optional(),
  /** Customer email — used by CJ for tracking notifications. */
  customerEmail: z.string().email().optional(),
});

export type SupplierOrderRequest = z.infer<typeof SupplierOrderRequestSchema>;

export interface SupplierOrderResponse {
  supplierOrderId: string;
  estimatedDelivery?: Date;
  cost: {
    amount: number;
    currency: string;
  };
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

export interface TrackingEvent {
  timestamp: Date;
  description: string;
  location?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
  status: SupplierOrderStatus;
  events: TrackingEvent[];
  /** CJ cross-border tracking number (e.g. CJPAQZ...). Present when supplier is CJ. */
  cjTrackingNumber?: string;
  /** Last-mile domestic carrier tracking number. Present when CJ hands off to local carrier. */
  lastMileTrackingNumber?: string;
}

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------

export interface ShippingOption {
  name: string;
  cost: {
    amount: number;
    currency: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  trackingAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Product & Stock
// ---------------------------------------------------------------------------

export interface SupplierProductVariant {
  sku: string;
  name: string;
  price: {
    amount: number;
    currency: string;
  };
  attributes: Record<string, string>;
  imageUrl?: string;
}

export interface SupplierProduct {
  supplierId: string;
  supplierProductId: string;
  title: string;
  description: string;
  images: string[];
  variants: SupplierProductVariant[];
  category?: string;
}

export interface StockInfo {
  supplierSku: string;
  available: boolean;
  quantity: number;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Supplier Adapter Interface
// ---------------------------------------------------------------------------

export interface SupplierAdapter {
  readonly id: string;
  readonly name: string;
  readonly supportsWebhooks: boolean;

  // Auth
  authenticate(credentials: SupplierCredentials): Promise<Result<AuthToken, SupplierError>>;
  refreshToken(token: AuthToken): Promise<Result<AuthToken, SupplierError>>;
  isTokenValid(token: AuthToken): boolean;

  // Orders
  placeOrder(
    request: SupplierOrderRequest,
    token: AuthToken,
  ): Promise<Result<SupplierOrderResponse, SupplierError>>;
  getOrderStatus(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<SupplierOrderStatus, SupplierError>>;
  getTrackingInfo(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<TrackingInfo, SupplierError>>;
  cancelOrder(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<void, SupplierError>>;

  // Shipping
  getShippingOptions(
    supplierSku: string,
    destinationCountry: string,
    quantity: number,
    token: AuthToken,
  ): Promise<Result<ShippingOption[], SupplierError>>;

  // Catalog
  getProduct(
    supplierProductId: string,
    token: AuthToken,
  ): Promise<Result<SupplierProduct, SupplierError>>;
  getStock(
    supplierSku: string,
    token: AuthToken,
  ): Promise<Result<StockInfo, SupplierError>>;
  getStockBatch(
    supplierSkus: string[],
    token: AuthToken,
  ): Promise<Result<StockInfo[], SupplierError>>;

  // Cost (optional — for suppliers with deferred pricing like CJ)
  getOrderCost?(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<{ amount: number; currency: string }, SupplierError>>;
}
