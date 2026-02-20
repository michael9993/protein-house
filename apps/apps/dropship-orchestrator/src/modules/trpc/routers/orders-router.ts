import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { createHash } from "crypto";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { classifyOrderLines } from "@/modules/webhooks/order-paid/order-classifier";
import { supplierRegistry } from "@/modules/suppliers/registry";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import type { AuthToken, SupplierOrderRequest } from "@/modules/suppliers/types";

const logger = createLogger("OrdersRouter");

const DropshipOrderStatusEnum = z.enum([
  "pending",
  "forwarded",
  "shipped",
  "delivered",
  "cancelled",
  "supplier_cancelled",
  "failed",
  "exception",
]);

const ORDERS_WITH_METADATA = gql`
  query OrdersWithDropshipMeta($first: Int!, $after: String, $filter: OrderFilterInput) {
    orders(first: $first, after: $after, filter: $filter, sortBy: { field: CREATED_AT, direction: DESC }) {
      edges {
        node {
          id
          number
          created
          status
          total {
            gross {
              amount
              currency
            }
          }
          shippingAddress {
            firstName
            lastName
            country {
              code
            }
            city
          }
          metadata {
            key
            value
          }
          lines {
            id
            productName
            variantName
            quantity
            totalPrice {
              gross {
                amount
                currency
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

interface DropshipMeta {
  status: string;
  supplier: string;
  supplierOrderId?: string;
  trackingNumber?: string;
  forwardedAt?: string;
  shippedAt?: string;
  cost?: number;
}

function parseDropshipMeta(metadata: Array<{ key: string; value: string }>): DropshipMeta | null {
  const entry = metadata.find((m) => m.key === "dropship");
  if (!entry) return null;

  try {
    return JSON.parse(entry.value);
  } catch {
    return null;
  }
}

export const ordersRouter = router({
  list: protectedClientProcedure
    .input(
      z.object({
        first: z.number().min(1).max(100).default(20),
        after: z.string().nullable().optional(),
        status: DropshipOrderStatusEnum.optional(),
        supplierId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.apiClient
        .query(ORDERS_WITH_METADATA, {
          first: input.first,
          after: input.after ?? null,
        })
        .toPromise();

      if (error || !data?.orders) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch orders: ${error?.message ?? "Unknown error"}`,
        });
      }

      const orders = data.orders.edges
        .map((edge: any) => {
          const meta = parseDropshipMeta(edge.node.metadata);
          if (!meta) return null;

          return {
            id: edge.node.id,
            number: edge.node.number,
            created: edge.node.created,
            saleorStatus: edge.node.status,
            dropshipStatus: meta.status,
            supplier: meta.supplier,
            supplierOrderId: meta.supplierOrderId,
            trackingNumber: meta.trackingNumber,
            forwardedAt: meta.forwardedAt,
            shippedAt: meta.shippedAt,
            supplierCost: meta.cost,
            total: edge.node.total.gross,
            shippingCountry: edge.node.shippingAddress?.country?.code,
            lineCount: edge.node.lines.length,
          };
        })
        .filter(Boolean)
        .filter((order: any) => {
          if (input.status && order.dropshipStatus !== input.status) return false;
          if (input.supplierId && order.supplier !== input.supplierId) return false;
          return true;
        });

      return {
        orders,
        pageInfo: data.orders.pageInfo,
        totalCount: data.orders.totalCount,
      };
    }),

  getDetail: protectedClientProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ORDER_DETAIL = gql`
        query OrderDetail($id: ID!) {
          order(id: $id) {
            id
            number
            created
            status
            total {
              gross {
                amount
                currency
              }
            }
            shippingAddress {
              firstName
              lastName
              streetAddress1
              streetAddress2
              city
              postalCode
              country {
                code
                country
              }
              phone
            }
            billingAddress {
              country {
                code
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
            }
            fulfillments {
              id
              status
              trackingNumber
              created
              lines {
                id
                quantity
                orderLine {
                  id
                  productName
                }
              }
            }
          }
        }
      `;

      const { data, error } = await ctx.apiClient.query(ORDER_DETAIL, { id: input.orderId }).toPromise();

      if (error || !data?.order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Order not found: ${error?.message ?? "Unknown error"}`,
        });
      }

      const meta = parseDropshipMeta(data.order.metadata);

      return {
        ...data.order,
        dropship: meta,
      };
    }),

  retryForward: protectedClientProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      logger.info("Manual retry order forwarding", { orderId: input.orderId });

      const FETCH_ORDER = gql`
        query FetchOrderForRetry($id: ID!) {
          order(id: $id) {
            id
            number
            shippingAddress {
              firstName
              lastName
              streetAddress1
              city
              postalCode
              country { code }
              phone
            }
            metadata { key value }
            lines {
              id
              productName
              variantName
              productSku
              quantity
              unitPrice { gross { amount currency } }
              totalPrice { gross { amount currency } }
              variant {
                id
                product { metadata { key value } }
              }
            }
          }
        }
      `;

      const { data, error } = await ctx.apiClient.query(FETCH_ORDER, { id: input.orderId }).toPromise();

      if (error || !data?.order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Order not found: ${error?.message ?? "Unknown error"}`,
        });
      }

      const order = data.order;
      const classified = classifyOrderLines(order.lines);

      if (classified.dropship.size === 0) {
        return { success: false, forwarded: 0, errors: ["No dropship lines found in order"] };
      }

      const appId = await fetchAppId(ctx.apiClient);
      if (!appId) {
        return { success: false, forwarded: 0, errors: ["Cannot resolve app ID"] };
      }

      let forwarded = 0;
      const errors: string[] = [];

      for (const [supplierId, group] of classified.dropship.entries()) {
        const adapter = supplierRegistry.getAdapter(supplierId);
        if (!adapter) {
          errors.push(`No adapter for supplier "${supplierId}"`);
          continue;
        }

        const creds = await getSupplierCredentials(ctx.apiClient, appId, supplierId);
        if (!creds) {
          errors.push(`No credentials for supplier "${supplierId}"`);
          continue;
        }

        const authToken: AuthToken = {
          accessToken: creds.accessToken ?? "",
          expiresAt: creds.tokenExpiresAt ? new Date(creds.tokenExpiresAt) : new Date(Date.now() + 86400_000),
          refreshToken: ("refreshToken" in creds ? creds.refreshToken : undefined) as string | undefined,
        };

        for (let i = 0; i < group.lines.length; i++) {
          const meta = group.metadata[i];
          const line = group.lines[i];
          const idempKey = createHash("sha256")
            .update(`${input.orderId}:${supplierId}:retry`)
            .digest("hex")
            .slice(0, 32);

          const request: SupplierOrderRequest = {
            supplierSku: meta.supplierSku,
            quantity: line.quantity,
            shippingAddress: {
              name: `${order.shippingAddress?.firstName ?? ""} ${order.shippingAddress?.lastName ?? ""}`.trim(),
              street: order.shippingAddress?.streetAddress1 ?? "",
              city: order.shippingAddress?.city ?? "",
              postalCode: order.shippingAddress?.postalCode ?? "",
              country: order.shippingAddress?.country?.code ?? "",
              phone: order.shippingAddress?.phone ?? "",
            },
            shippingMethod: "standard",
            idempotencyKey: idempKey,
          };

          const result = await adapter.placeOrder(request, authToken);

          if (result.isOk()) {
            forwarded++;
            await logAuditEvent(ctx.apiClient, {
              type: "order_forwarded",
              supplierId,
              orderId: input.orderId,
              action: `Retry forwarded to ${supplierId}: supplierOrderId=${result.value.supplierOrderId}`,
              status: "success",
              timestamp: new Date().toISOString(),
            });
          } else {
            errors.push(`${supplierId}: ${result.error.message}`);
          }
        }
      }

      return { success: forwarded > 0, forwarded, errors };
    }),
});
