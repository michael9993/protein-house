/** PayPal v2 Orders API types */

export interface PayPalAccessTokenResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

export interface PayPalAmount {
  currency_code: string;
  value: string;
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  amount: PayPalAmount;
  payments?: {
    captures?: PayPalCapture[];
    authorizations?: PayPalAuthorization[];
    refunds?: PayPalRefund[];
  };
}

export interface PayPalCapture {
  id: string;
  status: PayPalCaptureStatus;
  amount: PayPalAmount;
  create_time: string;
  update_time: string;
  final_capture: boolean;
}

export interface PayPalAuthorization {
  id: string;
  status: string;
  amount: PayPalAmount;
  create_time: string;
  update_time: string;
}

export interface PayPalRefund {
  id: string;
  status: PayPalRefundStatus;
  amount: PayPalAmount;
  create_time: string;
  update_time: string;
}

export interface PayPalOrder {
  id: string;
  status: PayPalOrderStatus;
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units: PayPalPurchaseUnit[];
  create_time: string;
  update_time: string;
  links: PayPalLink[];
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalErrorResponse {
  name: string;
  message: string;
  debug_id: string;
  details?: Array<{
    field: string;
    value: string;
    issue: string;
    description: string;
  }>;
}

export type PayPalOrderStatus =
  | "CREATED"
  | "SAVED"
  | "APPROVED"
  | "VOIDED"
  | "COMPLETED"
  | "PAYER_ACTION_REQUIRED";

export type PayPalCaptureStatus =
  | "COMPLETED"
  | "DECLINED"
  | "PARTIALLY_REFUNDED"
  | "PENDING"
  | "REFUNDED"
  | "FAILED";

export type PayPalRefundStatus = "CANCELLED" | "FAILED" | "PENDING" | "COMPLETED";

/** PayPal Webhook Notification types */

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  summary: string;
  resource: Record<string, unknown>;
  links: PayPalLink[];
}

export interface PayPalWebhookListResponse {
  webhooks: PayPalWebhookInfo[];
}

export interface PayPalWebhookInfo {
  id: string;
  url: string;
  event_types: Array<{ name: string }>;
  links: PayPalLink[];
}

export interface PayPalWebhookVerifyResponse {
  verification_status: "SUCCESS" | "FAILURE";
}
