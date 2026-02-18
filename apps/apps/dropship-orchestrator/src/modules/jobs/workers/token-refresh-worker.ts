import { Worker, Job } from "bullmq";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import {
  fetchAppId,
  getSupplierCredentials,
  setSupplierCredentials,
} from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken } from "@/modules/suppliers/types";

import type { TokenRefreshJobData } from "../job-types";
import { QUEUE_NAMES, getRedisConnection } from "../queues";

const logger = createLogger("worker:token-refresh");

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processTokenRefresh(job: Job<TokenRefreshJobData>): Promise<void> {
  const { saleorApiUrl, appToken, supplierId } = job.data;

  logger.info("Token refresh job started", { jobId: job.id, supplierId });

  const client = createGraphQLClient({
    saleorApiUrl,
    token: appToken,
  });

  const appId = await fetchAppId(client);

  if (!appId) {
    logger.error("Cannot resolve app ID — aborting token refresh", { supplierId });
    throw new Error("App ID unavailable");
  }

  // Get the supplier adapter
  const adapter = supplierRegistry.getAdapter(supplierId);

  if (!adapter) {
    logger.error("No adapter registered for supplier — skipping refresh", { supplierId });
    return;
  }

  // Get stored credentials
  const creds = await getSupplierCredentials(client, appId, supplierId);

  if (!creds) {
    logger.error("No stored credentials for supplier — skipping refresh", { supplierId });

    await logAuditEvent(client, {
      type: "token_refreshed",
      supplierId,
      action: `Token refresh skipped — no credentials found for ${supplierId}`,
      status: "skipped",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Build existing auth token from stored credentials
  const existingToken: AuthToken = {
    accessToken: creds.accessToken ?? "",
    expiresAt: creds.tokenExpiresAt
      ? new Date(creds.tokenExpiresAt)
      : new Date(0), // Expired by default if no timestamp
    refreshToken: ("refreshToken" in creds ? creds.refreshToken : undefined) as
      | string
      | undefined,
  };

  // Check if token is already valid (hasn't expired yet)
  if (adapter.isTokenValid(existingToken)) {
    // Calculate how close to expiry we are
    const msUntilExpiry = existingToken.expiresAt.getTime() - Date.now();
    const daysUntilExpiry = msUntilExpiry / (24 * 60 * 60 * 1000);

    // Only refresh if within 3 days of expiry
    if (daysUntilExpiry > 3) {
      logger.info("Token still valid and not near expiry — skipping refresh", {
        supplierId,
        daysUntilExpiry: Math.round(daysUntilExpiry),
      });
      return;
    }

    logger.info("Token nearing expiry — refreshing", {
      supplierId,
      daysUntilExpiry: Math.round(daysUntilExpiry),
    });
  }

  // Attempt token refresh
  const refreshStart = Date.now();
  const refreshResult = await adapter.refreshToken(existingToken);

  if (refreshResult.isErr()) {
    const error = refreshResult.error;

    logger.error("Token refresh failed", {
      supplierId,
      error: error.message,
      code: error.code,
    });

    await logAuditEvent(client, {
      type: "token_refreshed",
      supplierId,
      action: `Token refresh failed for ${supplierId}: ${error.message}`,
      status: "failure",
      duration: Date.now() - refreshStart,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw new Error(`Token refresh failed: ${error.message}`);
  }

  const newToken = refreshResult.value;

  // Store updated credentials
  const updatedCreds = {
    ...creds,
    accessToken: newToken.accessToken,
    tokenExpiresAt: newToken.expiresAt.toISOString(),
    ...(newToken.refreshToken ? { refreshToken: newToken.refreshToken } : {}),
  };

  await setSupplierCredentials(client, appId, supplierId, updatedCreds);

  await logAuditEvent(client, {
    type: "token_refreshed",
    supplierId,
    action: `Token refreshed for ${supplierId}, new expiry: ${newToken.expiresAt.toISOString()}`,
    status: "success",
    duration: Date.now() - refreshStart,
    response: {
      expiresAt: newToken.expiresAt.toISOString(),
    },
    timestamp: new Date().toISOString(),
  });

  logger.info("Token refreshed successfully", {
    supplierId,
    newExpiresAt: newToken.expiresAt.toISOString(),
    duration: Date.now() - refreshStart,
  });
}

// ---------------------------------------------------------------------------
// Worker creation
// ---------------------------------------------------------------------------

/**
 * Create and return a BullMQ Worker for token refresh jobs.
 */
export function createTokenRefreshWorker(): Worker<TokenRefreshJobData> {
  const worker = new Worker<TokenRefreshJobData>(
    QUEUE_NAMES.TOKEN_REFRESH,
    processTokenRefresh,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.info("Token refresh job completed", {
      jobId: job?.id,
      supplierId: job?.data.supplierId,
    });
  });

  worker.on("failed", (job, err) => {
    logger.error("Token refresh job failed", {
      jobId: job?.id,
      supplierId: job?.data.supplierId,
      error: err.message,
    });
  });

  return worker;
}
