import { err, ok, Result } from "neverthrow";

import { createLogger } from "@/lib/logger";

import { PayPalClientId } from "./paypal-client-id";
import { PayPalClientSecret } from "./paypal-client-secret";
import { PayPalOrderId } from "./paypal-order-id";
import { PayPalApiError } from "./paypal-api-error";
import {
  PayPalAccessTokenResponse,
  PayPalOrder,
  PayPalErrorResponse,
  PayPalRefund,
  PayPalAmount,
  PayPalWebhookInfo,
  PayPalWebhookListResponse,
  PayPalWebhookVerifyResponse,
} from "./types";

const logger = createLogger("PayPalApiClient");

/** Map PayPal error codes to user-friendly messages shown in the storefront/dashboard */
function getUserFriendlyPayPalError(issueCode: string, fallback: string): string {
  const messages: Record<string, string> = {
    // Payment declined
    INSTRUMENT_DECLINED: "Your payment method was declined. Please try a different payment method.",
    TRANSACTION_REFUSED: "This transaction was refused. Please try a different payment method.",
    PAYER_ACTION_REQUIRED: "Additional verification is required. Please complete the verification step.",
    ORDER_NOT_APPROVED: "The payment was not approved. Please try again and complete the approval.",
    DUPLICATE_INVOICE_ID: "This payment has already been processed.",
    PAYER_CANNOT_PAY: "This PayPal account cannot complete this payment. Please try a different payment method.",
    PAYER_ACCOUNT_RESTRICTED: "This PayPal account is restricted. Please contact PayPal support.",
    PAYER_ACCOUNT_LOCKED_OR_CLOSED: "This PayPal account is locked or closed. Please use a different account.",

    // Card-specific
    CARD_EXPIRED: "Your card has expired. Please use a different card.",
    CARD_CLOSED: "This card account has been closed. Please use a different card.",
    INSUFFICIENT_FUNDS: "Insufficient funds. Please use a different payment method.",
    MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED: "Too many payment attempts. Please wait and try again later.",

    // Refund errors
    CAPTURE_FULLY_REFUNDED: "This payment has already been fully refunded.",
    CAPTURE_NOT_COMPLETED: "The payment has not been completed yet and cannot be refunded.",
    PARTIAL_REFUND_NOT_ALLOWED: "Partial refunds are not allowed for this payment.",

    // Server/system
    INTERNAL_SERVER_ERROR: "PayPal is experiencing temporary issues. Please try again in a few minutes.",
    UNPROCESSABLE_ENTITY: "PayPal could not process this request. Please try again.",
  };

  return messages[issueCode] ?? fallback;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export type PayPalEnvironment = "SANDBOX" | "LIVE";

function getBaseUrl(environment: PayPalEnvironment): string {
  return environment === "SANDBOX"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export class PayPalApiClient {
  private clientId: PayPalClientId;
  private clientSecret: PayPalClientSecret;
  private environment: PayPalEnvironment;
  private baseUrl: string;
  private cachedToken: CachedToken | null = null;

  constructor(args: {
    clientId: PayPalClientId;
    clientSecret: PayPalClientSecret;
    environment: PayPalEnvironment;
  }) {
    this.clientId = args.clientId;
    this.clientSecret = args.clientSecret;
    this.environment = args.environment;
    this.baseUrl = getBaseUrl(args.environment);
  }

  private async getAccessToken(): Promise<Result<string, PayPalApiError>> {
    // Check cache (with 60s buffer before expiry)
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return ok(this.cachedToken.accessToken);
    }

    try {
      const credentials = Buffer.from(
        `${String(this.clientId)}:${String(this.clientSecret)}`,
      ).toString("base64");

      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to get PayPal access token", {
          status: response.status,
          body: errorText,
        });
        return err(
          new PayPalApiError("Failed to authenticate with PayPal", {
            props: { publicCode: "AUTH_FAILED", publicMessage: "PayPal authentication failed" },
          }),
        );
      }

      const data = (await response.json()) as PayPalAccessTokenResponse;

      this.cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      return ok(data.access_token);
    } catch (error) {
      logger.error("PayPal auth request failed", {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        baseUrl: this.baseUrl,
        environment: this.environment,
      });
      return err(
        new PayPalApiError(
          `PayPal authentication failed (${this.environment}): ${error instanceof Error ? error.message : "Network error"}`,
          {
            cause: error,
            props: { publicCode: "AUTH_REQUEST_FAILED", publicMessage: "PayPal authentication failed — check credentials and network" },
          },
        ),
      );
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Result<T, PayPalApiError>> {
    const tokenResult = await this.getAccessToken();
    if (tokenResult.isErr()) {
      return err(tokenResult.error);
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${tokenResult.value}`,
        "Content-Type": "application/json",
      };

      // Negative testing: set PAYPAL_MOCK_RESPONSE env var to simulate errors
      // e.g., PAYPAL_MOCK_RESPONSE=INSTRUMENT_DECLINED
      // Only applies to capture/refund paths — not order creation (so checkout can proceed)
      const mockResponse = process.env.PAYPAL_MOCK_RESPONSE;
      const isMockablePath = path.includes("/capture") || path.includes("/refund") || path.includes("/authorize");
      if (mockResponse && this.environment === "SANDBOX" && isMockablePath) {
        logger.warn("Negative testing: injecting mock response", { mockResponse, path });
        headers["PayPal-Mock-Response"] = JSON.stringify({
          mock_application_codes: mockResponse,
        });
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        let errorData: PayPalErrorResponse | undefined;
        try {
          errorData = (await response.json()) as PayPalErrorResponse;
        } catch {
          // ignore parse error
        }

        const detailsStr = errorData?.details?.map(
          (d) => `${d.field}: ${d.issue} (${d.description})`,
        ).join("; ");

        logger.error("PayPal API error", {
          method,
          path,
          status: response.status,
          errorName: errorData?.name,
          errorMessage: errorData?.message,
          errorDetails: detailsStr,
          debugId: errorData?.debug_id,
        });

        const fullMessage = detailsStr
          ? `${errorData?.message}: ${detailsStr}`
          : errorData?.message ?? `PayPal API returned ${response.status}`;

        // Extract the specific issue code from details (e.g., INSTRUMENT_DECLINED)
        const issueCode = errorData?.details?.[0]?.issue ?? errorData?.name ?? "API_ERROR";
        const userFriendlyMessage = getUserFriendlyPayPalError(issueCode, fullMessage);

        return err(
          new PayPalApiError(fullMessage, {
            props: {
              publicCode: issueCode,
              publicMessage: userFriendlyMessage,
            },
          }),
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return ok({} as T);
      }

      const data = (await response.json()) as T;
      return ok(data);
    } catch (error) {
      logger.error("PayPal API request failed", { method, path, error });
      return err(
        new PayPalApiError("PayPal API request failed", {
          cause: error,
          props: { publicCode: "REQUEST_FAILED" },
        }),
      );
    }
  }

  /**
   * Validate credentials by attempting to get an access token.
   */
  async validateCredentials(): Promise<Result<true, PayPalApiError>> {
    const result = await this.getAccessToken();
    return result.map(() => true as const);
  }

  /**
   * Create a PayPal order.
   */
  async createOrder(args: {
    amount: PayPalAmount;
    referenceId: string;
    intent?: "CAPTURE" | "AUTHORIZE";
    payer?: {
      name?: { given_name: string; surname: string };
      email_address?: string;
      address?: {
        address_line_1?: string;
        address_line_2?: string;
        admin_area_2?: string; // city
        admin_area_1?: string; // state/region
        postal_code?: string;
        country_code?: string;
      };
    };
  }): Promise<Result<PayPalOrder, PayPalApiError>> {
    return this.request<PayPalOrder>("POST", "/v2/checkout/orders", {
      intent: args.intent ?? "CAPTURE",
      purchase_units: [
        {
          reference_id: args.referenceId,
          amount: args.amount,
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
      ...(args.payer ? { payer: args.payer } : {}),
    });
  }

  /**
   * Capture an approved PayPal order.
   */
  async captureOrder(orderId: PayPalOrderId): Promise<Result<PayPalOrder, PayPalApiError>> {
    return this.request<PayPalOrder>(
      "POST",
      `/v2/checkout/orders/${String(orderId)}/capture`,
      {},
    );
  }

  /**
   * Authorize an approved PayPal order (AUTHORIZE intent only).
   * Places a hold on the payer's funds without capturing.
   */
  async authorizeOrder(orderId: PayPalOrderId): Promise<Result<PayPalOrder, PayPalApiError>> {
    return this.request<PayPalOrder>(
      "POST",
      `/v2/checkout/orders/${String(orderId)}/authorize`,
      {},
    );
  }

  /**
   * Get PayPal order details.
   */
  async getOrder(orderId: PayPalOrderId): Promise<Result<PayPalOrder, PayPalApiError>> {
    return this.request<PayPalOrder>("GET", `/v2/checkout/orders/${String(orderId)}`);
  }

  /**
   * Refund a captured payment.
   */
  async refundCapture(
    captureId: string,
    amount?: PayPalAmount,
  ): Promise<Result<PayPalRefund, PayPalApiError>> {
    const body = amount ? { amount } : {};
    return this.request<PayPalRefund>(
      "POST",
      `/v2/payments/captures/${captureId}/refund`,
      body,
    );
  }

  /**
   * Void an authorized payment.
   */
  async voidAuthorization(authorizationId: string): Promise<Result<void, PayPalApiError>> {
    return this.request<void>(
      "POST",
      `/v2/payments/authorizations/${authorizationId}/void`,
      {},
    );
  }

  /**
   * Capture an authorized payment.
   * PayPal REST v2: POST /v2/payments/authorizations/{authorization_id}/capture
   */
  async captureAuthorization(
    authorizationId: string,
    amount?: PayPalAmount,
  ): Promise<Result<PayPalOrder, PayPalApiError>> {
    const body = amount ? { amount } : {};
    return this.request<PayPalOrder>(
      "POST",
      `/v2/payments/authorizations/${authorizationId}/capture`,
      body,
    );
  }

  /**
   * Get refund details by ID.
   * PayPal REST v2: GET /v2/payments/refunds/{refund_id}
   */
  async getRefund(refundId: string): Promise<Result<PayPalRefund, PayPalApiError>> {
    return this.request<PayPalRefund>("GET", `/v2/payments/refunds/${refundId}`);
  }

  /**
   * Create a webhook subscription.
   * PayPal REST v1: POST /v1/notifications/webhooks
   */
  async createWebhook(
    url: string,
    eventTypes: string[],
  ): Promise<Result<PayPalWebhookInfo, PayPalApiError>> {
    return this.request<PayPalWebhookInfo>("POST", "/v1/notifications/webhooks", {
      url,
      event_types: eventTypes.map((name) => ({ name })),
    });
  }

  /**
   * Delete a webhook subscription.
   * PayPal REST v1: DELETE /v1/notifications/webhooks/{webhook_id}
   */
  async deleteWebhook(webhookId: string): Promise<Result<void, PayPalApiError>> {
    return this.request<void>("DELETE", `/v1/notifications/webhooks/${webhookId}`);
  }

  /**
   * List all webhook subscriptions.
   * PayPal REST v1: GET /v1/notifications/webhooks
   */
  async listWebhooks(): Promise<Result<PayPalWebhookListResponse, PayPalApiError>> {
    return this.request<PayPalWebhookListResponse>("GET", "/v1/notifications/webhooks");
  }

  /**
   * Verify a webhook event signature via PayPal API.
   * PayPal REST v1: POST /v1/notifications/verify-webhook-signature
   */
  async verifyWebhookSignature(args: {
    webhookId: string;
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    authAlgo: string;
    transmissionSig: string;
    webhookEvent: unknown;
  }): Promise<Result<PayPalWebhookVerifyResponse, PayPalApiError>> {
    return this.request<PayPalWebhookVerifyResponse>(
      "POST",
      "/v1/notifications/verify-webhook-signature",
      {
        webhook_id: args.webhookId,
        transmission_id: args.transmissionId,
        transmission_time: args.transmissionTime,
        cert_url: args.certUrl,
        auth_algo: args.authAlgo,
        transmission_sig: args.transmissionSig,
        webhook_event: args.webhookEvent,
      },
    );
  }

  getEnvironment(): PayPalEnvironment {
    return this.environment;
  }
}
