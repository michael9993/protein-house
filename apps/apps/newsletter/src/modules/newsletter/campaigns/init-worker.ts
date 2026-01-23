import { createLogger } from "../../../logger";
import { createCampaignWorker } from "./campaign-worker";

const logger = createLogger("InitWorker");

// Initialize worker on module load (server-side only)
if (typeof window === "undefined") {
  try {
    createCampaignWorker();
    logger.info("Campaign worker initialized");
  } catch (error) {
    logger.error("Failed to initialize campaign worker", { error });
  }
}
