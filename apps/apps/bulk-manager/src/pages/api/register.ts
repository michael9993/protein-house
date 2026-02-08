import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "../../saleor-app";

export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [
    (url) => {
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      return true;
    },
  ],
});
