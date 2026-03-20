import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next-app-router";

import {
  TransactionInitializeSessionDocument,
  TransactionInitializeSessionEventFragment,
} from "@/generated/graphql";
import { saleorApp } from "@/lib/saleor-app";

import { verifyWebhookSignature } from "../verify-signature";

export const transactionInitializeSessionWebhookDefinition =
  new SaleorSyncWebhook<TransactionInitializeSessionEventFragment>({
    apl: saleorApp.apl,
    event: "TRANSACTION_INITIALIZE_SESSION",
    name: "PayPal Transaction Initialize Session",
    isActive: true,
    query: TransactionInitializeSessionDocument,
    webhookPath: "api/webhooks/saleor/transaction-initialize-session",
    verifySignatureFn: (jwks, signature, rawBody) => {
      return verifyWebhookSignature(jwks, signature, rawBody);
    },
  });
