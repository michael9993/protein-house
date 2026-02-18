import { z } from "zod";

// ---------------------------------------------------------------------------
// CJ API Response Wrapper
// ---------------------------------------------------------------------------

export interface CJApiResponse<T> {
  code: number;
  result: boolean;
  message: string;
  data: T;
  requestId: string;
}

// ---------------------------------------------------------------------------
// Order Status Enum — CJ-native values
// ---------------------------------------------------------------------------

export const CJOrderStatus = {
  CREATED: "CREATED",
  IN_CART: "IN_CART",
  UNPAID: "UNPAID",
  UNSHIPPED: "UNSHIPPED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  OTHER: "OTHER",
} as const;

export type CJOrderStatus = (typeof CJOrderStatus)[keyof typeof CJOrderStatus];

// ---------------------------------------------------------------------------
// Order Create
// ---------------------------------------------------------------------------

export interface CJOrderProductItem {
  vid: string;
  quantity: number;
}

export interface CJOrderCreateParams {
  orderNumber: string;
  shippingCountryCode: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingZip: string;
  shippingPhone: string;
  logisticName: string;
  fromCountryCode: string;
  products: CJOrderProductItem[];
}

export interface CJOrderCreateResult {
  orderId: string;
  orderNum: string;
}

// ---------------------------------------------------------------------------
// Order Detail
// ---------------------------------------------------------------------------

export interface CJOrderDetail {
  orderId: string;
  orderNum: string;
  orderStatus: CJOrderStatus;
  createDate: string;
  paymentDate?: string;
  shippingDate?: string;
  trackNumber?: string;
  logisticName?: string;
  orderAmount: number;
  productAmount: number;
  shippingAmount: number;
  orderWeight?: number;
  cjRemark?: string;
  productList?: CJOrderProductDetail[];
}

export interface CJOrderProductDetail {
  vid: string;
  quantity: number;
  sellPrice: number;
  productNameEn: string;
  productImage?: string;
  variantNameEn?: string;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export interface CJProductInfo {
  pid: string;
  productNameEn: string;
  productSku: string;
  productImage: string;
  productWeight: number;
  productType: string;
  categoryId: string;
  categoryName: string;
  description: string;
  sellPrice: number;
  sourceFrom: number;
  variants?: CJVariantInfo[];
  productImageSet?: string[];
}

export interface CJVariantInfo {
  vid: string;
  variantNameEn: string;
  variantSku: string;
  variantImage?: string;
  variantSellPrice: number;
  variantStandard?: string;
  variantKey?: string;
  variantProperty?: string;
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export interface CJStockInfo {
  vid: string;
  variantNameEn?: string;
  stock: number;
}

// ---------------------------------------------------------------------------
// Tracking / Logistics
// ---------------------------------------------------------------------------

export interface CJTrackingData {
  trackNumber: string;
  logisticName: string;
  logisticUrl?: string;
  trackInfoList?: CJTrackingEvent[];
}

export interface CJTrackingEvent {
  date: string;
  info: string;
  location?: string;
}

// ---------------------------------------------------------------------------
// Freight / Shipping
// ---------------------------------------------------------------------------

export interface CJFreightCalculateParams {
  startCountryCode: string;
  endCountryCode: string;
  products: Array<{
    quantity: number;
    vid: string;
  }>;
}

export interface CJFreightResult {
  logisticName: string;
  logisticPrice: number;
  logisticPriceCn?: number;
  logisticAging: string;
  logisticPriceUnit: string;
  trackable: boolean;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export const CJWebhookPayloadSchema = z.object({
  messageId: z.string(),
  type: z.string(),
  messageType: z.string(),
  params: z.record(z.unknown()),
});

export type CJWebhookPayload = z.infer<typeof CJWebhookPayloadSchema>;

export const CJWebhookMessageType = {
  ORDER_STATUS: "ORDER_STATUS_CHANGE",
  LOGISTICS_UPDATE: "LOGISTICS_UPDATE",
  STOCK_CHANGE: "STOCK_CHANGE",
} as const;

// ---------------------------------------------------------------------------
// Auth / Token
// ---------------------------------------------------------------------------

export interface CJTokenResponse {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  createDate: string;
}
