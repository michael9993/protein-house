import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "../../saleor-app";

export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [
    // Allow all URLs in development
    (url) => {
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      // In production, you might want to restrict to specific URLs
      return true;
    },
  ],
});
