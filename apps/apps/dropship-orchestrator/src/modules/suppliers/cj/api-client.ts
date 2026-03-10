import { err, ok, Result } from "neverthrow";

import { createLogger } from "@/logger";

import { SupplierError } from "../errors";
import type { CJApiResponse } from "./types";

const logger = createLogger("CJApiClient");

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1_000;

// Circuit-breaker constants
// Each failed request retries MAX_RETRIES times, each calling recordFailure().
// Threshold must be > MAX_RETRIES to avoid a single slow endpoint tripping it.
const CIRCUIT_FAILURE_THRESHOLD = 10;
const CIRCUIT_RECOVERY_MS = 2 * 60 * 1_000; // 2 minutes (was 5)

// Rate limiting — CJ enforces tier-based limits (free: 1 req/s, plus: 2, etc.)
// Use 2s interval to stay well within limits and avoid undocumented burst caps
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 2_000;

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

interface CircuitBreakerState {
  consecutiveFailures: number;
  openedAt: number | null;
}

const circuitBreaker: CircuitBreakerState = {
  consecutiveFailures: 0,
  openedAt: null,
};

function isCircuitOpen(): boolean {
  if (circuitBreaker.openedAt === null) {
    return false;
  }

  const elapsed = Date.now() - circuitBreaker.openedAt;

  if (elapsed >= CIRCUIT_RECOVERY_MS) {
    circuitBreaker.openedAt = null;
    circuitBreaker.consecutiveFailures = 0;
    logger.info("CJ circuit breaker reset to closed (recovery period elapsed)");
    return false;
  }

  return true;
}

function recordSuccess(): void {
  circuitBreaker.consecutiveFailures = 0;
  circuitBreaker.openedAt = null;
}

function recordFailure(): void {
  circuitBreaker.consecutiveFailures += 1;

  if (circuitBreaker.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitBreaker.openedAt = Date.now();
    logger.error(
      `CJ circuit breaker OPEN after ${circuitBreaker.consecutiveFailures} consecutive failures — pausing for ${CIRCUIT_RECOVERY_MS / 1_000}s`,
    );
  }
}

// ---------------------------------------------------------------------------
// Rate Limiter (token-bucket style — 1 req/sec)
// ---------------------------------------------------------------------------

let lastRequestTime = 0;
let minRequestIntervalMs = DEFAULT_MIN_REQUEST_INTERVAL_MS;

export function setRateLimit(intervalMs: number): void {
  minRequestIntervalMs = intervalMs;
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;

  if (elapsed < minRequestIntervalMs) {
    const waitTime = minRequestIntervalMs - elapsed;
    await sleep(waitTime);
  }

  lastRequestTime = Date.now();
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
// Core request functions
// ---------------------------------------------------------------------------

async function makeRequest<T>(
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH",
  path: string,
  accessToken: string,
  body?: unknown,
  queryParams?: Record<string, string>,
): Promise<Result<T, SupplierError>> {
  if (isCircuitOpen()) {
    return err(
      SupplierError.supplierUnavailable("cj", {
        apiMethod: `${method} ${path}`,
        rawResponse: "Circuit breaker is open",
      }),
    );
  }

  let url = `${BASE_URL}${path}`;

  if (queryParams) {
    const qs = new URLSearchParams(queryParams).toString();
    url = `${url}?${qs}`;
  }

  const headers: Record<string, string> = {
    "CJ-Access-Token": accessToken,
    "Content-Type": "application/json",
  };

  let lastError: SupplierError | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await waitForRateLimit();

    const startTime = Date.now();

    try {
      const init: RequestInit = {
        method,
        headers,
      };

      if (body && method !== "GET" && method !== "DELETE") {
        init.body = JSON.stringify(body);
      }

      const response = await fetchWithTimeout(url, init, REQUEST_TIMEOUT_MS);
      const elapsed = Date.now() - startTime;

      const responseBody = (await response.json()) as CJApiResponse<T>;

      // CJ uses code 200 for success inside the body, even when HTTP status is 200
      if (responseBody.code === 200 && responseBody.result) {
        logger.info("CJ API call succeeded", {
          method,
          path,
          elapsed,
          requestId: responseBody.requestId,
          attempt: attempt + 1,
        });

        recordSuccess();
        return ok(responseBody.data);
      }

      // Rate-limited (CJ code 1600004 or HTTP 429)
      if (response.status === 429 || responseBody.code === 1600004) {
        recordFailure();
        lastError = SupplierError.rateLimited("cj", {
          apiMethod: `${method} ${path}`,
          httpStatus: response.status,
          rawResponse: responseBody,
          retryAttempts: attempt + 1,
        });
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }

      // Auth errors (CJ code 1600002 or 1600003)
      if (responseBody.code === 1600002 || responseBody.code === 1600003) {
        recordFailure();
        return err(
          SupplierError.tokenExpired("cj", {
            apiMethod: `${method} ${path}`,
            httpStatus: response.status,
            rawResponse: responseBody,
          }),
        );
      }

      // Other errors
      logger.warn("CJ API non-success response", {
        method,
        path,
        code: responseBody.code,
        message: responseBody.message,
        attempt: attempt + 1,
      });
      recordFailure();
      lastError = new SupplierError({
        code: "ORDER_FAILED",
        message: responseBody.message || `CJ API error (code: ${responseBody.code})`,
        supplierId: "cj",
        context: {
          apiMethod: `${method} ${path}`,
          httpStatus: response.status,
          rawResponse: responseBody,
          retryAttempts: attempt + 1,
        },
      });

      // Don't retry client errors (4xx-range CJ codes)
      if (responseBody.code >= 1600010 && responseBody.code < 1700000) {
        return err(lastError);
      }

      await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
    } catch (error) {
      const elapsed = Date.now() - startTime;

      recordFailure();

      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const message = isAbort
        ? `CJ request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "Unknown network error";

      logger.error("CJ API network error", {
        method,
        path,
        error: message,
        elapsed,
        attempt: attempt + 1,
      });

      lastError = SupplierError.networkError("cj", message, error, {
        apiMethod: `${method} ${path}`,
        retryAttempts: attempt + 1,
      });

      if (attempt < MAX_RETRIES - 1) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
      }
    }
  }

  return err(
    lastError ??
      SupplierError.networkError("cj", "All retry attempts exhausted", undefined, {
        apiMethod: `${method} ${path}`,
        retryAttempts: MAX_RETRIES,
      }),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function get<T>(
  path: string,
  accessToken: string,
  queryParams?: Record<string, string>,
): Promise<Result<T, SupplierError>> {
  return makeRequest<T>("GET", path, accessToken, undefined, queryParams);
}

export async function post<T>(
  path: string,
  accessToken: string,
  body: unknown,
): Promise<Result<T, SupplierError>> {
  return makeRequest<T>("POST", path, accessToken, body);
}

export async function patch<T>(
  path: string,
  accessToken: string,
  body: unknown,
): Promise<Result<T, SupplierError>> {
  return makeRequest<T>("PATCH", path, accessToken, body);
}

export async function del<T>(
  path: string,
  accessToken: string,
  queryParams?: Record<string, string>,
): Promise<Result<T, SupplierError>> {
  return makeRequest<T>("DELETE", path, accessToken, undefined, queryParams);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reset circuit breaker and rate limiter — useful for testing. */
export function resetState(): void {
  circuitBreaker.consecutiveFailures = 0;
  circuitBreaker.openedAt = null;
  lastRequestTime = 0;
  minRequestIntervalMs = DEFAULT_MIN_REQUEST_INTERVAL_MS;
}
