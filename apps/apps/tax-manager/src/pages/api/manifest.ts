import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";

import { checkoutCalculateTaxesWebhook } from "./webhooks/checkout-calculate-taxes";
import { orderCalculateTaxesWebhook } from "./webhooks/order-calculate-taxes";

export default createManifestHandler({
  async manifestFactory({ appBaseUrl, schemaVersion }) {
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;

    const manifest: AppManifest = {
      id: "saleor.app.tax-manager",
      version: "1.0.0",
      name: "Tax Manager",
      about: "Self-hosted tax calculation engine with configurable country/state rates, export zero-rating, and preset rate libraries for Israel, EU, and US.",
      permissions: ["HANDLE_TAXES", "MANAGE_APPS"] as unknown as AppManifest["permissions"],
      appUrl: iframeBaseUrl,
      configurationUrl: `${iframeBaseUrl}/`,
      tokenTargetUrl: `${apiBaseURL}/api/register`,
      dataPrivacyUrl: `${iframeBaseUrl}/`,
      supportUrl: `${iframeBaseUrl}/`,
      brand: {
        logo: {
          default: `${apiBaseURL}/logo.png`,
        },
      },
      webhooks: [
        checkoutCalculateTaxesWebhook.getWebhookManifest(apiBaseURL),
        orderCalculateTaxesWebhook.getWebhookManifest(apiBaseURL),
      ],
      extensions: [],
    };

    return manifest;
  },
});
