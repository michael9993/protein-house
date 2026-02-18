import { createLogger } from "@/logger";
import { saleorApp } from "@/saleor-app";

import { startScheduler, stopScheduler } from "./scheduler";

const logger = createLogger("SchedulerInit");

let initialized = false;

/**
 * Lazily start the job scheduler. Safe to call multiple times — will only
 * start once. The scheduler needs Saleor auth data (API URL + app token)
 * which is only available after the app is registered.
 *
 * Called from:
 *  1. The register handler (right after successful registration)
 *  2. The ORDER_PAID webhook handler (safety net for container restarts)
 */
export async function ensureSchedulerStarted(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    // Read auth data from the APL (Auth Persistence Layer)
    const allAuth =
      typeof (saleorApp.apl as any).getAll === "function"
        ? await (saleorApp.apl as any).getAll()
        : [];
    const authData = Array.isArray(allAuth) ? allAuth[0] : null;

    if (!authData) {
      logger.info(
        "No Saleor auth data available yet — scheduler will start when app is registered",
      );
      return;
    }

    await startScheduler(authData.saleorApiUrl, authData.token);
    initialized = true;
  } catch (error) {
    logger.error("Failed to start scheduler", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown — registered once at module load time
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — stopping scheduler`);

  try {
    await stopScheduler();
  } catch (error) {
    logger.error("Error during scheduler shutdown", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
