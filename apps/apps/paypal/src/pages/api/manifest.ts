import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppManifest } from "@saleor/app-sdk/types";

import { paymentGatewayInitializeSessionWebhookDefinition } from "@/app/api/webhooks/saleor/payment-gateway-initialize-session/webhook-definition";
import { paymentListGatewaysWebhookDefinition } from "@/app/api/webhooks/saleor/payment-list-gateways/webhook-definition";
import { transactionCancelationRequestedWebhookDefinition } from "@/app/api/webhooks/saleor/transaction-cancelation-requested/webhook-definition";
import { transactionChargeRequestedWebhookDefinition } from "@/app/api/webhooks/saleor/transaction-charge-requested/webhook-definition";
import { transactionInitializeSessionWebhookDefinition } from "@/app/api/webhooks/saleor/transaction-initialize-session/webhook-definition";
import { transactionProcessSessionWebhookDefinition } from "@/app/api/webhooks/saleor/transaction-process-session/webhook-definition";
import { transactionRefundRequestedWebhookDefinition } from "@/app/api/webhooks/saleor/transaction-refund-requested/webhook-definition";

export default createManifestHandler({
  async manifestFactory({ appBaseUrl }) {
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseUrl = process.env.APP_API_BASE_URL ?? appBaseUrl;

    const manifest: AppManifest = {
      id: process.env.MANIFEST_APP_ID ?? "saleor.app.payment.paypal",
      version: "1.0.0",
      name: process.env.APP_NAME ?? "PayPal",
      about:
        "App that allows merchants to accept online payments using PayPal Commerce Platform, supporting PayPal, credit/debit cards, and local payment methods.",
      permissions: ["HANDLE_PAYMENTS"] as unknown as AppManifest["permissions"],
      appUrl: iframeBaseUrl,
      configurationUrl: `${iframeBaseUrl}/`,
      tokenTargetUrl: `${apiBaseUrl}/api/register`,
      dataPrivacyUrl: "https://www.paypal.com/privacy-center",
      supportUrl: "https://developer.paypal.com/support",
      homepageUrl: "https://developer.paypal.com",
      brand: {
        logo: {
          default: `${apiBaseUrl}/logo.png`,
        },
      },
      webhooks: [
        paymentListGatewaysWebhookDefinition.getWebhookManifest(apiBaseUrl),
        paymentGatewayInitializeSessionWebhookDefinition.getWebhookManifest(apiBaseUrl),
        transactionInitializeSessionWebhookDefinition.getWebhookManifest(apiBaseUrl),
        transactionProcessSessionWebhookDefinition.getWebhookManifest(apiBaseUrl),
        transactionChargeRequestedWebhookDefinition.getWebhookManifest(apiBaseUrl),
        transactionCancelationRequestedWebhookDefinition.getWebhookManifest(apiBaseUrl),
        transactionRefundRequestedWebhookDefinition.getWebhookManifest(apiBaseUrl),
      ],
      extensions: [],
    };

    return manifest;
  },
});
