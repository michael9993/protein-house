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

      const updatedMeta = {
        ...existingMeta,
        status: newStatus,
        lastCjUpdate: payload.params.updateDate ?? new Date().toISOString(),
        ...(payload.params.trackNumber
          ? {
              trackingNumber: payload.params.trackNumber,
              trackingUrl: payload.params.trackingUrl ?? "",
              carrier: payload.params.logisticName ?? "",
            }
          : {}),
      };

      await client
        .mutation(UPDATE_ORDER_METADATA, {
          id: matchedOrderId,
          input: [{ key: "dropship", value: JSON.stringify(updatedMeta) }],
        })
        .toPromise();

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
