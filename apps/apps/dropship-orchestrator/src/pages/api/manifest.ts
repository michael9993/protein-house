import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";

import packageJson from "../../../package.json";
import { orderCancelledWebhook } from "./webhooks/saleor/order-cancelled";
import { orderPaidWebhook } from "./webhooks/saleor/order-paid";
import { orderRefundedWebhook } from "./webhooks/saleor/order-refunded";
import { shippingFilterWebhook } from "./webhooks/saleor/shipping-filter";
import { shippingListWebhook } from "./webhooks/saleor/shipping-list";

const handler = createManifestHandler({
  async manifestFactory({ appBaseUrl }) {
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;

    const manifest: AppManifest = {
      about:
        "Multi-supplier dropshipping orchestrator for AliExpress, CJ Dropshipping, and more. Auto-forwards orders, syncs tracking/fulfillment, and provides fraud detection.",
      appUrl: iframeBaseUrl,
      author: "Aura E-Commerce",
      brand: {
        logo: {
          default: `${apiBaseURL}/logo.png`,
        },
      },
      dataPrivacyUrl: "https://saleor.io/legal/privacy/",
      extensions: [],
      homepageUrl: "https://github.com/saleor/apps",
      id: "saleor.app.dropship-orchestrator",
      name: "Dropship Orchestrator",
      permissions: [
        "MANAGE_PRODUCTS",
        "MANAGE_ORDERS",
        "MANAGE_APPS",
        "MANAGE_SHIPPING",
        "MANAGE_CHECKOUTS",
        "MANAGE_CHANNELS",
      ] as unknown as AppManifest["permissions"],
      requiredSaleorVersion: ">=3.20 <4",
      supportUrl: "https://github.com/saleor/apps/discussions",
      tokenTargetUrl: `${apiBaseURL}/api/register`,
      version: packageJson.version,
      webhooks: [
        orderPaidWebhook.getWebhookManifest(apiBaseURL),
        orderCancelledWebhook.getWebhookManifest(apiBaseURL),
        orderRefundedWebhook.getWebhookManifest(apiBaseURL),
        shippingListWebhook.getWebhookManifest(apiBaseURL),
        shippingFilterWebhook.getWebhookManifest(apiBaseURL),
      ],
    };

    return manifest;
  },
});

export default handler;
