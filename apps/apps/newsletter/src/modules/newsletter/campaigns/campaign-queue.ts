import { Queue, QueueOptions } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

import { createLogger } from "../../../logger";

const logger = createLogger("CampaignQueue");

let redisClient: IORedis | null = null;
let campaignQueue: Queue | null = null;

export interface CampaignJobData {
  campaignId: string;
  saleorApiUrl: string;
  appId: string;
  channelSlug: string;
  templateId: string;
  recipientFilter: {
    isActive: boolean;
    sources?: string[];
    subscribedAfter?: string;
    subscribedBefore?: string;
    selectionType?: "all" | "selected" | "random" | "newest" | "oldest";
    limit?: number;
    selectedSubscriberIds?: string[];
  };
  batchSize: number;
  rateLimitPerMinute: number;
  maxRetries: number;
}

function getRedisClient(): IORedis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
  logger.info("Connecting to Redis", { redisUrl: redisUrl.replace(/:[^:@]+@/, ":****@") });

  redisClient = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redisClient.on("error", (error) => {
    logger.error("Redis connection error", { error });
  });

  redisClient.on("connect", () => {
    logger.info("Redis connected");
  });

  return redisClient;
}

export function getCampaignQueue(): Queue<CampaignJobData> {
  if (campaignQueue) {
    return campaignQueue;
  }

  const connection = getRedisClient() as unknown as ConnectionOptions;
  const queueOptions: QueueOptions = {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  };

  campaignQueue = new Queue<CampaignJobData>("newsletter-campaigns", queueOptions);

  logger.info("Campaign queue initialized");

  return campaignQueue;
}

export async function addCampaignJob(
  campaignId: string,
  data: Omit<CampaignJobData, "campaignId">,
  scheduledFor?: Date,
): Promise<void> {
  const queue = getCampaignQueue();

  const jobData: CampaignJobData = {
    campaignId,
    ...data,
  };

  if (scheduledFor) {
    const delay = scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      await queue.add(`campaign-${campaignId}`, jobData, {
        delay,
      });
      logger.info("Campaign job scheduled", { campaignId, scheduledFor: scheduledFor.toISOString() });
    } else {
      await queue.add(`campaign-${campaignId}`, jobData);
      logger.info("Campaign job added immediately", { campaignId });
    }
  } else {
    await queue.add(`campaign-${campaignId}`, jobData);
    logger.info("Campaign job added immediately", { campaignId });
  }
}

export async function removeCampaignJob(campaignId: string): Promise<void> {
  const queue = getCampaignQueue();
  const job = await queue.getJob(`campaign-${campaignId}`);
  if (job) {
    await job.remove();
    logger.info("Campaign job removed", { campaignId });
  }
}

export async function closeCampaignQueue(): Promise<void> {
  if (campaignQueue) {
    await campaignQueue.close();
    campaignQueue = null;
  }
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
