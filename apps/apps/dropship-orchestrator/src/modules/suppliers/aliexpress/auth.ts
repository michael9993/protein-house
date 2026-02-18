import { err, ok, Result } from "neverthrow";

import { createLogger } from "@/logger";

import { SupplierError } from "../errors";
import type { AuthToken } from "../types";
import { AliExpressTokenResponseSchema } from "./types";

const logger = createLogger("AliExpressAuth");

const AUTH_BASE_URL = "https://api-sg.aliexpress.com/rest";
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Generate the AliExpress OAuth authorization URL that a merchant visits to
 * grant access to their dropshipping account.
 */
export function getAuthorizationUrl(
  appKey: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appKey,
    redirect_uri: redirectUri,
    state,
    sp: "ae",
  });

  return `https://api-sg.aliexpress.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange a temporary OAuth authorization code for a long-lived access token.
 *
 * Token endpoint: POST to https://api-sg.aliexpress.com/rest
 *   method = /auth/token/create
 *
 * Note: AliExpress refresh tokens are unreliable. The recommended approach is
 * to store the access-token expiry and prompt the user to re-authorize ~30 days
 * before it expires.
 */
export async function exchangeCodeForToken(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string,
): Promise<Result<AuthToken, SupplierError>> {
  const body = new URLSearchParams({
    app_key: appKey,
    app_secret: appSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  logger.info("Exchanging OAuth code for access token");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const text = await response.text().catch(() => "");

      logger.error("Token exchange HTTP error", {
        status: response.status,
        body: text,
      });

      return err(
        SupplierError.authFailed("aliexpress", `Token exchange failed with HTTP ${response.status}`, {
          httpStatus: response.status,
          rawResponse: text,
          apiMethod: "/auth/token/create",
        }),
      );
    }

    const raw: unknown = await response.json();

    // Check for error in the JSON body (AliExpress returns 200 with error fields)
    if (typeof raw === "object" && raw !== null && "error" in raw) {
      const errorObj = raw as Record<string, unknown>;

      logger.error("Token exchange returned error", { error: errorObj });

      return err(
        SupplierError.authFailed(
          "aliexpress",
          String(errorObj.error_description ?? errorObj.error ?? "Unknown auth error"),
          {
            apiMethod: "/auth/token/create",
            rawResponse: errorObj,
          },
        ),
      );
    }

    const parsed = AliExpressTokenResponseSchema.safeParse(raw);

    if (!parsed.success) {
      logger.error("Failed to parse token response", {
        errors: parsed.error.flatten(),
        raw,
      });

      return err(
        SupplierError.authFailed("aliexpress", "Invalid token response from AliExpress", {
          apiMethod: "/auth/token/create",
          rawResponse: raw,
        }),
      );
    }

    const data = parsed.data;

    // expire_time is a Unix timestamp in milliseconds
    const expiresAt = new Date(data.expire_time);

    const token: AuthToken = {
      accessToken: data.access_token,
      expiresAt,
      refreshToken: data.refresh_token,
    };

    logger.info("Successfully obtained access token", {
      expiresAt: expiresAt.toISOString(),
      hasRefreshToken: !!data.refresh_token,
    });

    return ok(token);
  } catch (error) {
    clearTimeout(timer);

    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const message = isAbort
      ? `Token exchange timed out after ${REQUEST_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : "Unknown network error during token exchange";

    logger.error("Token exchange network error", { error: message });

    return err(
      SupplierError.networkError("aliexpress", message, error, {
        apiMethod: "/auth/token/create",
      }),
    );
  }
}
