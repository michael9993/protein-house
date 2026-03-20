import { SaleorSyncWebhook, SyncWebhookEventType } from "@saleor/app-sdk/handlers/next-app-router";

import {
  PaymentListGatewaysDocument,
  PaymentListGatewaysEventFragment,
} from "@/generated/graphql";
import { saleorApp } from "@/lib/saleor-app";

import { verifyWebhookSignature } from "../verify-signature";

export const paymentListGatewaysWebhookDefinition =
  new SaleorSyncWebhook<PaymentListGatewaysEventFragment>({
    apl: saleorApp.apl,
    event: "PAYMENT_LIST_GATEWAYS" as SyncWebhookEventType,
    name: "PayPal Payment List Gateways",
    isActive: true,
    query: PaymentListGatewaysDocument,
    webhookPath: "api/webhooks/saleor/payment-list-gateways",
    verifySignatureFn: (jwks, signature, rawBody) => {
      return verifyWebhookSignature(jwks, signature, rawBody);
    },
  });
