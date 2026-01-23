import { createLogger } from "../../../logger";
import { saleorApp } from "../../../saleor-app";
import { createCampaignWorker } from "./campaign-worker";

const logger = createLogger("WorkerInitializer");

let workerInitialized = false;

/**
 * Initialize the campaign worker
 * This should be called once when the app starts (server-side only)
 */
export async function initializeCampaignWorker(): Promise<void> {
  if (workerInitialized) {
    logger.warn("Campaign worker already initialized");
    return;
  }

  if (typeof window !== "undefined") {
    // Don't initialize worker on client-side
    return;
  }

  try {
    // Get all registered apps to initialize workers for each
    // For now, we'll initialize a single worker that can handle all campaigns
    // In the future, we might want one worker per Saleor instance

    // The worker needs auth data, but we can't get it until a campaign is processed
    // So we'll create a placeholder worker that will get auth data from the job context
    // For now, we'll create the worker structure but it will need to be enhanced

    logger.info("Campaign worker initialization skipped - will be initialized per-job");
    // TODO: Implement proper worker initialization
    // The worker needs to be able to get auth data for different Saleor instances
    // This is complex because we need to handle multiple Saleor instances

    workerInitialized = true;
  } catch (error) {
    logger.error("Failed to initialize campaign worker", { error });
    throw error;
  }
}

/**
 * Initialize the campaign worker (singleton)
 */
export function getCampaignWorker(): ReturnType<typeof createCampaignWorker> {
  return createCampaignWorker();
}
