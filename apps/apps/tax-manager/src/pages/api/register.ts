import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "@/saleor-app";
import { createLogger } from "@/logger";

const logger = createLogger("register");

export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [(_url: string) => true],
  async onRequestVerified(req, { authData }) {
    logger.info("App registered successfully", {
      saleorApiUrl: authData.saleorApiUrl,
    });
  },
});
