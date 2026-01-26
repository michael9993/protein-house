import { createLogger } from "../../../logger";
import { saleorApp } from "../../../saleor-app";
import { createCampaignWorker } from "./campaign-worker";
import { startCampaignScheduler } from "./campaign-scheduler";

const logger = createLogger("WorkerInitializer");

let workerInitialized = false;
let schedulerInterval: NodeJS.Timeout | null = null;

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
        // Create the campaign worker
        createCampaignWorker();
        logger.info("Campaign worker initialized and started", { queueName: "newsletter-campaigns" });

        // Start the scheduler to check for scheduled campaigns
        // Check every minute for campaigns that should start
        schedulerInterval = startCampaignScheduler(60000); // 60 seconds
        logger.info("Campaign scheduler started", { intervalMs: 60000 });

        workerInitialized = true;
    } catch (error) {
        logger.error("Failed to initialize campaign worker", { error });
        throw error;
    }
}

/**
 * Cleanup function to stop the scheduler
 */
export function cleanupCampaignWorker(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        logger.info("Campaign scheduler stopped");
    }
}

/**
 * Initialize the campaign worker (singleton)
 */
export function getCampaignWorker(): ReturnType<typeof createCampaignWorker> {
    return createCampaignWorker();
}
