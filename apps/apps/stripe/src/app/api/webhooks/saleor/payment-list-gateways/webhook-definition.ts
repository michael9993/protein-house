import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next-app-router";

import { verifyWebhookSignature } from "@/app/api/webhooks/saleor/verify-signature";
import {
  PaymentListGatewaysDocument,
  PaymentListGatewaysEventFragment,
} from "@/generated/graphql";
import { saleorApp } from "@/lib/saleor-app";

type SyncWebhookEventType = ConstructorParameters<typeof SaleorSyncWebhook>[0]["event"];

export const paymentListGatewaysWebhookDefinition =
  new SaleorSyncWebhook<PaymentListGatewaysEventFragment>({
    apl: saleorApp.apl,
    event: "PAYMENT_LIST_GATEWAYS" as unknown as SyncWebhookEventType,
    name: "Stripe Payment List Gateways",
    isActive: true,
    query: PaymentListGatewaysDocument,
    webhookPath: "api/webhooks/saleor/payment-list-gateways",
    verifySignatureFn: (jwks, signature, rawBody) => {
      return verifyWebhookSignature(jwks, signature, rawBody);
    },
  });
