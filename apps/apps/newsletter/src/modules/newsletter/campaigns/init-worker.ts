import { createLogger } from "../../../logger";
import { createCampaignWorker } from "./campaign-worker";
import { startCampaignScheduler } from "./campaign-scheduler";

const logger = createLogger("InitWorker");

let workerInitialized = false;

// Initialize worker on module load (server-side only)
if (typeof window === "undefined") {
    // Use a function to ensure it only runs once
    if (!workerInitialized) {
        try {
            const worker = createCampaignWorker();
            workerInitialized = true;
            logger.info("Campaign worker initialized and started", {
                queueName: "newsletter-campaigns",
            });

            // Log worker events for debugging
            worker.on("ready", () => {
                logger.info("Campaign worker ready to process jobs");
            });

            worker.on("error", (error) => {
                logger.error("Campaign worker error", { error: error.message, stack: error.stack });
            });

            worker.on("stalled", (jobId) => {
                logger.warn("Campaign worker job stalled", { jobId });
            });

            // Start the scheduler to check for scheduled campaigns
            // Check every minute for campaigns that should start
            startCampaignScheduler(60000); // 60 seconds
            logger.info("Campaign scheduler started", { intervalMs: 60000 });
        } catch (error) {
            logger.error("Failed to initialize campaign worker", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    }
}
