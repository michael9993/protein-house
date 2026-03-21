import { ok, err, Result } from "neverthrow";

import { createLogger } from "@/lib/logger";
import { PayPalApiClient } from "./paypal-api-client";
import { PayPalApiError } from "./paypal-api-error";
import { buildPayPalWebhookUrl, PayPalWebhookUrlParams } from "./paypal-webhook-url-builder";

const logger = createLogger("PayPalWebhookManager");

/**
 * Events we want PayPal to notify us about.
 * Full list: https://developer.paypal.com/api/rest/webhooks/event-names/
 * Using checkout order events (v2 Orders API) + capture events.
 */
export const PAYPAL_WEBHOOK_EVENTS = [
  "CHECKOUT.ORDER.COMPLETED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "PAYMENT.CAPTURE.DECLINED",
];

export async function createPayPalWebhook(
  client: PayPalApiClient,
  appBaseUrl: string,
  params: PayPalWebhookUrlParams,
): Promise<Result<{ webhookId: string }, PayPalApiError>> {
  const webhookUrl = buildPayPalWebhookUrl(appBaseUrl, params);

  logger.info("Creating PayPal webhook", { webhookUrl, events: PAYPAL_WEBHOOK_EVENTS });

  // First, clean up any existing webhooks pointing to our URL
  const listResult = await client.listWebhooks();
  if (listResult.isOk()) {
    for (const existing of listResult.value.webhooks) {
      if (existing.url.includes("/api/webhooks/paypal")) {
        logger.info("Removing existing PayPal webhook", { id: existing.id, url: existing.url });
        await client.deleteWebhook(existing.id);
      }
    }
  }

  const result = await client.createWebhook(webhookUrl, PAYPAL_WEBHOOK_EVENTS);

  if (result.isErr()) {
    logger.error("Failed to create PayPal webhook", {
      error: result.error.message,
      webhookUrl,
      events: PAYPAL_WEBHOOK_EVENTS,
    });
    return err(result.error);
  }

  logger.info("PayPal webhook created", { webhookId: result.value.id });
  return ok({ webhookId: result.value.id });
}

export async function deletePayPalWebhook(
  client: PayPalApiClient,
  webhookId: string,
): Promise<Result<void, PayPalApiError>> {
  logger.info("Deleting PayPal webhook", { webhookId });
  return client.deleteWebhook(webhookId);
}
