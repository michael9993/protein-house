import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";

import packageJson from "../../../package.json";

const handler = createManifestHandler({
  async manifestFactory({ appBaseUrl }) {
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;

    const manifest: AppManifest = {
      about: "Professional sales analytics dashboard with KPIs, charts, and multi-channel insights.",
      appUrl: iframeBaseUrl,
      author: "Saleor Commerce",
      brand: {
        logo: {
          default: `${apiBaseURL}/logo.png`,
        },
      },
      dataPrivacyUrl: "https://saleor.io/legal/privacy/",
      extensions: [
        // Main navigation entry - opens full dashboard in APP_PAGE (largest iframe)
        {
          label: "Sales Analytics",
          mount: "NAVIGATION_ORDERS",
          target: "APP_PAGE",
          permissions: [], // Extensions inherit permissions from app-level permissions
          url: "/",
        },
        // Widget on order details page
        {
          label: "Order Analytics",
          mount: "ORDER_DETAILS_WIDGETS",
          target: "WIDGET",
          permissions: [], // Extensions inherit permissions from app-level permissions
          url: "/widget/order-stats",
        },
      ],
      homepageUrl: "https://github.com/saleor/apps",
      id: "saleor.app.sales-analytics",
      name: "Sales Analytics",
      permissions: ["MANAGE_ORDERS", "MANAGE_PRODUCTS", "MANAGE_CHANNELS"],
      requiredSaleorVersion: ">=3.22 <4",
      supportUrl: "https://github.com/saleor/apps/discussions",
      tokenTargetUrl: `${apiBaseURL}/api/register`,
      version: packageJson.version,
      webhooks: [],
    };

    return manifest;
  },
});

export default handler;
