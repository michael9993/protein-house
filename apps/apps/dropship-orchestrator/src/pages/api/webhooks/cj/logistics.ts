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

// CJ sends various payload shapes — accept both documented and observed formats
const CJLogisticsWebhookPayloadSchema = z.object({
  messageId: z.string().optional().default(""),
  // CJ may send "LOGISTICS", "logistics_update", or other variants
  type: z.string().optional(),
  messageType: z.string().optional(),
  // Params may be nested or flat depending on CJ's webhook version
  params: z.object({
    cjOrderId: z.string().optional(),
    orderId: z.string().optional(),        // CJ sometimes uses orderId instead of cjOrderId
    orderNum: z.string().optional(),       // CJ sometimes uses orderNum
    orderNumber: z.string().optional(),
    trackNumber: z.string().optional(),
    trackingNumber: z.string().optional(), // CJ sometimes uses trackingNumber
    trackingUrl: z.string().nullable().optional(),
    logisticName: z.string().optional(),
    logisticsName: z.string().optional(),  // CJ sometimes uses logisticsName
    logisticsStatus: z.string().optional(),
    status: z.string().optional(),         // CJ sometimes uses flat status
    updateDate: z.string().optional(),
  }).optional(),
  // CJ v2 may send data at top level instead of nested in params
  orderId: z.string().optional(),
  trackNumber: z.string().optional(),
  trackingNumber: z.string().optional(),
  logisticName: z.string().optional(),
});

// Payload type used after normalization (not directly from Zod — we normalize CJ's varying formats)
type NormalizedLogisticsPayload = {
  messageId: string;
  params: {
    cjOrderId: string;
    trackNumber: string;
    trackingUrl: string;
    logisticName: string;
    logisticsStatus: string;
  };
};

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
    // Log the raw body so we can see what CJ actually sends
    logger.warn("CJ logistics webhook: parse failed — attempting raw extraction", {
      errors: parseResult.error?.flatten().fieldErrors,
      rawKeys: req.body ? Object.keys(req.body) : [],
    });
  }

  const parsed = parseResult.success ? parseResult.data : null;

  // Normalize CJ's varying field names into a consistent shape
  const normalizedCjOrderId =
    parsed?.params?.cjOrderId ?? parsed?.params?.orderId ?? parsed?.orderId ?? "";
  const normalizedTrackNumber =
    parsed?.params?.trackNumber ?? parsed?.params?.trackingNumber ?? parsed?.trackNumber ?? parsed?.trackingNumber ?? "";
  const normalizedLogisticName =
    parsed?.params?.logisticName ?? parsed?.params?.logisticsName ?? parsed?.logisticName ?? "";
  const normalizedTrackingUrl =
    parsed?.params?.trackingUrl ?? "";
  const normalizedLogisticsStatus =
    parsed?.params?.logisticsStatus ?? parsed?.params?.status ?? "";
  const normalizedMessageId = parsed?.messageId ?? "";

  // If we still can't extract the essentials, try raw body as last resort
  const rawBody = req.body as Record<string, unknown> | undefined;
  const finalCjOrderId = normalizedCjOrderId || String(rawBody?.orderId ?? rawBody?.cjOrderId ?? rawBody?.orderNum ?? "");
  const finalTrackNumber = normalizedTrackNumber || String(rawBody?.trackNumber ?? rawBody?.trackingNumber ?? rawBody?.tracking_number ?? "");
  const finalLogisticName = normalizedLogisticName || String(rawBody?.logisticName ?? rawBody?.logisticsName ?? rawBody?.carrier ?? "");

  if (!finalCjOrderId && !finalTrackNumber) {
    logger.warn("CJ logistics webhook: could not extract orderId or trackNumber from any format", {
      rawKeys: rawBody ? Object.keys(rawBody) : [],
    });
    res.status(200).json({ success: true, message: "Unrecognized payload — acknowledged" });
    return;
  }

  // Build a normalized payload for the rest of the handler
  const payload = {
    messageId: normalizedMessageId,
    params: {
      cjOrderId: finalCjOrderId,
      trackNumber: finalTrackNumber,
      trackingUrl: normalizedTrackingUrl,
      logisticName: finalLogisticName,
      logisticsStatus: normalizedLogisticsStatus,
    },
  };

  await withCJWebhookAuth(
    req,
    res,
    { messageId: payload.messageId, dedupTtl: 86400, loggerName: "webhook:cj:logistics" },
    async ({ client, startTime }) => {
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

      // --- Classify tracking number: CJ cross-border vs last-mile ---
      const incomingTrackNumber = payload.params.trackNumber;
      const isCjNumber = /^CJ/i.test(incomingTrackNumber);

      // Preserve both tracking numbers across webhook updates
      const existingCjTracking = (existingMeta.cjTrackingNumber as string) || "";
      const existingLastMile = (existingMeta.lastMileTrackingNumber as string) || "";

      const cjTrackingNumber = isCjNumber
        ? incomingTrackNumber
        : existingCjTracking;
      const lastMileTrackingNumber = isCjNumber
        ? existingLastMile
        : incomingTrackNumber;

      // Customer-facing tracking: prefer last-mile (doesn't reveal CJ supply chain)
      const customerTrackingNumber = lastMileTrackingNumber || cjTrackingNumber || incomingTrackNumber;

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
        (s) => s.trackingNumber === incomingTrackNumber,
      );

      if (!alreadyExists) {
        existingShipments.push({
          trackingNumber: incomingTrackNumber,
          carrier: payload.params.logisticName ?? "",
          trackingUrl: payload.params.trackingUrl ?? "",
          status: payload.params.logisticsStatus ?? "shipped",
        });
      }

      // --- Create Saleor Fulfillment (only for new tracking numbers) ---
      // Use customer-facing tracking number (last-mile preferred)
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
                    trackingNumber: customerTrackingNumber,
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
                  trackingNumber: customerTrackingNumber,
                  cjTrackingNumber,
                  lastMileTrackingNumber,
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
          trackingNumber: incomingTrackNumber,
        });
      }

      // --- Update order metadata ---
      const updatedMeta = {
        ...existingMeta,
        status: "shipped",
        // Customer-facing tracking (last-mile preferred)
        trackingNumber: customerTrackingNumber,
        trackingUrl: payload.params.trackingUrl ?? existingMeta.trackingUrl ?? "",
        carrier: payload.params.logisticName ?? existingMeta.carrier ?? "",
        // Dual tracking: store both for admin visibility
        cjTrackingNumber,
        lastMileTrackingNumber,
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
