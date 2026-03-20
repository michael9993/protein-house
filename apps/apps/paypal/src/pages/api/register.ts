import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "@/lib/saleor-app";
import { createLogger } from "@/lib/logger";

const logger = createLogger("register");

export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [(_url: string) => true],
  async onRequestVerified(_req, { authData }) {
    logger.info("App registered successfully", {
      saleorApiUrl: authData.saleorApiUrl,
    });
  },
});
