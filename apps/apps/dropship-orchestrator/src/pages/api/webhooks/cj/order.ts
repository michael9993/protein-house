import type { NextApiRequest, NextApiResponse } from "next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { getRedisConnection } from "@/modules/jobs/queues";
import { getClientIp, isIpAllowed } from "@/modules/security/ip-whitelist";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:cj:order");

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const CJOrderStatusEnum = z.enum([
  "CREATED",
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "RETURNED",
]);

const CJOrderWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("ORDER_STATUS"),
  data: z.object({
    orderId: z.string().min(1),
    orderNum: z.string().optional(),
    status: CJOrderStatusEnum,
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional().or(z.literal("")),
    shippingCompany: z.string().optional(),
    updateTime: z.string().optional(),
  }),
});

type CJOrderWebhookPayload = z.infer<typeof CJOrderWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// CJ status -> Saleor dropship status mapping
// ---------------------------------------------------------------------------

const CJ_STATUS_MAP: Record<string, string> = {
  CREATED: "forwarded",
  CONFIRMED: "forwarded",
  PROCESSING: "forwarded",
  IN_TRANSIT: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "supplier_cancelled",
  FAILED: "failed",
  RETURNED: "supplier_cancelled",
};

// ---------------------------------------------------------------------------
// Deduplication (Redis-backed, persists across restarts)
// ---------------------------------------------------------------------------

const DEDUP_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const DEDUP_KEY_PREFIX = "dropship:cj:dedup:";

async function isDuplicate(messageId: string): Promise<boolean> {
  try {
    const redis = getRedisConnection();
    const existing = await redis.get(DEDUP_KEY_PREFIX + messageId);
    return existing !== null;
  } catch (error) {
    // If Redis is unavailable, allow processing (better to double-process than miss)
    logger.warn("Redis dedup check failed — allowing message", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function markProcessed(messageId: string): Promise<void> {
  try {
    const redis = getRedisConnection();
    await redis.set(DEDUP_KEY_PREFIX + messageId, "1", "EX", DEDUP_TTL_SECONDS);
  } catch (error) {
    logger.warn("Redis dedup mark failed", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FIND_ORDER_BY_SUPPLIER_ID = gql`
  query FindOrderBySupplierMeta($first: Int!, $filter: OrderFilterInput) {
    orders(first: $first, filter: $filter) {
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
// IP whitelist for CJ Dropshipping
// ---------------------------------------------------------------------------

const CJ_WEBHOOK_IPS = [
  "47.252.50.116",
  "47.252.50.117",
  "47.252.50.118",
  "47.252.50.119",
  "47.88.76.0/24",
];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // CJ requires a 200 response within 3 seconds
  const startTime = Date.now();

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // --- IP whitelist check ---
  const clientIp = getClientIp(req);

  if (!isIpAllowed(clientIp, CJ_WEBHOOK_IPS)) {
    logger.warn("CJ order webhook: blocked IP", { clientIp });
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // --- Parse and validate payload ---
  const parseResult = CJOrderWebhookPayloadSchema.safeParse(req.body);

  if (!parseResult.success) {
    logger.warn("CJ order webhook: invalid payload", {
      errors: parseResult.error.flatten().fieldErrors,
    });
    res.status(200).json({ success: true, message: "Invalid payload — acknowledged" });
    return;
  }

  const payload: CJOrderWebhookPayload = parseResult.data;

  logger.info("CJ order webhook received", {
    messageId: payload.messageId,
    cjOrderId: payload.data.orderId,
    status: payload.data.status,
  });

  // --- Deduplicate ---
  if (await isDuplicate(payload.messageId)) {
    logger.info("CJ order webhook: duplicate message — skipping", {
      messageId: payload.messageId,
    });
    res.status(200).json({ success: true, message: "Duplicate — already processed" });
    return;
  }

  await markProcessed(payload.messageId);

  // --- Resolve Saleor auth data ---
  // Use the first registered Saleor instance
  const allAuth = typeof (saleorApp.apl as any).getAll === "function"
    ? await (saleorApp.apl as any).getAll()
    : [];
  const authData = Array.isArray(allAuth) ? allAuth[0] : null;

  if (!authData) {
    logger.error("No Saleor auth data available — cannot process CJ webhook");
    res.status(200).json({ success: true, message: "No auth data — acknowledged" });
    return;
  }

  const client = createGraphQLClient({
    saleorApiUrl: authData.saleorApiUrl,
    token: authData.token,
  });

  // --- Find the Saleor order by searching metadata ---
  // We search for orders and then find the one whose dropship.suppliers contains this CJ order ID
  const { data: ordersData } = await client
    .query(FIND_ORDER_BY_SUPPLIER_ID, { first: 50 })
    .toPromise();

  let matchedOrderId: string | null = null;
  let existingMeta: Record<string, unknown> = {};

  if (ordersData?.orders?.edges) {
    for (const edge of ordersData.orders.edges) {
      const meta = (edge.node.metadata as Array<{ key: string; value: string }>)?.find(
        (m: { key: string }) => m.key === "dropship",
      );

      if (!meta) continue;

      try {
        const parsed = JSON.parse(meta.value);
        const suppliers = parsed.suppliers as Record<string, string> | undefined;

        if (suppliers && Object.values(suppliers).includes(payload.data.orderId)) {
          matchedOrderId = edge.node.id;
          existingMeta = parsed;
          break;
        }
      } catch {
        // Skip malformed metadata
      }
    }
  }

  if (!matchedOrderId) {
    logger.warn("CJ order webhook: no matching Saleor order found", {
      cjOrderId: payload.data.orderId,
    });
    res.status(200).json({ success: true, message: "No matching order — acknowledged" });
    return;
  }

  // --- Update order metadata ---
  const newStatus = CJ_STATUS_MAP[payload.data.status] ?? "forwarded";

  const updatedMeta = {
    ...existingMeta,
    status: newStatus,
    lastCjUpdate: payload.data.updateTime ?? new Date().toISOString(),
    ...(payload.data.trackingNumber
      ? {
          trackingNumber: payload.data.trackingNumber,
          trackingUrl: payload.data.trackingUrl ?? "",
          shippingCompany: payload.data.shippingCompany ?? "",
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
    action: `CJ order status update: ${payload.data.status} -> ${newStatus}`,
    request: { messageId: payload.messageId, cjOrderId: payload.data.orderId },
    response: { newStatus },
    status: "success",
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  logger.info("CJ order status updated in Saleor", {
    saleorOrderId: matchedOrderId,
    cjOrderId: payload.data.orderId,
    newStatus,
    duration: Date.now() - startTime,
  });

  res.status(200).json({ success: true });
}
