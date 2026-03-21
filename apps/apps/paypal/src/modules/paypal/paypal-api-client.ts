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
} from "./types";

const logger = createLogger("PayPalApiClient");

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
      logger.error("PayPal auth request failed", { error });
      return err(
        new PayPalApiError("PayPal authentication request failed", {
          cause: error,
          props: { publicCode: "AUTH_REQUEST_FAILED" },
        }),
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

        logger.error("PayPal API error", {
          method,
          path,
          status: response.status,
          error: errorData,
        });

        return err(
          new PayPalApiError(errorData?.message ?? `PayPal API returned ${response.status}`, {
            props: {
              publicCode: errorData?.name ?? "API_ERROR",
              publicMessage: errorData?.message ?? "PayPal request failed",
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

  getEnvironment(): PayPalEnvironment {
    return this.environment;
  }
}
