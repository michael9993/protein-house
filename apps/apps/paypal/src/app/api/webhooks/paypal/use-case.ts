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
import { generatePayPalOrderUrl } from "@/modules/paypal/generate-paypal-dashboard-urls";
import { PayPalWebhookEvent, PayPalRefund } from "@/modules/paypal/types";
import { transactionRecorder } from "@/modules/transactions-recording";
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
    return handleRefundEvent(event, saleorClient, { environment: config.environment });
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const captureResource = event.resource as { id?: string; amount?: { value: string; currency_code: string } };
    logger.info("Capture completed event from PayPal", {
      captureId: captureResource.id,
      amount: captureResource.amount?.value,
    });
    // Capture events from PayPal confirm charges already initiated from our side.
    // Saleor already knows about these since we report CHARGE_SUCCESS synchronously.
    return ok({ message: "Capture completed acknowledged" });
  }

  logger.info("Unhandled PayPal event type, acknowledging", { eventType: event.event_type });
  return ok({ message: `Event ${event.event_type} acknowledged` });
}

async function handleRefundEvent(
  event: PayPalWebhookEvent,
  saleorClient: ReturnType<typeof createClient>,
  config: { environment: "SANDBOX" | "LIVE" },
): Promise<Result<{ message: string }, { status: number; message: string }>> {
  const resource = event.resource as Partial<PayPalRefund> & {
    id?: string;
    sale_id?: string;
    links?: Array<{ href: string; rel: string }>;
  };
  const refundId = resource.id;
  const status = (resource.status ?? "COMPLETED") as PayPalRefund["status"];
  const amount = resource.amount?.value ? parsePayPalAmount(resource.amount.value) : 0;

  if (!refundId) {
    logger.warn("Refund event missing resource ID");
    return ok({ message: "Refund event acknowledged (no resource ID)" });
  }

  logger.info("Processing refund event", { refundId, status, amount });

  const mapping = mapPayPalRefundStatus(status);

  // Look up the Saleor transactionId from our recorded transactions.
  // Strategy: extract capture ID from the refund's "up" link, then find the CHARGE recording.
  let saleorTransactionId: string | undefined;

  // First, try to extract capture ID from PayPal's links (most reliable)
  const captureLink = resource.links?.find((l) => l.rel === "up");
  if (captureLink) {
    const captureMatch = captureLink.href.match(/captures\/([A-Z0-9]+)/);
    if (captureMatch) {
      const captureId = captureMatch[1];
      logger.info("Extracted capture ID from refund links", { captureId, refundId });
      try {
        const byCapture = await transactionRecorder.getByPaypalCaptureId(captureId);
        if (byCapture.length > 0) {
          saleorTransactionId = byCapture[0].saleorTransactionId;
          logger.info("Found Saleor transaction via capture ID", { captureId, saleorTransactionId });
        }
      } catch (e) {
        logger.warn("Failed capture ID lookup", { captureId, error: e });
      }
    }
  }

  // Fallback: try looking up by refund ID (if we recorded a refund event earlier)
  if (!saleorTransactionId) {
    try {
      const recorded = await transactionRecorder.getByPaypalOrderId(refundId);
      if (recorded.length > 0) {
        saleorTransactionId = recorded[0].saleorTransactionId;
      }
    } catch (e) {
      logger.warn("Failed refund ID lookup", { refundId, error: e });
    }
  }

  if (!saleorTransactionId) {
    logger.warn("Cannot find Saleor transactionId for refund — event acknowledged but not reported", {
      refundId,
      status,
    });
    return ok({
      message: `Refund ${refundId} status: ${status} — no matching Saleor transaction found`,
    });
  }

  const isSandbox = config.environment === "SANDBOX";
  const externalUrl = generatePayPalOrderUrl(refundId, isSandbox);

  logger.info("Reporting refund status to Saleor", {
    refundId,
    status,
    saleorTransactionId,
    saleorEventType: mapping.type,
    amount,
  });

  const reportResult = await reportTransactionEvent(saleorClient, {
    transactionId: saleorTransactionId,
    type: mapping.type as any,
    message: mapping.message,
    pspReference: refundId,
    amount,
    time: new Date().toISOString(),
    availableActions: mapping.availableActions as any[],
    externalUrl,
  });

  if (reportResult.isErr()) {
    logger.error("Failed to report refund to Saleor", {
      error: reportResult.error.message,
      refundId,
      saleorTransactionId,
    });
    return ok({
      message: `Refund ${refundId} acknowledged but Saleor report failed: ${reportResult.error.message}`,
    });
  }

  const { alreadyProcessed } = reportResult.value;
  logger.info("Refund reported to Saleor", {
    refundId,
    status,
    alreadyProcessed,
  });

  return ok({
    message: `Refund ${refundId} status: ${status} → reported to Saleor (${mapping.type})${alreadyProcessed ? " [already processed]" : ""}`,
  });
}
