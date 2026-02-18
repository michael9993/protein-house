import { Queue, DefaultJobOptions } from "bullmq";
import IORedis from "ioredis";

import { createLogger } from "@/logger";

import type { ReconciliationJobData, TokenRefreshJobData, TrackingSyncJobData } from "./job-types";

const logger = createLogger("JobQueues");

// ---------------------------------------------------------------------------
// Shared Redis connection (singleton)
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";

let _redisConnection: IORedis | null = null;

/**
 * Return (and lazily create) a shared Redis connection used by all BullMQ
 * queues and workers.
 */
export function getRedisConnection(): IORedis {
  if (!_redisConnection) {
    _redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5_000);
        logger.warn("Redis reconnecting", { attempt: times, delayMs: delay });
        return delay;
      },
    });

    _redisConnection.on("connect", () => {
      logger.info("Redis connected", { url: REDIS_URL });
    });

    _redisConnection.on("error", (err) => {
      logger.error("Redis connection error", { error: err.message });
    });
  }

  return _redisConnection;
}

/**
 * Gracefully close the shared Redis connection.
 */
export async function closeRedisConnection(): Promise<void> {
  if (_redisConnection) {
    await _redisConnection.quit();
    _redisConnection = null;
    logger.info("Redis connection closed");
  }
}

// ---------------------------------------------------------------------------
// Default job options
// ---------------------------------------------------------------------------

const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5_000, // 5s base, exponential: 5s → 10s → 20s
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // Remove completed jobs after 24 hours
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days for debugging
  },
};

// ---------------------------------------------------------------------------
// Queue definitions
// ---------------------------------------------------------------------------

export const QUEUE_NAMES = {
  TRACKING_SYNC: "dropship:tracking-sync",
  RECONCILIATION: "dropship:reconciliation",
  TOKEN_REFRESH: "dropship:token-refresh",
} as const;

/**
 * Tracking sync queue — polls supplier APIs for tracking updates.
 * Repeatable: every 2 hours.
 */
export const trackingSyncQueue = new Queue<TrackingSyncJobData>(QUEUE_NAMES.TRACKING_SYNC, {
  connection: getRedisConnection(),
  defaultJobOptions,
});

/**
 * Reconciliation queue — catches missed updates and flags discrepancies.
 * Repeatable: every 6 hours.
 */
export const reconciliationQueue = new Queue<ReconciliationJobData>(QUEUE_NAMES.RECONCILIATION, {
  connection: getRedisConnection(),
  defaultJobOptions,
});

/**
 * Token refresh queue — refreshes supplier API tokens before expiry.
 * Repeatable: every 12 days (CJ tokens expire after 15 days).
 */
export const tokenRefreshQueue = new Queue<TokenRefreshJobData>(QUEUE_NAMES.TOKEN_REFRESH, {
  connection: getRedisConnection(),
  defaultJobOptions,
});
