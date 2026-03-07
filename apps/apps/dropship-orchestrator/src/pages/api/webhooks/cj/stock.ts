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

// CJ actual webhook format: { messageId, type: "STOCK", messageType: "UPDATE", params: { ... } }
// See: https://developers.cjdropshipping.cn/en/api/start/webhook

// CJ sends stock webhooks in this format:
// { messageId, type: "STOCK", messageType: "INCREASE"|"UPDATE"|..., openId, params: { "<vid>": [{ areaEn, areaId, countryCode, pid, storageNum, vid }] } }
const CJStockEntrySchema = z.object({
  vid: z.string(),
  pid: z.string().optional(),
  storageNum: z.number(),
  areaEn: z.string().optional(),
  areaId: z.string().optional(),
  countryCode: z.string().optional(),
});

const CJStockWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("STOCK"),
  messageType: z.string().optional(),
  openId: z.number().optional(),
  params: z.record(z.string(), z.array(CJStockEntrySchema)).optional().default({}),
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

  // --- IP whitelist check (log-only behind Cloudflare tunnel) ---
  const clientIp = getClientIp(req);

  if (!isIpAllowed(clientIp, CJ_WEBHOOK_IPS)) {
    // Behind Cloudflare tunnel, CJ's real IP may not match the whitelist.
    // Log for audit but don't block — Cloudflare provides the security layer.
    logger.warn("CJ stock webhook: IP not in whitelist (allowed — behind tunnel)", { clientIp });
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

  // Flatten params map: { "<vid>": [{ vid, storageNum, ... }] } → array of stock entries
  const stockEntries = Object.entries(payload.params).flatMap(([_vid, entries]) => entries);

  if (stockEntries.length === 0) {
    logger.warn("CJ stock webhook: no stock entries in payload", { messageId: payload.messageId });
    res.status(200).json({ success: true, message: "No stock entries — acknowledged" });
    return;
  }

  logger.info("CJ stock webhook received", {
    messageId: payload.messageId,
    messageType: payload.messageType,
    entryCount: stockEntries.length,
    vids: stockEntries.map((e) => e.vid),
  });

  // --- Deduplicate ---
  if (await isDuplicate(payload.messageId)) {
    logger.info("CJ stock webhook: duplicate — skipping", { messageId: payload.messageId });
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

  // --- Process each stock entry ---
  let updatedCount = 0;

  for (const entry of stockEntries) {
    const variantSku = entry.vid;
    const stockQuantity = entry.storageNum;

    // --- Find the Saleor variant ---
    const { data: variantData } = await client
      .query(FIND_VARIANT_BY_SKU, { sku: variantSku })
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
          const variantMeta = (edge.node.product.metadata as Array<{ key: string; value: string }>)?.find(
            (m: { key: string }) => m.key === "dropship.supplierSku",
          );
          const dropshipMeta = (edge.node.product.metadata as Array<{ key: string; value: string }>)?.find(
            (m: { key: string }) => m.key === "dropship",
          );

          // Check individual key format first
          if (variantMeta?.value === variantSku) {
            variantId = edge.node.id;
            existingStocks = edge.node.stocks ?? [];
            break;
          }

          // Fallback to legacy JSON format
          if (dropshipMeta) {
            try {
              const parsed = JSON.parse(dropshipMeta.value);
              if (parsed.supplierSku === variantSku) {
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
    }

    if (!variantId) {
      logger.warn("CJ stock webhook: no matching variant found", { sku: variantSku });
      continue;
    }

    // --- Determine warehouse and update stock ---
    let warehouseId: string;

    if (existingStocks.length > 0) {
      warehouseId = existingStocks[0].warehouse.id;
    } else {
      const { data: warehouseData } = await client
        .query(FETCH_WAREHOUSES, { first: 1 })
        .toPromise();

      warehouseId = warehouseData?.warehouses?.edges?.[0]?.node?.id;

      if (!warehouseId) {
        logger.error("No warehouses found — cannot update stock");
        continue;
      }
    }

    const { data: updateData, error: updateError } = await client
      .mutation(UPDATE_VARIANT_STOCKS, {
        variantId,
        stocks: [{ warehouse: warehouseId, quantity: stockQuantity }],
      })
      .toPromise();

    if (updateError || (updateData?.productVariantStocksUpdate?.errors?.length > 0)) {
      const errors = updateData?.productVariantStocksUpdate?.errors ?? [];
      logger.error("Failed to update variant stock", {
        variantId,
        sku: variantSku,
        error: updateError?.message ?? JSON.stringify(errors),
      });

      await logAuditEvent(client, {
        type: "stock_updated",
        supplierId: "cj",
        action: `Failed to update stock for SKU ${variantSku}`,
        request: { sku: variantSku, quantity: stockQuantity },
        status: "failure",
        error: updateError?.message ?? JSON.stringify(errors),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    updatedCount++;

    await logAuditEvent(client, {
      type: "stock_updated",
      supplierId: "cj",
      action: `Updated stock for SKU ${variantSku}: quantity=${stockQuantity}`,
      request: { sku: variantSku, quantity: stockQuantity },
      status: "success",
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    logger.info("CJ stock entry processed", {
      variantId,
      sku: variantSku,
      newQuantity: stockQuantity,
    });
  }

  logger.info("CJ stock webhook complete", {
    messageId: payload.messageId,
    totalEntries: stockEntries.length,
    updatedCount,
    duration: Date.now() - startTime,
  });

  res.status(200).json({ success: true, updated: updatedCount });
}
