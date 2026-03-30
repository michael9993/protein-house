import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";
import { withSpanAttributes } from "@saleor/apps-otel/src/with-span-attributes";

import packageJson from "../../../package.json";
import { invoiceRequestedWebhookDefinition } from "./webhooks/invoice-requested-definition";

export default withSpanAttributes(
  createManifestHandler({
    async manifestFactory({ appBaseUrl }) {
      const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
      const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;

      const manifest: AppManifest = {
        about:
          "Invoice App generates PDF invoices for orders when requested. It handles INVOICE_REQUESTED webhooks and creates invoice PDFs.",
        appUrl: iframeBaseUrl,
        author: "Saleor Commerce",
        brand: {
          logo: {
            default: `${apiBaseURL}/logo.png`,
          },
        },
        dataPrivacyUrl: "https://saleor.io/legal/privacy/",
        extensions: [],
        webhooks: [invoiceRequestedWebhookDefinition.getWebhookManifest(apiBaseURL)],
        homepageUrl: "https://github.com/saleor/apps",
        id: "saleor.app.invoices",
        name: "Invoices",
        permissions: ["MANAGE_ORDERS"],
        requiredSaleorVersion: ">=3.20 <4",
        supportUrl: "https://github.com/saleor/apps/discussions",
        tokenTargetUrl: `${apiBaseURL}/api/register`,
        version: packageJson.version,
      };

      return manifest;
    },
  }),
);

