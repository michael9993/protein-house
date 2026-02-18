import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";
import type { NextApiRequest, NextApiResponse } from "next";

import { createLogger } from "@/logger";
import { ensureSchedulerStarted } from "@/modules/jobs/scheduler-init";

import { saleorApp } from "../../saleor-app";

const logger = createLogger("register");

const baseHandler = createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [
    (_url) => {
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      return true;
    },
  ],
});

/**
 * Wrap the SDK register handler so we can start the background job scheduler
 * after the app is successfully registered with Saleor.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await baseHandler(req, res);

  // After successful registration, start the scheduler.
  // The SDK handler will have already sent the response, but we can
  // fire-and-forget the scheduler init in the background.
  if (res.statusCode === 200 || res.statusCode === 201) {
    logger.info("App registered — starting background job scheduler");
    void ensureSchedulerStarted();
  }
}
