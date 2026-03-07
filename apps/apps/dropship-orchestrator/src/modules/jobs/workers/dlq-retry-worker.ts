import { Worker, Job } from "bullmq";

import { createLogger } from "@/logger";

import { QUEUE_NAMES, getRedisConnection } from "../queues";

const logger = createLogger("worker:dlq-retry");

const DLQ_KEY = "dropship:dlq:cj";
const BATCH_SIZE = 10;

interface DLQEntry {
  payload: unknown;
  error: string;
  timestamp: string;
  endpoint: string;
}

/**
 * DLQ retry worker — pops failed CJ webhook payloads from the Redis list
 * and logs them for manual investigation.
 *
 * Full re-processing would require importing the specific webhook handlers
 * which adds complexity; for now we surface the failures for ops review.
 */
export function createDlqRetryWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.DLQ_RETRY,
    async (_job: Job) => {
      const redis = getRedisConnection();
      const items: string[] = [];

      // Pop up to BATCH_SIZE items from the DLQ
      for (let i = 0; i < BATCH_SIZE; i++) {
        const item = await redis.rpop(DLQ_KEY);
        if (!item) break;
        items.push(item);
      }

      if (items.length === 0) {
        logger.info("DLQ empty — nothing to process");
        return { processed: 0 };
      }

      logger.info(`Processing ${items.length} DLQ entries`);

      for (const raw of items) {
        try {
          const entry: DLQEntry = JSON.parse(raw);
          logger.warn("DLQ entry for manual review", {
            endpoint: entry.endpoint,
            error: entry.error,
            timestamp: entry.timestamp,
            payloadPreview: JSON.stringify(entry.payload).slice(0, 500),
          });
        } catch {
          logger.error("Malformed DLQ entry", { raw: raw.slice(0, 500) });
        }
      }

      return { processed: items.length };
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.info("DLQ retry job completed", { jobId: job?.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("DLQ retry job failed", { jobId: job?.id, error: err.message });
  });

  return worker;
}
