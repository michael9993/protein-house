import { Worker } from "bullmq";

import { createLogger } from "@/logger";

import type { ReconciliationJobData, StockSyncJobData, TokenRefreshJobData, TrackingSyncJobData } from "./job-types";
import {
  trackingSyncQueue,
  reconciliationQueue,
  tokenRefreshQueue,
  stockSyncQueue,
  closeRedisConnection,
} from "./queues";
import { createTrackingSyncWorker } from "./workers/tracking-sync-worker";
import { createReconciliationWorker } from "./workers/reconciliation-worker";
import { createTokenRefreshWorker } from "./workers/token-refresh-worker";
import { createStockSyncWorker } from "./workers/stock-sync-worker";

const logger = createLogger("JobScheduler");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let trackingSyncWorker: Worker<TrackingSyncJobData> | null = null;
let reconciliationWorker: Worker<ReconciliationJobData> | null = null;
let tokenRefreshWorker: Worker<TokenRefreshJobData> | null = null;
let stockSyncWorker: Worker<StockSyncJobData> | null = null;
let isRunning = false;

// ---------------------------------------------------------------------------
// Cron schedules
// ---------------------------------------------------------------------------

/**
 * Cron patterns for repeatable jobs.
 *
 * - Tracking sync:     every 2 hours
 * - Reconciliation:    every 6 hours
 * - Token refresh (CJ): every 12 days (CJ tokens expire after 15 days)
 * - Stock sync:        every 4 hours
 */
const SCHEDULES = {
  TRACKING_SYNC: "0 */2 * * *",       // At minute 0, every 2 hours
  RECONCILIATION: "0 */6 * * *",       // At minute 0, every 6 hours
  TOKEN_REFRESH_CJ: "0 0 */12 * *",   // At 00:00, every 12 days
  STOCK_SYNC: "0 1,5,9,13,17,21 * * *", // At minute 1, every 4 hours (offset from tracking)
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the job scheduler. Registers repeatable jobs and starts workers.
 *
 * @param saleorApiUrl - The Saleor GraphQL API URL (needed for job payloads)
 * @param appToken     - The app's auth token
 */
export async function startScheduler(
  saleorApiUrl: string,
  appToken: string,
): Promise<void> {
  if (isRunning) {
    logger.warn("Scheduler already running — skipping duplicate start");
    return;
  }

  logger.info("Starting job scheduler", { saleorApiUrl });

  // ------------------------------------------------------------------
  // Register repeatable jobs
  // ------------------------------------------------------------------

  // Tracking sync — every 2 hours
  await trackingSyncQueue.upsertJobScheduler(
    "tracking-sync-repeatable",
    { pattern: SCHEDULES.TRACKING_SYNC },
    {
      name: "tracking-sync",
      data: { saleorApiUrl, appToken },
    },
  );

  logger.info("Registered tracking sync job", { cron: SCHEDULES.TRACKING_SYNC });

  // Reconciliation — every 6 hours
  await reconciliationQueue.upsertJobScheduler(
    "reconciliation-repeatable",
    { pattern: SCHEDULES.RECONCILIATION },
    {
      name: "reconciliation",
      data: { saleorApiUrl, appToken },
    },
  );

  logger.info("Registered reconciliation job", { cron: SCHEDULES.RECONCILIATION });

  // CJ token refresh — every 12 days
  await tokenRefreshQueue.upsertJobScheduler(
    "token-refresh-cj-repeatable",
    { pattern: SCHEDULES.TOKEN_REFRESH_CJ },
    {
      name: "token-refresh-cj",
      data: { saleorApiUrl, appToken, supplierId: "cj" },
    },
  );

  logger.info("Registered CJ token refresh job", { cron: SCHEDULES.TOKEN_REFRESH_CJ });

  // Stock sync — every 4 hours
  await stockSyncQueue.upsertJobScheduler(
    "stock-sync-repeatable",
    { pattern: SCHEDULES.STOCK_SYNC },
    {
      name: "stock-sync",
      data: { saleorApiUrl, appToken },
    },
  );

  logger.info("Registered stock sync job", { cron: SCHEDULES.STOCK_SYNC });

  // ------------------------------------------------------------------
  // Start workers
  // ------------------------------------------------------------------

  trackingSyncWorker = createTrackingSyncWorker();
  reconciliationWorker = createReconciliationWorker();
  tokenRefreshWorker = createTokenRefreshWorker();
  stockSyncWorker = createStockSyncWorker();

  isRunning = true;
  logger.info("Job scheduler started — all workers running");
}

/**
 * Gracefully stop the scheduler. Closes all workers and the Redis connection.
 */
export async function stopScheduler(): Promise<void> {
  if (!isRunning) {
    logger.warn("Scheduler not running — nothing to stop");
    return;
  }

  logger.info("Stopping job scheduler...");

  // Close workers (waits for current jobs to finish)
  const closePromises: Promise<void>[] = [];

  if (trackingSyncWorker) {
    closePromises.push(trackingSyncWorker.close());
    trackingSyncWorker = null;
  }

  if (reconciliationWorker) {
    closePromises.push(reconciliationWorker.close());
    reconciliationWorker = null;
  }

  if (tokenRefreshWorker) {
    closePromises.push(tokenRefreshWorker.close());
    tokenRefreshWorker = null;
  }

  if (stockSyncWorker) {
    closePromises.push(stockSyncWorker.close());
    stockSyncWorker = null;
  }

  await Promise.all(closePromises);

  // Close queues
  await Promise.all([
    trackingSyncQueue.close(),
    reconciliationQueue.close(),
    tokenRefreshQueue.close(),
    stockSyncQueue.close(),
  ]);

  // Close Redis
  await closeRedisConnection();

  isRunning = false;
  logger.info("Job scheduler stopped");
}
