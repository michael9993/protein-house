import { createHash } from "crypto";

import { err, ok, Result } from "neverthrow";
import { Client, gql } from "urql";
import { v4 as uuidv4 } from "uuid";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { runFraudChecks } from "@/modules/fraud/fraud-checker";
import { mergeFraudConfig } from "@/modules/fraud/config";
import type { BlacklistEntry, ExceptionRecord, FraudCheckResult, OrderForFraudCheck } from "@/modules/fraud/types";
import { getCountryName } from "@/modules/lib/country-names";
import { getRedisConnection } from "@/modules/jobs/queues";
import { checkCostCeiling } from "@/modules/pricing/cost-ceiling";
import {
  fetchAppId,
  getDailySpend,
  getDropshipConfig,
  getSupplierCredentials,
  incrementDailySpend,
} from "@/modules/lib/metadata-manager";
import type { DropshipConfig } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken, SupplierOrderRequest } from "@/modules/suppliers/types";

import { classifyOrderLines, type OrderLine } from "./order-classifier";

const logger = createLogger("OrderPaidUseCase");

// ---------------------------------------------------------------------------
// GraphQL queries / mutations
// ---------------------------------------------------------------------------

const FETCH_ORDER_WITH_LINES = gql`
  query FetchOrderWithLines($id: ID!) {
    order(id: $id) {
      id
      number
      created
      status
      userEmail
      total {
        gross {
          amount
          currency
        }
      }
      shippingMethodName
      shippingAddress {
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        countryArea
        postalCode
        country {
          code
        }
        phone
      }
      billingAddress {
        country {
          code
        }
      }
      user {
        email
        orders {
          totalCount
        }
      }
      metadata {
        key
        value
      }
      lines {
        id
        productName
        variantName
        productSku
        quantity
        unitPrice {
          gross {
            amount
            currency
          }
        }
        totalPrice {
          gross {
            amount
            currency
          }
        }
        variant {
          id
          metadata {
            key
            value
          }
          product {
            metadata {
              key
              value
            }
          }
        }
      }
    }
  }
`;

const UPDATE_ORDER_METADATA = gql`
  mutation UpdateOrderMetadata($id: ID!, $input: [MetadataInput!]!) {
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

const FETCH_APP_METADATA = gql`
  query FetchAppMetadataForOrderPaid {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const UPDATE_APP_METADATA = gql`
  mutation UpdateExceptionFromOrderPaid($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        privateMetadata {
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

const FETCH_RECENT_ORDERS = gql`
  query FetchRecentOrders($email: String!, $first: Int!) {
    orders(
      first: $first
      filter: { customer: $email }
      sortBy: { field: CREATED_AT, direction: DESC }
    ) {
      edges {
        node {
          id
          created
          total {
            gross {
              amount
              currency
            }
          }
          userEmail
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderPaidPayload {
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

interface ForwardResult {
  supplierId: string;
  supplierOrderId: string;
  cost: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateIdempotencyKey(orderId: string, supplierId: string): string {
  // Deterministic: same orderId + supplierId always produces the same key.
  // This prevents duplicate supplier orders on Saleor webhook retries.
  const hash = createHash("sha256")
    .update(`${orderId}:${supplierId}`)
    .digest("hex")
    .slice(0, 32);

  // Format as UUID v4-compatible
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Store a CJ/supplier order ID → Saleor order ID mapping in Redis for O(1) webhook lookups. */
const REVERSE_INDEX_PREFIX = "dropship:supplier-order:";
const REVERSE_INDEX_TTL = 90 * 24 * 60 * 60; // 90 days

async function storeSupplierOrderIndex(supplierOrderId: string, saleorOrderId: string): Promise<void> {
  try {
    const redis = getRedisConnection();
    await redis.set(REVERSE_INDEX_PREFIX + supplierOrderId, saleorOrderId, "EX", REVERSE_INDEX_TTL);
  } catch (error) {
    logger.warn("Failed to store supplier order reverse index", {
      supplierOrderId,
      saleorOrderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getExceptions(client: Client): Promise<{ appId: string; exceptions: ExceptionRecord[] }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (error || !data?.app) {
    return { appId: "", exceptions: [] };
  }

  const appId: string = data.app.id;
  const entry = (data.app.privateMetadata as Array<{ key: string; value: string }>)?.find(
    (m) => m.key === "dropship-exceptions",
  );

  if (!entry) {
    return { appId, exceptions: [] };
  }

  try {
    return { appId, exceptions: JSON.parse(entry.value) };
  } catch {
    return { appId, exceptions: [] };
  }
}

async function createExceptionRecord(
  client: Client,
  params: {
    orderId: string;
    orderNumber: string;
    reason: ExceptionRecord["reason"];
    details: string;
  },
): Promise<void> {
  const { appId, exceptions } = await getExceptions(client);

  if (!appId) {
    logger.error("Cannot create exception — app ID unavailable");
    return;
  }

  const record: ExceptionRecord = {
    id: uuidv4(),
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    reason: params.reason,
    details: params.details,
    status: "pending_review",
    createdAt: new Date().toISOString(),
  };

  exceptions.push(record);

  // Cap at 500 exception records
  const trimmed = exceptions.slice(-500);

  await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key: "dropship-exceptions", value: JSON.stringify(trimmed) }],
    })
    .toPromise();

  logger.info("Exception record created", {
    exceptionId: record.id,
    orderId: params.orderId,
    reason: params.reason,
  });
}

function getBlacklist(metadata: Array<{ key: string; value: string }>): BlacklistEntry[] {
  const entry = metadata.find((m) => m.key === "dropship-blacklist");

  if (!entry) {
    return [];
  }

  try {
    return JSON.parse(entry.value);
  } catch {
    return [];
  }
}

function getFraudConfigFromMetadata(
  metadata: Array<{ key: string; value: string }>,
): Record<string, unknown> {
  const entry = metadata.find((m) => m.key === "dropship-fraud-config");

  if (!entry) {
    return {};
  }

  try {
    return JSON.parse(entry.value);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Main Use Case
// ---------------------------------------------------------------------------

/**
 * ORDER_PAID webhook handler business logic.
 *
 * 1. Fetch the full order with line items and product metadata
 * 2. Classify lines into concrete vs dropship
 * 3. If no dropship lines, return early
 * 4. Run fraud checks + exception checks (cost ceiling, daily spend)
 * 5. Forward each supplier group to the appropriate adapter
 * 6. Store supplier order IDs in Saleor order metadata
 * 7. Log everything to the audit trail
 */
export async function handleOrderPaid(
  client: Client,
  payload: OrderPaidPayload,
): Promise<Result<{ forwarded: ForwardResult[]; skipped: boolean }, UseCaseError>> {
  const startTime = Date.now();

  if (!payload.order?.id) {
    logger.error("ORDER_PAID payload missing order ID");
    return err({ code: "INVALID_PAYLOAD", message: "Missing order ID in payload" });
  }

  const orderId = payload.order.id;
  const orderNumber = payload.order.number ?? "unknown";

  logger.info("Processing ORDER_PAID", { orderId, orderNumber });

  // ------------------------------------------------------------------
  // 1. Fetch full order
  // ------------------------------------------------------------------

  const { data: orderData, error: orderError } = await client
    .query(FETCH_ORDER_WITH_LINES, { id: orderId })
    .toPromise();

  if (orderError || !orderData?.order) {
    logger.error("Failed to fetch order", { orderId, error: orderError?.message });
    return err({ code: "FETCH_FAILED", message: `Failed to fetch order: ${orderError?.message}` });
  }

  const order = orderData.order as {
    id: string;
    number: string;
    created: string;
    userEmail: string;
    shippingMethodName: string | null;
    total: { gross: { amount: number; currency: string } };
    shippingAddress: {
      firstName: string;
      lastName: string;
      streetAddress1: string;
      streetAddress2?: string;
      city: string;
      countryArea?: string;
      postalCode: string;
      country: { code: string };
      phone: string;
    };
    billingAddress: { country: { code: string } };
    user: { email: string; orders: { totalCount: number } } | null;
    metadata: Array<{ key: string; value: string }>;
    lines: OrderLine[];
  };

  // ------------------------------------------------------------------
  // 2. Classify lines
  // ------------------------------------------------------------------

  const classified = classifyOrderLines(order.lines);

  await logAuditEvent(client, {
    type: "order_classified",
    orderId,
    action: `Classified ${order.lines.length} lines: ${classified.concrete.length} concrete, ${classified.dropship.size} supplier groups`,
    status: "success",
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  // ------------------------------------------------------------------
  // 3. No dropship lines? Return early.
  // ------------------------------------------------------------------

  if (classified.dropship.size === 0) {
    logger.info("No dropship lines — nothing to do", { orderId });
    return ok({ forwarded: [], skipped: true });
  }

  // ------------------------------------------------------------------
  // 4. Load config
  // ------------------------------------------------------------------

  const appId = await fetchAppId(client);

  if (!appId) {
    return err({ code: "APP_ID_MISSING", message: "Cannot resolve app ID" });
  }

  const dropshipConfig = await getDropshipConfig(client, appId);

  if (!dropshipConfig.enabled) {
    logger.info("Dropship orchestration is disabled — skipping", { orderId });
    return ok({ forwarded: [], skipped: true });
  }

  // ------------------------------------------------------------------
  // 5. Fraud checks
  // ------------------------------------------------------------------

  if (dropshipConfig.fraudChecksEnabled) {
    const customerEmail = order.userEmail ?? order.user?.email ?? "";
    const isNewCustomer = (order.user?.orders?.totalCount ?? 0) <= 1;

    // Fetch recent orders for velocity check
    const { data: recentData } = await client
      .query(FETCH_RECENT_ORDERS, { email: customerEmail, first: 20 })
      .toPromise();

    const recentOrders = (recentData?.orders?.edges ?? []).map((edge: any) => ({
      email: edge.node.userEmail ?? customerEmail,
      total: edge.node.total.gross.amount,
      createdAt: edge.node.created,
    }));

    // Load fraud config + blacklist from app metadata
    const { data: appData } = await client.query(FETCH_APP_METADATA, {}).toPromise();
    const appMetadata: Array<{ key: string; value: string }> =
      appData?.app?.privateMetadata ?? [];
    const fraudConfigStored = getFraudConfigFromMetadata(appMetadata);
    const fraudConfig = mergeFraudConfig(fraudConfigStored as any);
    const blacklist = getBlacklist(appMetadata);

    const orderForFraudCheck: OrderForFraudCheck = {
      orderId,
      orderNumber: order.number,
      email: customerEmail,
      total: order.total.gross.amount,
      isNewCustomer,
      billingCountry: order.billingAddress?.country?.code ?? "",
      shippingCountry: order.shippingAddress?.country?.code ?? "",
      shippingAddress: {
        name: `${order.shippingAddress?.firstName ?? ""} ${order.shippingAddress?.lastName ?? ""}`.trim(),
        street: order.shippingAddress?.streetAddress1 ?? "",
        city: order.shippingAddress?.city ?? "",
        postalCode: order.shippingAddress?.postalCode ?? "",
        country: order.shippingAddress?.country?.code ?? "",
        phone: order.shippingAddress?.phone ?? "",
      },
      recentOrders,
    };

    const fraudResult: FraudCheckResult = runFraudChecks(
      orderForFraudCheck,
      fraudConfig,
      blacklist,
    );

    await logAuditEvent(client, {
      type: "fraud_check",
      orderId,
      action: `Fraud check: score=${fraudResult.score}, passed=${fraudResult.passed}, flags=${fraudResult.flags.length}`,
      status: fraudResult.passed ? "success" : "failure",
      response: { score: fraudResult.score, flags: fraudResult.flags },
      timestamp: new Date().toISOString(),
    });

    if (!fraudResult.passed) {
      const flagSummary = fraudResult.flags.map((f) => `${f.rule}:${f.severity}`).join(", ");

      await createExceptionRecord(client, {
        orderId,
        orderNumber: order.number,
        reason: `fraud_${fraudResult.flags[0]?.rule ?? "velocity"}` as ExceptionRecord["reason"],
        details: `Fraud score ${fraudResult.score}/100 — flags: ${flagSummary}`,
      });

      logger.warn("Order failed fraud checks — exception created", {
        orderId,
        score: fraudResult.score,
      });

      // Update order metadata to reflect exception status
      await client
        .mutation(UPDATE_ORDER_METADATA, {
          id: orderId,
          input: [
            {
              key: "dropship",
              value: JSON.stringify({
                status: "exception",
                reason: "fraud_check_failed",
                fraudScore: fraudResult.score,
              }),
            },
          ],
        })
        .toPromise();

      return ok({ forwarded: [], skipped: true });
    }
  }

  // ------------------------------------------------------------------
  // 6. Cost ceiling & daily spend checks
  // ------------------------------------------------------------------

  const totalDropshipCost = Array.from(classified.dropship.values()).reduce((sum, group) => {
    return (
      sum +
      group.metadata.reduce((lineSum, meta) => lineSum + meta.costPrice, 0)
    );
  }, 0);

  const orderTotal = order.total.gross.amount;
  const costCeilingResult = checkCostCeiling(totalDropshipCost, orderTotal, dropshipConfig.costCeilingPercent);

  if (!costCeilingResult.passed) {
    await createExceptionRecord(client, {
      orderId,
      orderNumber: order.number,
      reason: "cost_ceiling",
      details: `Supplier cost is ${costCeilingResult.actualPercent.toFixed(1)}% of order total (ceiling: ${costCeilingResult.maxPercent}%)`,
    });

    logger.warn("Cost ceiling exceeded — exception created", {
      orderId,
      actualPercent: costCeilingResult.actualPercent,
      ceiling: costCeilingResult.maxPercent,
    });

    return ok({ forwarded: [], skipped: true });
  }

  const dailySpend = await getDailySpend(client, appId);

  if (dailySpend.total + totalDropshipCost > dropshipConfig.dailySpendLimit) {
    await createExceptionRecord(client, {
      orderId,
      orderNumber: order.number,
      reason: "daily_spend_limit",
      details: `Adding $${totalDropshipCost.toFixed(2)} would exceed daily limit of $${dropshipConfig.dailySpendLimit} (current: $${dailySpend.total.toFixed(2)})`,
    });

    logger.warn("Daily spend limit would be exceeded — exception created", {
      orderId,
      currentSpend: dailySpend.total,
      additionalCost: totalDropshipCost,
      limit: dropshipConfig.dailySpendLimit,
    });

    return ok({ forwarded: [], skipped: true });
  }

  // ------------------------------------------------------------------
  // 7. Auto-forward disabled? Mark as pending.
  // ------------------------------------------------------------------

  if (!dropshipConfig.autoForward) {
    logger.info("Auto-forward disabled — marking as pending", { orderId });

    await client
      .mutation(UPDATE_ORDER_METADATA, {
        id: orderId,
        input: [
          {
            key: "dropship",
            value: JSON.stringify({
              status: "pending",
              suppliers: Array.from(classified.dropship.keys()),
            }),
          },
        ],
      })
      .toPromise();

    return ok({ forwarded: [], skipped: true });
  }

  // ------------------------------------------------------------------
  // 8. Forward to each supplier
  // ------------------------------------------------------------------

  const forwarded: ForwardResult[] = [];

  for (const [supplierId, group] of classified.dropship.entries()) {
    const adapter = supplierRegistry.getAdapter(supplierId);

    if (!adapter) {
      logger.error("No adapter registered for supplier", { supplierId });

      await createExceptionRecord(client, {
        orderId,
        orderNumber: order.number,
        reason: "supplier_error",
        details: `No adapter registered for supplier "${supplierId}"`,
      });
      continue;
    }

    // Get stored credentials + build auth token
    const creds = await getSupplierCredentials(client, appId, supplierId);

    if (!creds) {
      logger.error("No credentials found for supplier", { supplierId });

      await createExceptionRecord(client, {
        orderId,
        orderNumber: order.number,
        reason: "supplier_error",
        details: `No credentials configured for supplier "${supplierId}"`,
      });
      continue;
    }

    const authToken: AuthToken = {
      accessToken: creds.accessToken ?? "",
      expiresAt: creds.tokenExpiresAt ? new Date(creds.tokenExpiresAt) : new Date(Date.now() + 86400_000),
      refreshToken: ("refreshToken" in creds ? creds.refreshToken : undefined) as string | undefined,
    };

    // Build a single request per line (suppliers typically expect one item per order for dropship)
    for (let i = 0; i < group.lines.length; i++) {
      const line = group.lines[i];
      const meta = group.metadata[i];

      const idempotencyKey = generateIdempotencyKey(orderId, supplierId);

      const request: SupplierOrderRequest = {
        supplierSku: meta.supplierSku,
        supplierSkuAttr: meta.supplierSkuAttr,
        quantity: line.quantity,
        shippingAddress: {
          name: `${order.shippingAddress?.firstName ?? ""} ${order.shippingAddress?.lastName ?? ""}`.trim(),
          street: order.shippingAddress?.streetAddress1 ?? "",
          city: order.shippingAddress?.city ?? "",
          province: order.shippingAddress?.countryArea || undefined,
          postalCode: order.shippingAddress?.postalCode ?? "",
          country: order.shippingAddress?.country?.code ?? "",
          phone: order.shippingAddress?.phone ?? "",
        },
        shippingMethod: order.shippingMethodName || "standard",
        idempotencyKey,
        lineItemId: line.id,
        countryName: getCountryName(order.shippingAddress?.country?.code ?? ""),
        customerEmail: order.userEmail ?? order.user?.email,
      };

      const forwardStart = Date.now();
      let lastError: Error | null = null;
      let result: Awaited<ReturnType<typeof adapter.placeOrder>> | null = null;

      // Retry logic: 2 retries with 2s backoff
      for (let attempt = 0; attempt < 3; attempt++) {
        result = await adapter.placeOrder(request, authToken);

        if (result.isOk()) {
          break;
        }

        lastError = result.error;
        logger.warn("Order forward attempt failed", {
          orderId,
          supplierId,
          attempt: attempt + 1,
          error: result.error.message,
        });

        if (attempt < 2) {
          await sleep(2000 * (attempt + 1));
        }
      }

      if (result && result.isOk()) {
        const supplierResponse = result.value;

        forwarded.push({
          supplierId,
          supplierOrderId: supplierResponse.supplierOrderId,
          cost: supplierResponse.cost.amount,
          currency: supplierResponse.cost.currency,
        });

        // Store reverse index for O(1) webhook lookups
        await storeSupplierOrderIndex(supplierResponse.supplierOrderId, orderId);

        await logAuditEvent(client, {
          type: "order_forwarded",
          supplierId,
          orderId,
          action: `Forwarded to ${supplierId}: supplierOrderId=${supplierResponse.supplierOrderId}`,
          request: { supplierSku: meta.supplierSku, quantity: line.quantity },
          response: {
            supplierOrderId: supplierResponse.supplierOrderId,
            cost: supplierResponse.cost,
          },
          status: "success",
          duration: Date.now() - forwardStart,
          timestamp: new Date().toISOString(),
        });
      } else {
        // All retries exhausted
        const errorMessage = lastError?.message ?? "Unknown error";

        await logAuditEvent(client, {
          type: "order_forward_failed",
          supplierId,
          orderId,
          action: `Failed to forward to ${supplierId} after 3 attempts`,
          request: { supplierSku: meta.supplierSku, quantity: line.quantity },
          status: "failure",
          duration: Date.now() - forwardStart,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });

        await createExceptionRecord(client, {
          orderId,
          orderNumber: order.number,
          reason: "supplier_error",
          details: `Failed to forward to ${supplierId}: ${errorMessage}`,
        });
      }
    }
  }

  // ------------------------------------------------------------------
  // 9. Update order metadata with forward results
  // ------------------------------------------------------------------

  if (forwarded.length > 0) {
    const supplierOrders: Record<string, string> = {};
    let totalCost = 0;

    for (const f of forwarded) {
      supplierOrders[f.supplierId] = f.supplierOrderId;
      totalCost += f.cost;
    }

    await client
      .mutation(UPDATE_ORDER_METADATA, {
        id: orderId,
        input: [
          {
            key: "dropship",
            value: JSON.stringify({
              status: "forwarded",
              suppliers: supplierOrders,
              forwardedAt: new Date().toISOString(),
              totalCost,
            }),
          },
        ],
      })
      .toPromise();

    // Increment daily spend tracker
    await incrementDailySpend(client, appId, totalCost);
  }

  const duration = Date.now() - startTime;
  logger.info("ORDER_PAID processing complete", {
    orderId,
    forwardedCount: forwarded.length,
    duration,
  });

  return ok({ forwarded, skipped: false });
}
