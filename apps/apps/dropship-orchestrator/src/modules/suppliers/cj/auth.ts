import { err, ok, Result } from "neverthrow";

import { createLogger } from "@/logger";

import { SupplierError } from "../errors";
import type { AuthToken } from "../types";
import type { CJApiResponse, CJTokenResponse } from "./types";

const logger = createLogger("CJAuth");

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";
const REQUEST_TIMEOUT_MS = 30_000;

// CJ token lifetimes
const ACCESS_TOKEN_LIFETIME_DAYS = 15;
const REFRESH_TOKEN_LIFETIME_DAYS = 180;

// ---------------------------------------------------------------------------
// In-memory token cache (access token valid 15 days, auth endpoint rate-limited)
// ---------------------------------------------------------------------------

interface CachedToken {
  token: AuthToken;
  apiKey: string;
  cachedAt: number;
}

let tokenCache: CachedToken | null = null;

// Refresh 1 hour before expiry to be safe
const TOKEN_SAFETY_MARGIN_MS = 60 * 60 * 1_000;

function getCachedToken(apiKey: string): AuthToken | null {
  if (!tokenCache || tokenCache.apiKey !== apiKey) return null;

  const now = Date.now();
  const expiresAt = tokenCache.token.expiresAt.getTime();

  if (now >= expiresAt - TOKEN_SAFETY_MARGIN_MS) {
    tokenCache = null;
    return null;
  }

  return tokenCache.token;
}

function setCachedToken(apiKey: string, token: AuthToken): void {
  tokenCache = { token, apiKey, cachedAt: Date.now() };
}

/** Clear cached token — useful for testing or forced re-auth. */
export function clearTokenCache(): void {
  tokenCache = null;
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Get Access Token
// ---------------------------------------------------------------------------

/**
 * Obtain an access token from CJ Dropshipping using an API key.
 *
 * POST /authentication/getAccessToken
 * Body: { apiKey: "CJUserNum@api@xxxxxxxxx" }
 *
 * The API key is generated from the CJ developer portal (https://developers.cjdropshipping.com/).
 * Access token is valid for 15 days.
 * Refresh token is valid for 180 days.
 * Note: This endpoint can only be called once every 5 minutes.
 */
export async function getAccessToken(
  apiKey: string,
): Promise<Result<AuthToken, SupplierError>> {
  // Check in-memory cache first (avoids hitting rate-limited auth endpoint)
  const cached = getCachedToken(apiKey);
  if (cached) {
    logger.debug("Using cached CJ access token", {
      expiresAt: cached.expiresAt.toISOString(),
    });
    return ok(cached);
  }

  logger.info("Requesting CJ access token (no cache hit)");

  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/authentication/getAccessToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      },
      REQUEST_TIMEOUT_MS,
    );

    const body = (await response.json()) as CJApiResponse<CJTokenResponse>;

    if (body.code !== 200 || !body.result || !body.data) {
      logger.error("CJ getAccessToken failed", {
        code: body.code,
        message: body.message,
        requestId: body.requestId,
      });

      return err(
        SupplierError.authFailed("cj", body.message || "Failed to obtain CJ access token", {
          apiMethod: "POST /authentication/getAccessToken",
          httpStatus: response.status,
          rawResponse: body,
        }),
      );
    }

    const data = body.data;

    const expiresAt = data.accessTokenExpiryDate
      ? new Date(data.accessTokenExpiryDate)
      : new Date(Date.now() + ACCESS_TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1_000);

    const token: AuthToken = {
      accessToken: data.accessToken,
      expiresAt,
      refreshToken: data.refreshToken,
    };

    logger.info("CJ access token obtained", {
      expiresAt: expiresAt.toISOString(),
      hasRefreshToken: !!data.refreshToken,
    });

    setCachedToken(apiKey, token);
    return ok(token);
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const message = isAbort
      ? `CJ auth request timed out after ${REQUEST_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : "Unknown network error during CJ authentication";

    logger.error("CJ getAccessToken network error", { error: message });

    return err(
      SupplierError.networkError("cj", message, error, {
        apiMethod: "POST /authentication/getAccessToken",
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Refresh Access Token
// ---------------------------------------------------------------------------

/**
 * Refresh an expired CJ access token using a valid refresh token.
 *
 * POST /authentication/refreshAccessToken
 * Body: { refreshToken: "<token>" }
 *
 * New access token: 15-day lifetime.
 * The refresh token itself is valid for 180 days from original issuance.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<Result<AuthToken, SupplierError>> {
  logger.info("Refreshing CJ access token");

  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/authentication/refreshAccessToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      },
      REQUEST_TIMEOUT_MS,
    );

    const body = (await response.json()) as CJApiResponse<CJTokenResponse>;

    if (body.code !== 200 || !body.result || !body.data) {
      logger.error("CJ refreshAccessToken failed", {
        code: body.code,
        message: body.message,
        requestId: body.requestId,
      });

      return err(
        SupplierError.authFailed("cj", body.message || "Failed to refresh CJ access token", {
          apiMethod: "POST /authentication/refreshAccessToken",
          httpStatus: response.status,
          rawResponse: body,
        }),
      );
    }

    const data = body.data;

    const expiresAt = data.accessTokenExpiryDate
      ? new Date(data.accessTokenExpiryDate)
      : new Date(Date.now() + ACCESS_TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1_000);

    const token: AuthToken = {
      accessToken: data.accessToken,
      expiresAt,
      refreshToken: data.refreshToken,
    };

    logger.info("CJ access token refreshed", {
      expiresAt: expiresAt.toISOString(),
    });

    return ok(token);
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const message = isAbort
      ? `CJ refresh request timed out after ${REQUEST_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : "Unknown network error during CJ token refresh";

    logger.error("CJ refreshAccessToken network error", { error: message });

    return err(
      SupplierError.networkError("cj", message, error, {
        apiMethod: "POST /authentication/refreshAccessToken",
      }),
    );
  }
}
