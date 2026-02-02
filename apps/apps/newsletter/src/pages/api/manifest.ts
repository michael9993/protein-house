import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import type { AppManifest } from "@saleor/app-sdk/types";

import packageJson from "../../../package.json";

const handler = createManifestHandler({
  async manifestFactory({ appBaseUrl }) {
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;

    const manifest: AppManifest = {
      about: "Manage newsletter subscribers, create email templates, and schedule promotional campaigns.",
      appUrl: iframeBaseUrl,
      author: "Saleor Commerce",
      brand: {
        logo: {
          default: `${apiBaseURL}/logo.png`,
        },
      },
      dataPrivacyUrl: "https://saleor.io/legal/privacy/",
      extensions: [],
      homepageUrl: "https://github.com/saleor/apps",
      id: "saleor.app.newsletter",
      name: "Newsletter Management",
      permissions: ["MANAGE_APPS", "MANAGE_USERS"] as unknown as AppManifest["permissions"],
      requiredSaleorVersion: ">=3.20 <4",
      supportUrl: "https://github.com/saleor/apps/discussions",
      tokenTargetUrl: `${apiBaseURL}/api/register`,
      version: packageJson.version,
      webhooks: [],
    };

    return manifest;
  },
});

export default handler;
