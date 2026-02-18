import type { NextApiRequest, NextApiResponse } from "next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { getRedisConnection } from "@/modules/jobs/queues";
import { getClientIp, isIpAllowed } from "@/modules/security/ip-whitelist";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:cj:logistics");

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const CJLogisticsWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("LOGISTICS_UPDATE"),
  data: z.object({
    orderId: z.string().min(1),
    orderNum: z.string().optional(),
    trackingNumber: z.string().min(1),
    trackingUrl: z.string().optional(),
    shippingCompany: z.string().optional(),
    logisticsStatus: z.string().optional(),
    updateTime: z.string().optional(),
  }),
});

type CJLogisticsWebhookPayload = z.infer<typeof CJLogisticsWebhookPayloadSchema>;

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
// GraphQL
// ---------------------------------------------------------------------------

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
  const startTime = Date.now();

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // --- IP whitelist check ---
  const clientIp = getClientIp(req);

  if (!isIpAllowed(clientIp, CJ_WEBHOOK_IPS)) {
    logger.warn("CJ logistics webhook: blocked IP", { clientIp });
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // --- Parse and validate payload ---
  const parseResult = CJLogisticsWebhookPayloadSchema.safeParse(req.body);

  if (!parseResult.success) {
    logger.warn("CJ logistics webhook: invalid payload", {
      errors: parseResult.error.flatten().fieldErrors,
    });
    res.status(200).json({ success: true, message: "Invalid payload — acknowledged" });
    return;
  }

  const payload: CJLogisticsWebhookPayload = parseResult.data;

  logger.info("CJ logistics webhook received", {
    messageId: payload.messageId,
    cjOrderId: payload.data.orderId,
    trackingNumber: payload.data.trackingNumber,
  });

  // --- Deduplicate ---
  if (await isDuplicate(payload.messageId)) {
    logger.info("CJ logistics webhook: duplicate — skipping", {
      messageId: payload.messageId,
    });
    res.status(200).json({ success: true, message: "Duplicate — already processed" });
    return;
  }

  await markProcessed(payload.messageId);

  // --- Resolve Saleor auth data ---
  const allAuth = typeof (saleorApp.apl as any).getAll === "function"
    ? await (saleorApp.apl as any).getAll()
    : [];
  const authData = Array.isArray(allAuth) ? allAuth[0] : null;

  if (!authData) {
    logger.error("No Saleor auth data available");
    res.status(200).json({ success: true, message: "No auth data — acknowledged" });
    return;
  }

  const client = createGraphQLClient({
    saleorApiUrl: authData.saleorApiUrl,
    token: authData.token,
  });

  // --- Find matching Saleor order ---
  const { data: ordersData } = await client
    .query(SEARCH_ORDERS, { first: 50 })
    .toPromise();

  let matchedOrder: {
    id: string;
    number: string;
    lines: Array<{ id: string; quantity: number; variant: { id: string } | null }>;
  } | null = null;
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
          matchedOrder = edge.node;
          existingMeta = parsed;
          break;
        }
      } catch {
        // Skip malformed
      }
    }
  }

  if (!matchedOrder) {
    logger.warn("CJ logistics webhook: no matching Saleor order", {
      cjOrderId: payload.data.orderId,
    });
    res.status(200).json({ success: true, message: "No matching order — acknowledged" });
    return;
  }

  // --- Create Saleor Fulfillment ---
  try {
    // Get a warehouse for the fulfillment
    const { data: warehouseData } = await client
      .query(FETCH_WAREHOUSES, { first: 1 })
      .toPromise();

    const warehouseId = warehouseData?.warehouses?.edges?.[0]?.node?.id;

    if (!warehouseId) {
      logger.error("No warehouses found — cannot create fulfillment");
      res.status(200).json({ success: true, message: "No warehouse — acknowledged" });
      return;
    }

    // Build fulfillment lines from the order lines
    const fulfillmentLines = matchedOrder.lines
      .filter((line) => line.variant !== null)
      .map((line) => ({
        orderLineId: line.id,
        stocks: [
          {
            warehouse: warehouseId,
            quantity: line.quantity,
          },
        ],
      }));

    if (fulfillmentLines.length === 0) {
      logger.warn("No fulfillable lines found", { orderId: matchedOrder.id });
      res.status(200).json({ success: true, message: "No fulfillable lines — acknowledged" });
      return;
    }

    const { data: fulfillmentData, error: fulfillmentError } = await client
      .mutation(CREATE_FULFILLMENT, {
        orderId: matchedOrder.id,
        input: {
          lines: fulfillmentLines,
          trackingNumber: payload.data.trackingNumber,
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
        trackingNumber: payload.data.trackingNumber,
      });
    }
  } catch (e) {
    logger.error("Error creating fulfillment", {
      orderId: matchedOrder.id,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // --- Update order metadata ---
  const updatedMeta = {
    ...existingMeta,
    status: "shipped",
    trackingNumber: payload.data.trackingNumber,
    trackingUrl: payload.data.trackingUrl ?? "",
    shippingCompany: payload.data.shippingCompany ?? "",
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
    action: `CJ logistics: tracking ${payload.data.trackingNumber} received, fulfillment created`,
    request: {
      messageId: payload.messageId,
      cjOrderId: payload.data.orderId,
      trackingNumber: payload.data.trackingNumber,
    },
    status: "success",
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  logger.info("CJ logistics webhook processed", {
    orderId: matchedOrder.id,
    trackingNumber: payload.data.trackingNumber,
    duration: Date.now() - startTime,
  });

  res.status(200).json({ success: true });
}
