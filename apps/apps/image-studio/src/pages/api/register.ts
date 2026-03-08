import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "../../saleor-app";

const ALLOWED_DOMAINS = (process.env.ALLOWED_SALEOR_URLS || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [
    (url) => {
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      if (ALLOWED_DOMAINS.length === 0) {
        return true;
      }
      return ALLOWED_DOMAINS.some((allowed) => url.startsWith(allowed));
    },
  ],
});
