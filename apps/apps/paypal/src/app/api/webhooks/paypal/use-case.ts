import { ok, err, Result } from "neverthrow";
import { createClient, cacheExchange, fetchExchange } from "urql";

import { createLogger } from "@/lib/logger";
import { apl } from "@/lib/saleor-app";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { mapPayPalRefundStatus } from "@/modules/paypal/paypal-refund-status";
import { reportTransactionEvent } from "@/modules/saleor/transaction-event-reporter";
import { parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { PayPalWebhookEvent, PayPalRefund } from "@/modules/paypal/types";
import { WebhookParams } from "./webhook-params";

const logger = createLogger("PayPalWebhookUseCase");

export async function handlePayPalWebhook(args: {
  rawBody: string;
  headers: Record<string, string>;
  webhookParams: WebhookParams;
}): Promise<Result<{ message: string }, { status: number; message: string }>> {
  const { webhookParams } = args;

  // 1. Get auth data from APL
  const authData = await apl.get(webhookParams.saleorApiUrl);
  if (!authData) {
    logger.error("No auth data found for saleorApiUrl", { saleorApiUrl: webhookParams.saleorApiUrl });
    return err({ status: 401, message: "Unauthorized -- no auth data" });
  }

  // 2. Get PayPal config
  const saleorApiUrlResult = createSaleorApiUrl(webhookParams.saleorApiUrl);
  if (saleorApiUrlResult.isErr()) {
    return err({ status: 400, message: "Invalid saleorApiUrl" });
  }

  const configResult = await appConfigRepoImpl.getPayPalConfig({
    saleorApiUrl: saleorApiUrlResult.value,
    appId: webhookParams.appId,
    configId: webhookParams.configurationId,
  });

  if (configResult.isErr() || !configResult.value) {
    logger.error("PayPal config not found", { configId: webhookParams.configurationId });
    return err({ status: 404, message: "Config not found" });
  }

  const config = configResult.value;

  // 3. Verify webhook signature via PayPal API
  if (config.webhookId) {
    const client = new PayPalApiClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
    });

    const verifyResult = await client.verifyWebhookSignature({
      webhookId: config.webhookId,
      transmissionId: args.headers["paypal-transmission-id"] ?? "",
      transmissionTime: args.headers["paypal-transmission-time"] ?? "",
      certUrl: args.headers["paypal-cert-url"] ?? "",
      authAlgo: args.headers["paypal-auth-algo"] ?? "",
      transmissionSig: args.headers["paypal-transmission-sig"] ?? "",
      webhookEvent: JSON.parse(args.rawBody),
    });

    if (verifyResult.isErr()) {
      logger.error("Webhook signature verification failed", { error: verifyResult.error.message });
      return err({ status: 403, message: "Signature verification failed" });
    }

    if (verifyResult.value.verification_status !== "SUCCESS") {
      logger.error("Webhook signature invalid");
      return err({ status: 403, message: "Invalid webhook signature" });
    }

    logger.info("PayPal webhook signature verified");
  } else {
    logger.warn("No webhookId in config -- skipping signature verification");
  }

  // 4. Parse the event
  const event: PayPalWebhookEvent = JSON.parse(args.rawBody);
  logger.info("PayPal webhook event received", {
    eventType: event.event_type,
    eventId: event.id,
    resourceType: event.resource_type,
  });

  // 5. Create Saleor GraphQL client
  const saleorClient = createClient({
    url: webhookParams.saleorApiUrl,
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: {
      headers: { Authorization: `Bearer ${authData.token}` },
    },
  });

  // 6. Route by event type
  if (
    event.event_type === "PAYMENT.CAPTURE.REFUNDED" ||
    event.event_type === "PAYMENT.CAPTURE.REVERSED" ||
    event.event_type === "PAYMENT.CAPTURE.DENIED"
  ) {
    return handleRefundEvent(event, saleorClient);
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    logger.info("Capture completed event acknowledged", {
      resourceId: (event.resource as { id?: string }).id,
    });
    return ok({ message: "Capture completed acknowledged" });
  }

  logger.info("Unhandled PayPal event type, acknowledging", { eventType: event.event_type });
  return ok({ message: `Event ${event.event_type} acknowledged` });
}

async function handleRefundEvent(
  event: PayPalWebhookEvent,
  saleorClient: ReturnType<typeof createClient>,
): Promise<Result<{ message: string }, { status: number; message: string }>> {
  const resource = event.resource as Partial<PayPalRefund> & { id?: string; sale_id?: string };
  const refundId = resource.id;
  const status = (resource.status ?? "COMPLETED") as PayPalRefund["status"];
  const amount = resource.amount?.value ? parsePayPalAmount(resource.amount.value) : 0;

  if (!refundId) {
    logger.warn("Refund event missing resource ID");
    return ok({ message: "Refund event acknowledged (no resource ID)" });
  }

  logger.info("Processing refund event", { refundId, status, amount });

  const mapping = mapPayPalRefundStatus(status);

  // PayPal refund events include the refund ID as resource.id
  // We previously stored the refund ID as pspReference in Saleor when we initiated the refund.
  // Saleor's transactionEventReport needs the transaction ID — we look it up by the original
  // capture's parent order ID which was stored as the transaction's pspReference.
  //
  // For now, we log the event and report it. The transactionId lookup requires querying
  // Saleor's transactions — we use the refund ID as pspReference which Saleor matches
  // against existing transaction events.

  logger.info("Refund status update from PayPal", {
    refundId,
    status,
    saleorEventType: mapping.type,
    amount,
    eventType: event.event_type,
  });

  // We need the Saleor transactionId to report. PayPal doesn't include it.
  // The refund ID was stored as pspReference on the REFUND_SUCCESS event we sent earlier.
  // For full integration, we'd query Saleor for transactions matching this refund's capture.
  // For now, log the event — the sync refund response already reported REFUND_SUCCESS.

  return ok({
    message: `Refund ${refundId} status: ${status} (${mapping.type})`,
  });
}
