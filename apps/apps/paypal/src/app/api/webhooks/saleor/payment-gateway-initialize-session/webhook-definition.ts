import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next-app-router";

import {
  PaymentGatewayInitializeSessionDocument,
  PaymentGatewayInitializeSessionEventFragment,
} from "@/generated/graphql";
import { saleorApp } from "@/lib/saleor-app";

import { verifyWebhookSignature } from "../verify-signature";

export const paymentGatewayInitializeSessionWebhookDefinition =
  new SaleorSyncWebhook<PaymentGatewayInitializeSessionEventFragment>({
    apl: saleorApp.apl,
    event: "PAYMENT_GATEWAY_INITIALIZE_SESSION",
    name: "PayPal Payment Gateway Initialize Session",
    isActive: true,
    query: PaymentGatewayInitializeSessionDocument,
    webhookPath: "api/webhooks/saleor/payment-gateway-initialize-session",
    verifySignatureFn: (jwks, signature, rawBody) => {
      return verifyWebhookSignature(jwks, signature, rawBody);
    },
  });
