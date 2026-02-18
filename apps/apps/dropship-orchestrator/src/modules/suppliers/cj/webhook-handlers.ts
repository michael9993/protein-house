import { err, ok, Result } from "neverthrow";

import { createLogger } from "@/logger";

import { SupplierError } from "../errors";
import type { StockInfo, SupplierOrderStatus, TrackingInfo } from "../types";
import { SupplierOrderStatusEnum } from "../types";
import {
  CJWebhookMessageType,
  CJWebhookPayloadSchema,
  type CJWebhookPayload,
} from "./types";

const logger = createLogger("CJWebhookHandlers");

// ---------------------------------------------------------------------------
// Message deduplication
// ---------------------------------------------------------------------------

/**
 * In-memory LRU set of processed message IDs for deduplication.
 * In production this should be backed by Redis or a database, but for the
 * adapter layer an in-memory set with a max size provides baseline protection.
 */
const MAX_PROCESSED_IDS = 10_000;
const processedMessageIds = new Set<string>();
const insertionOrder: string[] = [];

function isAlreadyProcessed(messageId: string): boolean {
  return processedMessageIds.has(messageId);
}

function markAsProcessed(messageId: string): void {
  if (processedMessageIds.has(messageId)) {
    return;
  }

  processedMessageIds.add(messageId);
  insertionOrder.push(messageId);

  // Evict oldest entries when we exceed max size
  while (insertionOrder.length > MAX_PROCESSED_IDS) {
    const oldest = insertionOrder.shift();

    if (oldest) {
      processedMessageIds.delete(oldest);
    }
  }
}

/** Clear the deduplication cache — primarily for testing. */
export function resetDeduplicationCache(): void {
  processedMessageIds.clear();
  insertionOrder.length = 0;
}

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

function validatePayload(
  raw: unknown,
): Result<CJWebhookPayload, SupplierError> {
  const parsed = CJWebhookPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    logger.error("Invalid CJ webhook payload", {
      errors: parsed.error.flatten(),
    });

    return err(
      SupplierError.invalidRequest("cj", "Invalid webhook payload structure", {
        rawResponse: parsed.error.flatten(),
      }),
    );
  }

  return ok(parsed.data);
}

// ---------------------------------------------------------------------------
// Order Status Webhook
// ---------------------------------------------------------------------------

/**
 * Handle CJ order-status-change webhook events.
 *
 * Expected params shape:
 * ```
 * {
 *   orderId: string;
 *   orderStatus: string;   // CJ status enum value
 *   orderNum?: string;
 *   trackNumber?: string;
 * }
 * ```
 */
export async function handleOrderWebhook(
  payload: unknown,
): Promise<Result<void, SupplierError>> {
  const validationResult = validatePayload(payload);

  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const data = validationResult.value;

  // Deduplication
  if (isAlreadyProcessed(data.messageId)) {
    logger.info("Duplicate CJ order webhook — skipping", {
      messageId: data.messageId,
    });
    return ok(undefined);
  }

  if (data.messageType !== CJWebhookMessageType.ORDER_STATUS) {
    return err(
      SupplierError.invalidRequest("cj", `Unexpected message type: ${data.messageType}`, {
        rawResponse: data,
      }),
    );
  }

  const params = data.params as Record<string, unknown>;
  const orderId = params.orderId as string | undefined;
  const orderStatus = params.orderStatus as string | undefined;

  if (!orderId || !orderStatus) {
    return err(
      SupplierError.invalidRequest(
        "cj",
        "Order webhook missing required params (orderId, orderStatus)",
        { rawResponse: data },
      ),
    );
  }

  logger.info("Processing CJ order webhook", {
    messageId: data.messageId,
    orderId,
    orderStatus,
  });

  // Mark as processed after successful validation
  markAsProcessed(data.messageId);

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Logistics (Tracking) Webhook
// ---------------------------------------------------------------------------

/**
 * Handle CJ logistics-update webhook events.
 *
 * Expected params shape:
 * ```
 * {
 *   orderId: string;
 *   trackNumber: string;
 *   logisticName: string;
 *   logisticUrl?: string;
 *   trackInfoList?: Array<{ date: string; info: string; location?: string }>;
 * }
 * ```
 */
export async function handleLogisticsWebhook(
  payload: unknown,
): Promise<Result<TrackingInfo, SupplierError>> {
  const validationResult = validatePayload(payload);

  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const data = validationResult.value;

  // Deduplication
  if (isAlreadyProcessed(data.messageId)) {
    logger.info("Duplicate CJ logistics webhook — skipping", {
      messageId: data.messageId,
    });

    // Return a minimal tracking info for idempotent processing
    return ok({
      trackingNumber: "",
      carrier: "Unknown",
      status: SupplierOrderStatusEnum.SHIPPED,
      events: [],
    });
  }

  if (data.messageType !== CJWebhookMessageType.LOGISTICS_UPDATE) {
    return err(
      SupplierError.invalidRequest("cj", `Unexpected message type: ${data.messageType}`, {
        rawResponse: data,
      }),
    );
  }

  const params = data.params as Record<string, unknown>;
  const trackNumber = params.trackNumber as string | undefined;
  const logisticName = params.logisticName as string | undefined;

  if (!trackNumber) {
    return err(
      SupplierError.invalidRequest(
        "cj",
        "Logistics webhook missing required param (trackNumber)",
        { rawResponse: data },
      ),
    );
  }

  const rawEvents = (params.trackInfoList as Array<Record<string, unknown>> | undefined) ?? [];

  const events = rawEvents.map((evt) => ({
    timestamp: new Date(String(evt.date ?? "")),
    description: String(evt.info ?? ""),
    location: evt.location ? String(evt.location) : undefined,
  }));

  // Sort events newest-first
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Determine status from latest event
  let status: SupplierOrderStatus = SupplierOrderStatusEnum.SHIPPED;

  if (events.length > 0) {
    const latestDesc = events[0].description.toLowerCase();

    if (latestDesc.includes("delivered") || latestDesc.includes("signed")) {
      status = SupplierOrderStatusEnum.DELIVERED;
    }
  }

  const trackingInfo: TrackingInfo = {
    trackingNumber: trackNumber,
    carrier: logisticName ?? "Unknown",
    trackingUrl: params.logisticUrl ? String(params.logisticUrl) : undefined,
    status,
    events,
  };

  logger.info("Processed CJ logistics webhook", {
    messageId: data.messageId,
    trackingNumber: trackNumber,
    eventsCount: events.length,
  });

  markAsProcessed(data.messageId);

  return ok(trackingInfo);
}

// ---------------------------------------------------------------------------
// Stock Change Webhook
// ---------------------------------------------------------------------------

/**
 * Handle CJ stock-change webhook events.
 *
 * Expected params shape:
 * ```
 * {
 *   vid: string;
 *   stock: number;
 *   variantNameEn?: string;
 * }
 * ```
 */
export async function handleStockWebhook(
  payload: unknown,
): Promise<Result<StockInfo, SupplierError>> {
  const validationResult = validatePayload(payload);

  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const data = validationResult.value;

  // Deduplication
  if (isAlreadyProcessed(data.messageId)) {
    logger.info("Duplicate CJ stock webhook — skipping", {
      messageId: data.messageId,
    });

    // Return a placeholder for idempotent processing
    return ok({
      supplierSku: "",
      available: false,
      quantity: 0,
      updatedAt: new Date(),
    });
  }

  if (data.messageType !== CJWebhookMessageType.STOCK_CHANGE) {
    return err(
      SupplierError.invalidRequest("cj", `Unexpected message type: ${data.messageType}`, {
        rawResponse: data,
      }),
    );
  }

  const params = data.params as Record<string, unknown>;
  const vid = params.vid as string | undefined;
  const stock = params.stock as number | undefined;

  if (!vid || stock === undefined || stock === null) {
    return err(
      SupplierError.invalidRequest(
        "cj",
        "Stock webhook missing required params (vid, stock)",
        { rawResponse: data },
      ),
    );
  }

  const stockQuantity = typeof stock === "number" ? stock : parseInt(String(stock), 10);

  const stockInfo: StockInfo = {
    supplierSku: vid,
    available: stockQuantity > 0,
    quantity: isNaN(stockQuantity) ? 0 : stockQuantity,
    updatedAt: new Date(),
  };

  logger.info("Processed CJ stock webhook", {
    messageId: data.messageId,
    vid,
    stock: stockQuantity,
  });

  markAsProcessed(data.messageId);

  return ok(stockInfo);
}
