import type { NextApiRequest, NextApiResponse } from "next";
import { gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { getRedisConnection } from "@/modules/jobs/queues";
import { withCJWebhookAuth } from "@/modules/webhooks/cj/shared";

const logger = createLogger("webhook:cj:order");

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const CJOrderWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("ORDER"),
  messageType: z.string().optional(),
  params: z.object({
    cjOrderId: z.string().min(1),
    orderNumber: z.string().optional(),
    orderStatus: z.string().min(1),
    logisticName: z.string().optional(),
    trackNumber: z.string().nullable().optional(),
    trackingUrl: z.string().nullable().optional(),
    createDate: z.string().optional(),
    updateDate: z.string().optional(),
    payDate: z.string().nullable().optional(),
    deliveryDate: z.string().nullable().optional(),
    completeDate: z.string().nullable().optional(),
  }),
});

type CJOrderWebhookPayload = z.infer<typeof CJOrderWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// CJ status -> Saleor dropship status mapping
// ---------------------------------------------------------------------------

const CJ_STATUS_MAP: Record<string, string> = {
  CREATED: "forwarded",
  IN_CART: "forwarded",
  UNPAID: "forwarded",
  UNSHIPPED: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "supplier_cancelled",
  OTHER: "forwarded",
};

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FIND_ORDER_BY_ID = gql`
  query FindOrderById($id: ID!) {
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

const SEARCH_ORDERS_BY_METADATA = gql`
  query SearchOrdersByMetadata($first: Int!) {
    orders(first: $first, sortBy: { field: CREATED_AT, direction: DESC }) {
      edges {
        node {
          id
          number
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;

const UPDATE_ORDER_METADATA = gql`
  mutation UpdateOrderMetadataFromCJ($id: ID!, $input: [MetadataInput!]!) {
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

const FETCH_ORDER_LINES = gql`
  query FetchOrderLinesForFulfillment($id: ID!) {
    order(id: $id) {
      status
      lines {
        id
        quantity
        variant {
          id
        }
      }
      fulfillments {
        id
        status
      }
    }
  }
`;

const FETCH_WAREHOUSES = gql`
  query FetchWarehousesForCJOrder($first: Int!) {
    warehouses(first: $first) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const CREATE_FULFILLMENT = gql`
  mutation CreateFulfillmentFromCJOrder($orderId: ID!, $input: OrderFulfillInput!) {
    orderFulfill(order: $orderId, input: $input) {
      fulfillments {
        id
        status
        trackingNumber
      }
      errors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Parse payload first to get messageId for dedup
  const parseResult = CJOrderWebhookPayloadSchema.safeParse(req.body);

  if (req.method === "POST" && !parseResult.success) {
    logger.warn("CJ order webhook: invalid payload", {
      errors: parseResult.error?.flatten().fieldErrors,
    });
    res.status(200).json({ success: true, message: "Invalid payload — acknowledged" });
    return;
  }

  const payload: CJOrderWebhookPayload | undefined = parseResult.success ? parseResult.data : undefined;

  await withCJWebhookAuth(
    req,
    res,
    { messageId: payload?.messageId ?? "", dedupTtl: 86400, loggerName: "webhook:cj:order" },
    async ({ client, startTime }) => {
      if (!payload) return;

      logger.info("CJ order webhook received", {
        messageId: payload.messageId,
        cjOrderId: payload.params.cjOrderId,
        status: payload.params.orderStatus,
      });

      // --- Find the Saleor order ---
      let matchedOrderId: string | null = null;
      let existingMeta: Record<string, unknown> = {};

      try {
        const redis = getRedisConnection();
        const saleorOrderId = await redis.get("dropship:supplier-order:" + payload.params.cjOrderId);

        if (saleorOrderId) {
          const { data: orderData } = await client
            .query(FIND_ORDER_BY_ID, { id: saleorOrderId })
            .toPromise();

          if (orderData?.order) {
            matchedOrderId = orderData.order.id;
            const meta = (orderData.order.metadata as Array<{ key: string; value: string }>)?.find(
              (m: { key: string }) => m.key === "dropship",
            );
            if (meta) {
              try { existingMeta = JSON.parse(meta.value); } catch { /* skip */ }
            }
          }
        }
      } catch (error) {
        logger.warn("Redis reverse index lookup failed — falling back to scan", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Fallback: scan recent orders by metadata
      if (!matchedOrderId) {
        const { data: ordersData } = await client
          .query(SEARCH_ORDERS_BY_METADATA, { first: 100 })
          .toPromise();

        if (ordersData?.orders?.edges) {
          for (const edge of ordersData.orders.edges) {
            const meta = (edge.node.metadata as Array<{ key: string; value: string }>)?.find(
              (m: { key: string }) => m.key === "dropship",
            );

            if (!meta) continue;

            try {
              const parsed = JSON.parse(meta.value);
              const suppliers = parsed.suppliers as Record<string, string> | undefined;

              if (suppliers && Object.values(suppliers).includes(payload.params.cjOrderId)) {
                matchedOrderId = edge.node.id;
                existingMeta = parsed;
                break;
              }
            } catch {
              // Skip malformed metadata
            }
          }
        }
      }

      if (!matchedOrderId) {
        logger.warn("CJ order webhook: no matching Saleor order found", {
          cjOrderId: payload.params.cjOrderId,
        });
        res.status(200).json({ success: true, message: "No matching order — acknowledged" });
        return;
      }

      // --- Update order metadata ---
      const newStatus = CJ_STATUS_MAP[payload.params.orderStatus] ?? "forwarded";

      // Dual tracking: classify CJ cross-border vs last-mile
      const incomingTrack = payload.params.trackNumber ?? "";
      const isCjNumber = /^CJ/i.test(incomingTrack);
      const existingCjTracking = (existingMeta.cjTrackingNumber as string) || "";
      const existingLastMile = (existingMeta.lastMileTrackingNumber as string) || "";

      const cjTrackingNumber = isCjNumber ? incomingTrack : existingCjTracking;
      const lastMileTrackingNumber = isCjNumber ? existingLastMile : (incomingTrack || existingLastMile);
      const customerTrackingNumber = lastMileTrackingNumber || cjTrackingNumber || incomingTrack;

      const updatedMeta = {
        ...existingMeta,
        status: newStatus,
        lastCjUpdate: payload.params.updateDate ?? new Date().toISOString(),
        ...(incomingTrack
          ? {
              trackingNumber: customerTrackingNumber,
              trackingUrl: payload.params.trackingUrl ?? "",
              carrier: payload.params.logisticName ?? "",
              cjTrackingNumber,
              lastMileTrackingNumber,
            }
          : {}),
      };

      await client
        .mutation(UPDATE_ORDER_METADATA, {
          id: matchedOrderId,
          input: [{ key: "dropship", value: JSON.stringify(updatedMeta) }],
        })
        .toPromise();

      // --- Auto-fulfill when shipped with tracking number ---
      if (newStatus === "shipped" && customerTrackingNumber) {
        try {
          const { data: orderData } = await client
            .query(FETCH_ORDER_LINES, { id: matchedOrderId })
            .toPromise();

          const hasFulfillment = (orderData?.order?.fulfillments?.length ?? 0) > 0;

          if (!hasFulfillment && orderData?.order?.lines?.length > 0) {
            const { data: warehouseData } = await client
              .query(FETCH_WAREHOUSES, { first: 1 })
              .toPromise();

            const warehouseId = warehouseData?.warehouses?.edges?.[0]?.node?.id;

            if (warehouseId) {
              const fulfillmentLines = orderData.order.lines
                .filter((line: { variant: unknown }) => line.variant !== null)
                .map((line: { id: string; quantity: number }) => ({
                  orderLineId: line.id,
                  stocks: [{ warehouse: warehouseId, quantity: line.quantity }],
                }));

              if (fulfillmentLines.length > 0) {
                const { data: fulfillmentData, error: fulfillmentError } = await client
                  .mutation(CREATE_FULFILLMENT, {
                    orderId: matchedOrderId,
                    input: {
                      lines: fulfillmentLines,
                      trackingNumber: customerTrackingNumber,
                      notifyCustomer: true,
                    },
                  })
                  .toPromise();

                if (fulfillmentError) {
                  logger.error("Failed to create fulfillment from order webhook", {
                    orderId: matchedOrderId,
                    error: fulfillmentError.message,
                  });
                } else if (fulfillmentData?.orderFulfill?.errors?.length > 0) {
                  logger.error("Fulfillment mutation errors from order webhook", {
                    orderId: matchedOrderId,
                    errors: fulfillmentData.orderFulfill.errors,
                  });
                } else {
                  logger.info("Auto-fulfillment created from CJ order webhook", {
                    orderId: matchedOrderId,
                    trackingNumber: customerTrackingNumber,
                    cjTrackingNumber,
                    lastMileTrackingNumber,
                  });
                }
              }
            }
          } else if (hasFulfillment) {
            logger.info("Order already fulfilled — skipping auto-fulfillment", {
              orderId: matchedOrderId,
            });
          }
        } catch (e) {
          logger.error("Error during auto-fulfillment from order webhook", {
            orderId: matchedOrderId,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      await logAuditEvent(client, {
        type: "webhook_received",
        supplierId: "cj",
        orderId: matchedOrderId,
        action: `CJ order status update: ${payload.params.orderStatus} -> ${newStatus}`,
        request: { messageId: payload.messageId, cjOrderId: payload.params.cjOrderId },
        response: { newStatus },
        status: "success",
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      logger.info("CJ order status updated in Saleor", {
        saleorOrderId: matchedOrderId,
        cjOrderId: payload.params.cjOrderId,
        newStatus,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ success: true });
    },
  );
}
