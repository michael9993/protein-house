import { z } from "zod";

// ---------------------------------------------------------------------------
// AliExpress API Response Wrapper
// ---------------------------------------------------------------------------

export interface AliExpressApiResponse<T> {
  /** Top-level key varies per method (e.g. "aliexpress_ds_order_create_response"). */
  [key: string]: {
    /** The actual result payload. */
    result: T;
    /** Request ID from the AliExpress gateway. */
    request_id: string;
  };
}

export interface AliExpressErrorResponse {
  error_response: {
    code: number;
    msg: string;
    sub_code?: string;
    sub_msg?: string;
    request_id?: string;
  };
}

// ---------------------------------------------------------------------------
// Order Status Enum — AliExpress-native values
// ---------------------------------------------------------------------------

export const AliExpressOrderStatus = {
  PLACE_ORDER_SUCCESS: "PLACE_ORDER_SUCCESS",
  IN_CANCEL: "IN_CANCEL",
  WAIT_SELLER_SEND_GOODS: "WAIT_SELLER_SEND_GOODS",
  SELLER_PART_SEND_GOODS: "SELLER_PART_SEND_GOODS",
  WAIT_BUYER_ACCEPT_GOODS: "WAIT_BUYER_ACCEPT_GOODS",
  FUND_PROCESSING: "FUND_PROCESSING",
  IN_ISSUE: "IN_ISSUE",
  IN_FROZEN: "IN_FROZEN",
  RISK_CONTROL: "RISK_CONTROL",
  FINISH: "FINISH",
} as const;

export type AliExpressOrderStatus =
  (typeof AliExpressOrderStatus)[keyof typeof AliExpressOrderStatus];

// ---------------------------------------------------------------------------
// Logistics Address
// ---------------------------------------------------------------------------

export interface AliExpressLogisticsAddress {
  contact_person: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone_country: string;
  mobile_no: string;
  province?: string;
}

// ---------------------------------------------------------------------------
// Order Create
// ---------------------------------------------------------------------------

export interface AliExpressProductItem {
  product_id: number;
  product_count: number;
  sku_attr?: string;
  logistics_service_name: string;
}

export interface AliExpressOrderCreateParams {
  logistics_address: AliExpressLogisticsAddress;
  product_items: AliExpressProductItem[];
}

export interface AliExpressOrderCreateResult {
  is_success: boolean;
  order_list?: {
    number: number[];
  };
  error_code?: string;
  error_msg?: string;
}

// ---------------------------------------------------------------------------
// Order Get
// ---------------------------------------------------------------------------

export interface AliExpressOrderGetResult {
  gmt_create: string;
  order_status: AliExpressOrderStatus;
  logistics_status?: string;
  order_amount: {
    amount: string;
    currency_code: string;
  };
  child_order_list?: {
    ae_child_order_info: AliExpressChildOrder[];
  };
}

export interface AliExpressChildOrder {
  child_order_id: number;
  product_id: number;
  product_name: string;
  product_count: number;
  sku_info?: string;
  logistics_service_name?: string;
  logistics_tracking_number?: string;
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

export interface AliExpressTrackingEvent {
  event_desc: string;
  signed_name?: string;
  status: string;
  address: string;
  event_date: string;
}

export interface AliExpressTrackingResult {
  result_success: boolean;
  details?: {
    details: AliExpressTrackingEvent[];
  };
  official_website?: string;
  tracking_number?: string;
  logistics_company?: string;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export interface AliExpressProductInfo {
  product_id: number;
  product_title: string;
  product_main_image_url: string;
  product_image_urls?: string;
  product_small_image_urls?: {
    string: string[];
  };
  target_sale_price: string;
  target_sale_price_currency: string;
  target_original_price: string;
  target_original_price_currency: string;
  evaluate_rate?: string;
  first_level_category_id?: number;
  second_level_category_id?: number;
  sku_info_list?: {
    ae_sku_info: AliExpressSkuInfo[];
  };
}

export interface AliExpressSkuInfo {
  sku_id: string;
  sku_price: string;
  sku_stock: boolean;
  sku_attr: string;
  sku_available_stock?: number;
  id: string;
  offer_sale_price?: string;
  offer_bulk_sale_price?: string;
  ipm_sku_stock: number;
  s_k_u_val?: string;
  barcode?: string;
}

// ---------------------------------------------------------------------------
// Freight / Shipping
// ---------------------------------------------------------------------------

export interface AliExpressFreightResult {
  freight_calculate_result_list?: {
    ae_freight_calculate_result: AliExpressFreightOption[];
  };
}

export interface AliExpressFreightOption {
  service_name: string;
  freight: {
    amount: string;
    currency_code: string;
    cent: number;
  };
  estimated_delivery_time: string;
  tracking: boolean;
}

// ---------------------------------------------------------------------------
// OAuth Token
// ---------------------------------------------------------------------------

export const AliExpressTokenResponseSchema = z.object({
  access_token: z.string(),
  expire_time: z.coerce.number(),
  refresh_token: z.string().optional(),
  refresh_token_valid_time: z.coerce.number().optional(),
  user_nick: z.string().optional(),
  user_id: z.string().optional(),
  sp: z.string().optional(),
});

export type AliExpressTokenResponse = z.infer<typeof AliExpressTokenResponseSchema>;
