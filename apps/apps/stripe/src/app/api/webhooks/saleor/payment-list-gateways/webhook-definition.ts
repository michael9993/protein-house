import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next-app-router";

import { verifyWebhookSignature } from "@/app/api/webhooks/saleor/verify-signature";
import {
  PaymentListGatewaysDocument,
  PaymentListGatewaysEventFragment,
} from "@/generated/graphql";
import { saleorApp } from "@/lib/saleor-app";

export const paymentListGatewaysWebhookDefinition =
  new SaleorSyncWebhook<PaymentListGatewaysEventFragment>({
    apl: saleorApp.apl,
    event: "PAYMENT_LIST_GATEWAYS",
    name: "Stripe Payment List Gateways",
    isActive: true,
    query: PaymentListGatewaysDocument,
    webhookPath: "api/webhooks/saleor/payment-list-gateways",
    verifySignatureFn: (jwks, signature, rawBody) => {
      return verifyWebhookSignature(jwks, signature, rawBody);
    },
  });
