import type { NextApiRequest, NextApiResponse } from "next";
import { gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { getRedisConnection } from "@/modules/jobs/queues";
import { withCJWebhookAuth } from "@/modules/webhooks/cj/shared";

const logger = createLogger("webhook:cj:logistics");

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const CJLogisticsWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("LOGISTICS"),
  messageType: z.string().optional(),
  params: z.object({
    cjOrderId: z.string().min(1),
    orderNumber: z.string().optional(),
    trackNumber: z.string().min(1),
    trackingUrl: z.string().nullable().optional(),
    logisticName: z.string().optional(),
    logisticsStatus: z.string().optional(),
    updateDate: z.string().optional(),
  }),
});

type CJLogisticsWebhookPayload = z.infer<typeof CJLogisticsWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FIND_ORDER_BY_ID = gql`
  query FindOrderByIdForLogistics($id: ID!) {
    order(id: $id) {
      id
      number
      metadata {
        key
        value
      }
      lines {
        id
        productName
        quantity
        variant {
          id
        }
      }
    }
  }
`;

const SEARCH_ORDERS = gql`
  query SearchOrdersForLogistics($first: Int!) {
    orders(first: $first, sortBy: { field: CREATED_AT, direction: DESC }) {
      edges {
        node {
          id
          number
          metadata {
            key
            value
          }
          lines {
            id
            productName
            quantity
            variant {
              id
            }
          }
        }
      }
    }
  }
`;

const UPDATE_ORDER_METADATA = gql`
  mutation UpdateOrderMetadataFromLogistics($id: ID!, $input: [MetadataInput!]!) {
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

const CREATE_FULFILLMENT = gql`
  mutation CreateFulfillment($orderId: ID!, $input: FulfillmentCreateInput!) {
    orderFulfill(order: $orderId, input: $input) {
      fulfillments {
        id
        status
        trackingNumber
      }
      errors {
        field
        message
        code
        orderLines
        warehouse
      }
    }
  }
`;

const FETCH_WAREHOUSES = gql`
  query FetchWarehouses($first: Int!) {
    warehouses(first: $first) {
      edges {
        node {
          id
          name
          slug
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const parseResult = CJLogisticsWebhookPayloadSchema.safeParse(req.body);

  if (req.method === "POST" && !parseResult.success) {
    logger.warn("CJ logistics webhook: invalid payload", {
      errors: parseResult.error?.flatten().fieldErrors,
    });
    res.status(200).json({ success: true, message: "Invalid payload — acknowledged" });
    return;
  }

  const payload: CJLogisticsWebhookPayload | undefined = parseResult.success ? parseResult.data : undefined;

  await withCJWebhookAuth(
    req,
    res,
    { messageId: payload?.messageId ?? "", dedupTtl: 86400, loggerName: "webhook:cj:logistics" },
    async ({ client, startTime }) => {
      if (!payload) return;

      logger.info("CJ logistics webhook received", {
        messageId: payload.messageId,
        cjOrderId: payload.params.cjOrderId,
        trackingNumber: payload.params.trackNumber,
      });

      // --- Find matching Saleor order ---
      let matchedOrder: {
        id: string;
        number: string;
        lines: Array<{ id: string; quantity: number; variant: { id: string } | null }>;
      } | null = null;
      let existingMeta: Record<string, unknown> = {};

      try {
        const redis = getRedisConnection();
        const saleorOrderId = await redis.get("dropship:supplier-order:" + payload.params.cjOrderId);

        if (saleorOrderId) {
          const { data: orderData } = await client
            .query(FIND_ORDER_BY_ID, { id: saleorOrderId })
            .toPromise();

          if (orderData?.order) {
            matchedOrder = orderData.order;
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
      if (!matchedOrder) {
        const { data: ordersData } = await client
          .query(SEARCH_ORDERS, { first: 100 })
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
                matchedOrder = edge.node;
                existingMeta = parsed;
                break;
              }
            } catch {
              // Skip malformed
            }
          }
        }
      }

      if (!matchedOrder) {
        logger.warn("CJ logistics webhook: no matching Saleor order", {
          cjOrderId: payload.params.cjOrderId,
        });
        res.status(200).json({ success: true, message: "No matching order — acknowledged" });
        return;
      }

      // --- Build shipments array (split-shipment support) ---
      const existingShipments: Array<{
        trackingNumber: string;
        carrier: string;
        trackingUrl: string;
        status: string;
      }> = Array.isArray(existingMeta.shipments)
        ? (existingMeta.shipments as typeof existingShipments)
        : [];

      // Migrate legacy flat format
      if (
        existingShipments.length === 0 &&
        typeof existingMeta.trackingNumber === "string" &&
        existingMeta.trackingNumber
      ) {
        existingShipments.push({
          trackingNumber: existingMeta.trackingNumber as string,
          carrier: (existingMeta.carrier as string) || "",
          trackingUrl: (existingMeta.trackingUrl as string) || "",
          status: "shipped",
        });
      }

      // Check if this tracking number already exists
      const alreadyExists = existingShipments.some(
        (s) => s.trackingNumber === payload.params.trackNumber,
      );

      if (!alreadyExists) {
        existingShipments.push({
          trackingNumber: payload.params.trackNumber,
          carrier: payload.params.logisticName ?? "",
          trackingUrl: payload.params.trackingUrl ?? "",
          status: payload.params.logisticsStatus ?? "shipped",
        });
      }

      // --- Create Saleor Fulfillment (only for new tracking numbers) ---
      if (!alreadyExists) {
        try {
          const { data: warehouseData } = await client
            .query(FETCH_WAREHOUSES, { first: 1 })
            .toPromise();

          const warehouseId = warehouseData?.warehouses?.edges?.[0]?.node?.id;

          if (!warehouseId) {
            logger.error("No warehouses found — cannot create fulfillment");
          } else {
            const fulfillmentLines = matchedOrder.lines
              .filter((line) => line.variant !== null)
              .map((line) => ({
                orderLineId: line.id,
                stocks: [{ warehouse: warehouseId, quantity: line.quantity }],
              }));

            if (fulfillmentLines.length === 0) {
              logger.warn("No fulfillable lines found", { orderId: matchedOrder.id });
            } else {
              const { data: fulfillmentData, error: fulfillmentError } = await client
                .mutation(CREATE_FULFILLMENT, {
                  orderId: matchedOrder.id,
                  input: {
                    lines: fulfillmentLines,
                    trackingNumber: payload.params.trackNumber,
                    notifyCustomer: true,
                  },
                })
                .toPromise();

              if (fulfillmentError) {
                logger.error("Failed to create fulfillment", {
                  orderId: matchedOrder.id,
                  error: fulfillmentError.message,
                });
              } else if (fulfillmentData?.orderFulfill?.errors?.length > 0) {
                logger.error("Fulfillment mutation errors", {
                  orderId: matchedOrder.id,
                  errors: fulfillmentData.orderFulfill.errors,
                });
              } else {
                logger.info("Fulfillment created", {
                  orderId: matchedOrder.id,
                  fulfillmentId: fulfillmentData?.orderFulfill?.fulfillments?.[0]?.id,
                  trackingNumber: payload.params.trackNumber,
                });
              }
            }
          }
        } catch (e) {
          logger.error("Error creating fulfillment", {
            orderId: matchedOrder.id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      } else {
        logger.info("Tracking number already processed — skipping fulfillment", {
          orderId: matchedOrder.id,
          trackingNumber: payload.params.trackNumber,
        });
      }

      // --- Update order metadata ---
      const updatedMeta = {
        ...existingMeta,
        status: "shipped",
        // Keep flat fields for backward compat (set to latest)
        trackingNumber: payload.params.trackNumber,
        trackingUrl: payload.params.trackingUrl ?? "",
        carrier: payload.params.logisticName ?? "",
        shipments: existingShipments,
        shippedAt: new Date().toISOString(),
      };

      await client
        .mutation(UPDATE_ORDER_METADATA, {
          id: matchedOrder.id,
          input: [{ key: "dropship", value: JSON.stringify(updatedMeta) }],
        })
        .toPromise();

      await logAuditEvent(client, {
        type: "fulfillment_created",
        supplierId: "cj",
        orderId: matchedOrder.id,
        action: `CJ logistics: tracking ${payload.params.trackNumber} received, fulfillment created`,
        request: {
          messageId: payload.messageId,
          cjOrderId: payload.params.cjOrderId,
          trackingNumber: payload.params.trackNumber,
        },
        status: "success",
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      logger.info("CJ logistics webhook processed", {
        orderId: matchedOrder.id,
        trackingNumber: payload.params.trackNumber,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ success: true });
    },
  );
}
