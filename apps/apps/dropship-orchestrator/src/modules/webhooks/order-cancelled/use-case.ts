import { err, ok, Result } from "neverthrow";
import { Client, gql } from "urql";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken } from "@/modules/suppliers/types";

const logger = createLogger("OrderCancelledUseCase");

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_ORDER_METADATA = gql`
  query FetchOrderMetadataForCancel($id: ID!) {
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
  mutation UpdateOrderMetadataForCancel($id: ID!, $input: [MetadataInput!]!) {
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

export interface OrderCancelledPayload {
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
 * ORDER_CANCELLED webhook handler business logic.
 *
 * 1. Fetch order metadata to find supplier order IDs
 * 2. For each supplier order, call adapter.cancelOrder()
 * 3. Update order metadata: dropship.status = "cancelled"
 * 4. Log to audit trail
 */
export async function handleOrderCancelled(
  client: Client,
  payload: OrderCancelledPayload,
): Promise<Result<{ cancelledCount: number }, UseCaseError>> {
  const startTime = Date.now();

  if (!payload.order?.id) {
    logger.error("ORDER_CANCELLED payload missing order ID");
    return err({ code: "INVALID_PAYLOAD", message: "Missing order ID in payload" });
  }

  const orderId = payload.order.id;
  const orderNumber = payload.order.number ?? "unknown";

  logger.info("Processing ORDER_CANCELLED", { orderId, orderNumber });

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
    logger.info("Order has no dropship metadata — nothing to cancel", { orderId });
    return ok({ cancelledCount: 0 });
  }

  let dropshipMeta: DropshipMeta;

  try {
    dropshipMeta = JSON.parse(dropshipEntry.value);
  } catch {
    logger.warn("Failed to parse dropship metadata", { orderId });
    return ok({ cancelledCount: 0 });
  }

  const suppliers = dropshipMeta.suppliers;

  if (!suppliers || Object.keys(suppliers).length === 0) {
    logger.info("No supplier orders found in metadata — nothing to cancel", { orderId });

    // Still update status to cancelled
    await client
      .mutation(UPDATE_ORDER_METADATA, {
        id: orderId,
        input: [
          {
            key: "dropship",
            value: JSON.stringify({ ...dropshipMeta, status: "cancelled" }),
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
        type: "order_cancelled",
        supplierId,
        orderId,
        action: `Skipped cancellation — no adapter for ${supplierId}`,
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
        type: "order_cancelled",
        supplierId,
        orderId,
        action: `Skipped cancellation — no credentials for ${supplierId}`,
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
        type: "order_cancelled",
        supplierId,
        orderId,
        action: `Cancelled supplier order ${supplierOrderId} with ${supplierId}`,
        status: "success",
        duration: Date.now() - cancelStart,
        timestamp: new Date().toISOString(),
      });

      logger.info("Supplier order cancelled", { supplierId, supplierOrderId, orderId });
    } else {
      const error = cancelResult.error;

      await logAuditEvent(client, {
        type: "order_cancelled",
        supplierId,
        orderId,
        action: `Failed to cancel supplier order ${supplierOrderId} with ${supplierId}`,
        status: "failure",
        duration: Date.now() - cancelStart,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      logger.error("Failed to cancel supplier order", {
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
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
          }),
        },
      ],
    })
    .toPromise();

  const duration = Date.now() - startTime;
  logger.info("ORDER_CANCELLED processing complete", {
    orderId,
    cancelledCount,
    duration,
  });

  return ok({ cancelledCount });
}
