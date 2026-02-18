import type { NextApiRequest, NextApiResponse } from "next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { getRedisConnection } from "@/modules/jobs/queues";
import { getClientIp, isIpAllowed } from "@/modules/security/ip-whitelist";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:cj:stock");

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const CJStockWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("STOCK_UPDATE"),
  data: z.object({
    sku: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().nonnegative(),
    available: z.boolean(),
    updateTime: z.string().optional(),
  }),
});

type CJStockWebhookPayload = z.infer<typeof CJStockWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// Deduplication (Redis-backed, persists across restarts)
// ---------------------------------------------------------------------------

const DEDUP_TTL_SECONDS = 60 * 60; // 1 hour for stock updates
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

const FIND_VARIANT_BY_SKU = gql`
  query FindVariantBySku($sku: String!) {
    productVariants(first: 1, filter: { sku: $sku }) {
      edges {
        node {
          id
          sku
          product {
            id
            name
          }
          stocks {
            id
            warehouse {
              id
              name
            }
            quantity
          }
        }
      }
    }
  }
`;

const FIND_VARIANT_BY_METADATA = gql`
  query FindVariantByMetadata($first: Int!) {
    productVariants(first: $first) {
      edges {
        node {
          id
          sku
          product {
            id
            name
            metadata {
              key
              value
            }
          }
          stocks {
            id
            warehouse {
              id
            }
            quantity
          }
        }
      }
    }
  }
`;

const UPDATE_VARIANT_STOCKS = gql`
  mutation UpdateVariantStocks($variantId: ID!, $stocks: [StockInput!]!) {
    productVariantStocksUpdate(variantId: $variantId, stocks: $stocks) {
      productVariant {
        id
        sku
        stocks {
          warehouse {
            id
            name
          }
          quantity
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const FETCH_WAREHOUSES = gql`
  query FetchWarehousesForStock($first: Int!) {
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
    logger.warn("CJ stock webhook: blocked IP", { clientIp });
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // --- Parse and validate payload ---
  const parseResult = CJStockWebhookPayloadSchema.safeParse(req.body);

  if (!parseResult.success) {
    logger.warn("CJ stock webhook: invalid payload", {
      errors: parseResult.error.flatten().fieldErrors,
    });
    res.status(200).json({ success: true, message: "Invalid payload — acknowledged" });
    return;
  }

  const payload: CJStockWebhookPayload = parseResult.data;

  logger.info("CJ stock webhook received", {
    messageId: payload.messageId,
    sku: payload.data.sku,
    quantity: payload.data.quantity,
    available: payload.data.available,
  });

  // --- Deduplicate ---
  if (await isDuplicate(payload.messageId)) {
    logger.info("CJ stock webhook: duplicate — skipping", {
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

  // --- Find the Saleor variant ---
  // First, try to find by SKU directly
  const { data: variantData } = await client
    .query(FIND_VARIANT_BY_SKU, { sku: payload.data.sku })
    .toPromise();

  let variantId: string | null = null;
  let existingStocks: Array<{ warehouse: { id: string }; quantity: number }> = [];

  if (variantData?.productVariants?.edges?.length > 0) {
    const variant = variantData.productVariants.edges[0].node;
    variantId = variant.id;
    existingStocks = variant.stocks ?? [];
  } else {
    // Fallback: search by product metadata for the supplierSku
    const { data: metaData } = await client
      .query(FIND_VARIANT_BY_METADATA, { first: 100 })
      .toPromise();

    if (metaData?.productVariants?.edges) {
      for (const edge of metaData.productVariants.edges) {
        const dropshipMeta = (edge.node.product.metadata as Array<{ key: string; value: string }>)?.find(
          (m: { key: string }) => m.key === "dropship",
        );

        if (!dropshipMeta) continue;

        try {
          const parsed = JSON.parse(dropshipMeta.value);

          if (parsed.supplierSku === payload.data.sku) {
            variantId = edge.node.id;
            existingStocks = edge.node.stocks ?? [];
            break;
          }
        } catch {
          // Skip malformed
        }
      }
    }
  }

  if (!variantId) {
    logger.warn("CJ stock webhook: no matching variant found", {
      sku: payload.data.sku,
    });
    res.status(200).json({ success: true, message: "No matching variant — acknowledged" });
    return;
  }

  // --- Determine warehouse and update stock ---
  let warehouseId: string;

  if (existingStocks.length > 0) {
    // Update the first existing stock entry
    warehouseId = existingStocks[0].warehouse.id;
  } else {
    // Get the first available warehouse
    const { data: warehouseData } = await client
      .query(FETCH_WAREHOUSES, { first: 1 })
      .toPromise();

    warehouseId = warehouseData?.warehouses?.edges?.[0]?.node?.id;

    if (!warehouseId) {
      logger.error("No warehouses found — cannot update stock");
      res.status(200).json({ success: true, message: "No warehouse — acknowledged" });
      return;
    }
  }

  const { data: updateData, error: updateError } = await client
    .mutation(UPDATE_VARIANT_STOCKS, {
      variantId,
      stocks: [
        {
          warehouse: warehouseId,
          quantity: payload.data.quantity,
        },
      ],
    })
    .toPromise();

  if (updateError || (updateData?.productVariantStocksUpdate?.errors?.length > 0)) {
    const errors = updateData?.productVariantStocksUpdate?.errors ?? [];

    logger.error("Failed to update variant stock", {
      variantId,
      sku: payload.data.sku,
      error: updateError?.message ?? JSON.stringify(errors),
    });

    await logAuditEvent(client, {
      type: "stock_updated",
      supplierId: "cj",
      action: `Failed to update stock for SKU ${payload.data.sku}`,
      request: { sku: payload.data.sku, quantity: payload.data.quantity },
      status: "failure",
      error: updateError?.message ?? JSON.stringify(errors),
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ success: true, message: "Stock update failed — acknowledged" });
    return;
  }

  await logAuditEvent(client, {
    type: "stock_updated",
    supplierId: "cj",
    action: `Updated stock for SKU ${payload.data.sku}: quantity=${payload.data.quantity}`,
    request: { sku: payload.data.sku, quantity: payload.data.quantity },
    status: "success",
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  logger.info("CJ stock webhook processed", {
    variantId,
    sku: payload.data.sku,
    newQuantity: payload.data.quantity,
    duration: Date.now() - startTime,
  });

  res.status(200).json({ success: true });
}
