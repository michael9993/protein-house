import { err, ok, Result } from "neverthrow";
import { createHash } from "crypto";

import { createLogger } from "@/logger";

import { SupplierError } from "../errors";

/** Shape of an AliExpress error body. */
interface AEErrorBody {
  error_response: {
    code: number;
    msg: string;
    sub_code?: string;
    sub_msg?: string;
    request_id?: string;
  };
}

function isErrorBody(body: unknown): body is AEErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error_response" in body &&
    typeof (body as AEErrorBody).error_response === "object"
  );
}

/** Shape of a successful AliExpress response — the top-level key varies. */
interface AESuccessBody<T> {
  [key: string]: { result: T; request_id: string };
}

const logger = createLogger("AliExpressApiClient");

const BASE_URL = "https://api-sg.aliexpress.com/sync";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1_000;

// Circuit-breaker constants
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RECOVERY_MS = 5 * 60 * 1_000; // 5 minutes

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
    // Half-open — allow one request through
    circuitBreaker.openedAt = null;
    circuitBreaker.consecutiveFailures = 0;
    logger.info("Circuit breaker reset to closed (recovery period elapsed)");
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
      `Circuit breaker OPEN after ${circuitBreaker.consecutiveFailures} consecutive failures — pausing for ${CIRCUIT_RECOVERY_MS / 1_000}s`,
    );
  }
}

// ---------------------------------------------------------------------------
// MD5 Signature
// ---------------------------------------------------------------------------

/**
 * Generate the AliExpress API signature.
 * Algorithm: sort params alphabetically by key, concatenate key+value pairs,
 * sandwich with appSecret, then MD5 hash, then UPPERCASE the hex digest.
 */
export function generateSign(
  params: Record<string, string>,
  appSecret: string,
): string {
  const sortedKeys = Object.keys(params).sort();
  let baseString = appSecret;

  for (const key of sortedKeys) {
    baseString += key + params[key];
  }

  baseString += appSecret;

  return createHash("md5").update(baseString, "utf-8").digest("hex").toUpperCase();
}

// ---------------------------------------------------------------------------
// Timestamp helper
// ---------------------------------------------------------------------------

function formatTimestamp(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
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
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AliExpressClientConfig {
  appKey: string;
  appSecret: string;
}

/**
 * Call the AliExpress RPC gateway.
 *
 * Handles: system params injection, MD5 signing, timeout, retries with
 * exponential backoff, circuit breaking, and audit logging.
 */
export async function callApi<T>(
  method: string,
  params: Record<string, string>,
  session: string,
  config: AliExpressClientConfig,
): Promise<Result<T, SupplierError>> {
  if (isCircuitOpen()) {
    return err(
      SupplierError.supplierUnavailable("aliexpress", {
        apiMethod: method,
        rawResponse: "Circuit breaker is open",
      }),
    );
  }

  // Build the full parameter map including system params
  const systemParams: Record<string, string> = {
    method,
    app_key: config.appKey,
    session,
    timestamp: formatTimestamp(),
    format: "json",
    v: "2.0",
    sign_method: "md5",
    ...params,
  };

  // Generate signature over all params
  const sign = generateSign(systemParams, config.appSecret);
  systemParams.sign = sign;

  // Build URL query string
  const queryString = new URLSearchParams(systemParams).toString();
  const url = `${BASE_URL}?${queryString}`;

  let lastError: SupplierError | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const startTime = Date.now();

    try {
      const response = await fetchWithTimeout(
        url,
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } },
        REQUEST_TIMEOUT_MS,
      );

      const elapsed = Date.now() - startTime;
      const body: unknown = await response.json();

      // Check for error response
      if (isErrorBody(body)) {
        const errorResp = body.error_response;

        logger.warn("AliExpress API error", {
          method,
          code: errorResp.code,
          msg: errorResp.msg,
          subCode: errorResp.sub_code,
          elapsed,
          attempt: attempt + 1,
        });

        // Rate-limiting
        if (errorResp.code === 7 || errorResp.sub_code === "isv.flow-limit") {
          recordFailure();
          lastError = SupplierError.rateLimited("aliexpress", {
            apiMethod: method,
            httpStatus: response.status,
            rawResponse: errorResp,
            retryAttempts: attempt + 1,
          });
          await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
          continue;
        }

        // Auth errors
        if (
          errorResp.code === 27 ||
          errorResp.sub_code === "isv.session-expired" ||
          errorResp.sub_code === "isv.invalid-access-token"
        ) {
          recordFailure();
          return err(
            SupplierError.tokenExpired("aliexpress", {
              apiMethod: method,
              httpStatus: response.status,
              rawResponse: errorResp,
            }),
          );
        }

        // Invalid parameter — do not retry
        if (errorResp.code === 15) {
          recordFailure();
          return err(
            SupplierError.invalidRequest("aliexpress", errorResp.msg ?? "Invalid parameter", {
              apiMethod: method,
              httpStatus: response.status,
              rawResponse: errorResp,
            }),
          );
        }

        // Generic failure — retry
        recordFailure();
        lastError = SupplierError.orderFailed(
          "aliexpress",
          errorResp.msg ?? "Unknown AliExpress error",
          {
            apiMethod: method,
            httpStatus: response.status,
            rawResponse: errorResp,
            retryAttempts: attempt + 1,
          },
        );
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }

      // Success — extract result from the first matching key
      const successBody = body as AESuccessBody<T>;
      const responseKey = Object.keys(successBody).find((k) => k !== "error_response");

      if (!responseKey || !successBody[responseKey]) {
        recordFailure();
        return err(
          SupplierError.invalidRequest("aliexpress", "Unexpected response structure", {
            apiMethod: method,
            rawResponse: body,
          }),
        );
      }

      const wrapper = successBody[responseKey];

      logger.info("AliExpress API call succeeded", {
        method,
        elapsed,
        attempt: attempt + 1,
      });

      recordSuccess();
      return ok(wrapper.result);
    } catch (error) {
      const elapsed = Date.now() - startTime;

      recordFailure();

      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const message = isAbort
        ? `Request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "Unknown network error";

      logger.error("AliExpress API network error", {
        method,
        error: message,
        elapsed,
        attempt: attempt + 1,
      });

      lastError = SupplierError.networkError("aliexpress", message, error, {
        apiMethod: method,
        retryAttempts: attempt + 1,
      });

      if (attempt < MAX_RETRIES - 1) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
      }
    }
  }

  return err(
    lastError ??
      SupplierError.networkError("aliexpress", "All retry attempts exhausted", undefined, {
        apiMethod: method,
        retryAttempts: MAX_RETRIES,
      }),
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reset circuit breaker state — useful for testing. */
export function resetCircuitBreaker(): void {
  circuitBreaker.consecutiveFailures = 0;
  circuitBreaker.openedAt = null;
}
