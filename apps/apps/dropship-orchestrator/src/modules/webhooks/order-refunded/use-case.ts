import { err, ok, Result } from "neverthrow";
import { Client, gql } from "urql";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken } from "@/modules/suppliers/types";
import {
  METADATA_KEY as RETURNS_KEY,
  type ReturnRequest,
  getAppMetadata as getReturnsAppMetadata,
  parseReturns,
  saveReturns,
  addTimelineEntry,
} from "@/modules/returns/returns-store";

const logger = createLogger("OrderRefundedUseCase");

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_ORDER_METADATA = gql`
  query FetchOrderMetadataForRefund($id: ID!) {
    order(id: $id) {
      id
      number
      metadata {
        key
        value
      }
    }
  }
`;

const UPDATE_ORDER_METADATA = gql`
  mutation UpdateOrderMetadataForRefund($id: ID!, $input: [MetadataInput!]!) {
    updateMetadata(id: $id, input: $input) {
      item {
        metadata {
          key
          value
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderRefundedPayload {
  order?: {
    id: string;
    number?: string;
    userEmail?: string;
  } | null;
}

interface UseCaseError {
  code: string;
  message: string;
}

interface DropshipMeta {
  status: string;
  suppliers?: Record<string, string>;
  forwardedAt?: string;
  totalCost?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Main Use Case
// ---------------------------------------------------------------------------

/**
 * ORDER_REFUNDED webhook handler business logic.
 *
 * 1. Fetch order metadata to find supplier order IDs
 * 2. If status is "forwarded" or "processing", call adapter.cancelOrder() for each supplier
 * 3. Update order metadata: dropship.status = "refunded"
 * 4. Log to audit trail
 */
export async function handleOrderRefunded(
  client: Client,
  payload: OrderRefundedPayload,
): Promise<Result<{ cancelledCount: number }, UseCaseError>> {
  const startTime = Date.now();

  if (!payload.order?.id) {
    logger.error("ORDER_REFUNDED payload missing order ID");
    return err({ code: "INVALID_PAYLOAD", message: "Missing order ID in payload" });
  }

  const orderId = payload.order.id;
  const orderNumber = payload.order.number ?? "unknown";

  logger.info("Processing ORDER_REFUNDED", { orderId, orderNumber });

  // ------------------------------------------------------------------
  // 1. Fetch order metadata
  // ------------------------------------------------------------------

  const { data, error: fetchError } = await client
    .query(FETCH_ORDER_METADATA, { id: orderId })
    .toPromise();

  if (fetchError || !data?.order) {
    logger.error("Failed to fetch order metadata", { orderId, error: fetchError?.message });
    return err({
      code: "FETCH_FAILED",
      message: `Failed to fetch order: ${fetchError?.message}`,
    });
  }

  const metadata: Array<{ key: string; value: string }> = data.order.metadata ?? [];
  const dropshipEntry = metadata.find((m: { key: string }) => m.key === "dropship");

  if (!dropshipEntry) {
    logger.info("Order has no dropship metadata — nothing to refund", { orderId });
    return ok({ cancelledCount: 0 });
  }

  let dropshipMeta: DropshipMeta;

  try {
    dropshipMeta = JSON.parse(dropshipEntry.value);
  } catch {
    logger.warn("Failed to parse dropship metadata", { orderId });
    return ok({ cancelledCount: 0 });
  }

  // Only attempt cancellation if the order was forwarded or still processing
  if (dropshipMeta.status !== "forwarded" && dropshipMeta.status !== "processing") {
    logger.info("Dropship order not in cancellable state — updating status only", {
      orderId,
      currentStatus: dropshipMeta.status,
    });

    await client
      .mutation(UPDATE_ORDER_METADATA, {
        id: orderId,
        input: [
          {
            key: "dropship",
            value: JSON.stringify({ ...dropshipMeta, status: "refunded", refundedAt: new Date().toISOString() }),
          },
        ],
      })
      .toPromise();

    return ok({ cancelledCount: 0 });
  }

  const suppliers = dropshipMeta.suppliers;

  if (!suppliers || Object.keys(suppliers).length === 0) {
    logger.info("No supplier orders found in metadata — marking as refunded", { orderId });

    await client
      .mutation(UPDATE_ORDER_METADATA, {
        id: orderId,
        input: [
          {
            key: "dropship",
            value: JSON.stringify({ ...dropshipMeta, status: "refunded", refundedAt: new Date().toISOString() }),
          },
        ],
      })
      .toPromise();

    return ok({ cancelledCount: 0 });
  }

  // ------------------------------------------------------------------
  // 2. Resolve app ID for credential lookups
  // ------------------------------------------------------------------

  const appId = await fetchAppId(client);

  if (!appId) {
    return err({ code: "APP_ID_MISSING", message: "Cannot resolve app ID" });
  }

  // ------------------------------------------------------------------
  // 3. Cancel each supplier order
  // ------------------------------------------------------------------

  let cancelledCount = 0;

  for (const [supplierId, supplierOrderId] of Object.entries(suppliers)) {
    const adapter = supplierRegistry.getAdapter(supplierId);

    if (!adapter) {
      logger.warn("No adapter for supplier — skipping cancellation", {
        supplierId,
        supplierOrderId,
      });

      await logAuditEvent(client, {
        type: "order_refunded",
        supplierId,
        orderId,
        action: `Skipped cancellation on refund — no adapter for ${supplierId}`,
        status: "skipped",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const creds = await getSupplierCredentials(client, appId, supplierId);

    if (!creds) {
      logger.warn("No credentials for supplier — skipping cancellation", {
        supplierId,
        supplierOrderId,
      });

      await logAuditEvent(client, {
        type: "order_refunded",
        supplierId,
        orderId,
        action: `Skipped cancellation on refund — no credentials for ${supplierId}`,
        status: "skipped",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const authToken: AuthToken = {
      accessToken: creds.accessToken ?? "",
      expiresAt: creds.tokenExpiresAt
        ? new Date(creds.tokenExpiresAt)
        : new Date(Date.now() + 86400_000),
      refreshToken: ("refreshToken" in creds ? creds.refreshToken : undefined) as
        | string
        | undefined,
    };

    const cancelStart = Date.now();
    const cancelResult = await adapter.cancelOrder(supplierOrderId, authToken);

    if (cancelResult.isOk()) {
      cancelledCount += 1;

      await logAuditEvent(client, {
        type: "order_refunded",
        supplierId,
        orderId,
        action: `Cancelled supplier order ${supplierOrderId} with ${supplierId} due to refund`,
        status: "success",
        duration: Date.now() - cancelStart,
        timestamp: new Date().toISOString(),
      });

      logger.info("Supplier order cancelled due to refund", { supplierId, supplierOrderId, orderId });
    } else {
      const error = cancelResult.error;

      await logAuditEvent(client, {
        type: "order_refunded",
        supplierId,
        orderId,
        action: `Failed to cancel supplier order ${supplierOrderId} with ${supplierId} on refund`,
        status: "failure",
        duration: Date.now() - cancelStart,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      logger.error("Failed to cancel supplier order on refund", {
        supplierId,
        supplierOrderId,
        orderId,
        error: error.message,
      });
    }
  }

  // ------------------------------------------------------------------
  // 4. Update order metadata
  // ------------------------------------------------------------------

  await client
    .mutation(UPDATE_ORDER_METADATA, {
      id: orderId,
      input: [
        {
          key: "dropship",
          value: JSON.stringify({
            ...dropshipMeta,
            status: "refunded",
            refundedAt: new Date().toISOString(),
          }),
        },
      ],
    })
    .toPromise();

  // ------------------------------------------------------------------
  // 5. Auto-create return request if configured
  // ------------------------------------------------------------------

  try {
    const { appId: returnsAppId, meta: returnsMeta } = await getReturnsAppMetadata(client);
    const returnsConfigRaw = returnsMeta["dropship-returns-config"];
    let autoCreateFromRefund = false;

    if (returnsConfigRaw) {
      try {
        const rc = JSON.parse(returnsConfigRaw);
        autoCreateFromRefund = rc.autoCreateFromRefund === true;
      } catch {
        // ignore parse errors
      }
    }

    if (autoCreateFromRefund && returnsAppId) {
      const existingReturns = parseReturns(returnsMeta[RETURNS_KEY]);
      const alreadyExists = existingReturns.some(
        (r) => r.orderId === orderId && r.status !== "rejected",
      );

      if (!alreadyExists) {
        const supplierName = Object.keys(suppliers)[0] ?? "unknown";
        const supplierOrderIdVal = Object.values(suppliers)[0] ?? "";
        const now = new Date().toISOString();

        let returnRequest: ReturnRequest = {
          id: `ret-${Date.now()}`,
          orderId,
          orderNumber,
          customerEmail: payload.order?.userEmail ?? "",
          reason: "Saleor refund issued",
          items: [{ productName: "Order refund", quantity: 1 }],
          status: "approved",
          supplier: supplierName,
          createdAt: now,
          updatedAt: now,
          supplierOrderId: supplierOrderIdVal,
          timeline: [],
        };

        returnRequest = addTimelineEntry(
          returnRequest,
          "Auto-created from Saleor ORDER_REFUNDED webhook",
          "system",
        );

        existingReturns.push(returnRequest);
        await saveReturns(client, returnsAppId, existingReturns);

        await logAuditEvent(client, {
          type: "return_created",
          orderId,
          action: `Auto-created return from ORDER_REFUNDED for order #${orderNumber}`,
          status: "success",
          timestamp: now,
        });

        logger.info("Auto-created return from refund", {
          returnId: returnRequest.id,
          orderId,
        });
      }
    }
  } catch (e) {
    // Auto-create should never block the main refund flow
    logger.error("Error auto-creating return from refund", {
      error: e instanceof Error ? e.message : String(e),
      orderId,
    });
  }

  const duration = Date.now() - startTime;
  logger.info("ORDER_REFUNDED processing complete", {
    orderId,
    cancelledCount,
    duration,
  });

  return ok({ cancelledCount });
}
