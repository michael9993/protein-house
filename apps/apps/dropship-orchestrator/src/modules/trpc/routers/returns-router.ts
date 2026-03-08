import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken } from "@/modules/suppliers/types";

import {
  ReturnStatusEnum,
  type ReturnRequest,
  METADATA_KEY,
  getAppMetadata,
  parseReturns,
  saveReturns,
  addTimelineEntry,
} from "@/modules/returns/returns-store";

const logger = createLogger("ReturnsRouter");

// ---------------------------------------------------------------------------
// GraphQL — for fetching order data and creating refunds
// ---------------------------------------------------------------------------

const FETCH_ORDER_FOR_RETURN = gql`
  query FetchOrderForReturn($id: ID!) {
    order(id: $id) {
      id
      number
      created
      userEmail
      total {
        gross {
          amount
          currency
        }
      }
      lines {
        id
        productName
        variantName
        productSku
        quantity
      }
      metadata {
        key
        value
      }
    }
  }
`;

const CREATE_ORDER_GRANT_REFUND = gql`
  mutation CreateOrderRefund($orderId: ID!, $input: OrderGrantRefundCreateInput!) {
    orderGrantRefundCreate(id: $orderId, input: $input) {
      grantedRefund {
        id
        amount {
          amount
          currency
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RETURNS_CONFIG_DEFAULTS = {
  enabled: true,
  returnWindowDays: { cj: 15, aliexpress: 30 } as Record<string, number>,
  autoCreateFromRefund: false,
  autoRefundOnReceipt: false,
  autoCancelSupplierOnApproval: false,
  autoCreateSaleorRefund: false,
  allowedReasons: [
    "Defective/damaged",
    "Wrong item received",
    "Wrong size/color",
    "Changed mind",
    "Item not as described",
    "Other",
  ],
};

type ReturnsConfig = typeof RETURNS_CONFIG_DEFAULTS;

/**
 * Parse returns config from pre-fetched metadata. If meta is not provided,
 * fetches it from the API (for use in procedures that don't already have it).
 */
async function getReturnsConfig(
  client: any,
  preloadedMeta?: Record<string, string>,
): Promise<ReturnsConfig> {
  const meta = preloadedMeta ?? (await getAppMetadata(client)).meta;
  const raw = meta["dropship-returns-config"];
  if (!raw) return { ...RETURNS_CONFIG_DEFAULTS };
  try {
    return { ...RETURNS_CONFIG_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...RETURNS_CONFIG_DEFAULTS };
  }
}

function parseDropshipMeta(metadata: Array<{ key: string; value: string }>) {
  const entry = metadata.find((m) => m.key === "dropship");
  if (!entry) return null;
  try {
    return JSON.parse(entry.value) as {
      supplier?: string;
      supplierOrderId?: string;
      status?: string;
      [key: string]: unknown;
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const returnsRouter = router({
  // List all return requests
  list: protectedClientProcedure
    .input(
      z
        .object({
          status: ReturnStatusEnum.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { meta } = await getAppMetadata(ctx.apiClient);
      const allReturns = parseReturns(meta[METADATA_KEY]);

      // Counts always reflect the full dataset (unfiltered)
      const counts = {
        total: allReturns.length,
        requested: allReturns.filter((r) => r.status === "requested").length,
        approved: allReturns.filter((r) => r.status === "approved").length,
        shipped_back: allReturns.filter((r) => r.status === "shipped_back").length,
        refunded: allReturns.filter((r) => r.status === "refunded").length,
        rejected: allReturns.filter((r) => r.status === "rejected").length,
      };

      let returns = allReturns;
      if (input?.status) {
        returns = returns.filter((r) => r.status === input.status);
      }

      returns.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return { returns, counts };
    }),

  // Create a new return request (manual entry)
  create: protectedClientProcedure
    .input(
      z.object({
        orderId: z.string(),
        orderNumber: z.string(),
        customerEmail: z.string(),
        reason: z.string().min(1),
        items: z
          .array(
            z.object({
              productName: z.string(),
              variantName: z.string().optional(),
              quantity: z.number().min(1),
              sku: z.string().optional(),
            }),
          )
          .min(1),
        supplier: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const config = await getReturnsConfig(ctx.apiClient, meta);

      if (!config.enabled) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Returns are disabled" });
      }

      const returns = parseReturns(meta[METADATA_KEY]);

      // Check for duplicate non-rejected return
      const existing = returns.find(
        (r) => r.orderId === input.orderId && r.status !== "rejected",
      );
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A return already exists for this order (${existing.id})`,
        });
      }

      // Return window validation — also captures order creation date for badge display
      const windowDays = config.returnWindowDays[input.supplier] ?? 0;
      let orderCreatedDate: string | undefined;
      if (windowDays > 0) {
        const { data: orderData } = await ctx.apiClient
          .query(FETCH_ORDER_FOR_RETURN, { id: input.orderId })
          .toPromise();

        if (orderData?.order?.created) {
          orderCreatedDate = orderData.order.created;
          const daysSinceOrder =
            (Date.now() - new Date(orderCreatedDate).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceOrder > windowDays) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Return window expired (${windowDays} days for ${input.supplier})`,
            });
          }
        }
      }

      const now = new Date().toISOString();
      let returnRequest: ReturnRequest = {
        id: `ret-${Date.now()}`,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        customerEmail: input.customerEmail,
        reason: input.reason,
        items: input.items,
        status: "requested",
        supplier: input.supplier,
        createdAt: now,
        updatedAt: now,
        returnWindow: windowDays || 30,
        orderCreated: orderCreatedDate,
        timeline: [],
      };

      returnRequest = addTimelineEntry(returnRequest, "Return request created", "admin");

      returns.push(returnRequest);
      await saveReturns(ctx.apiClient, appId, returns);

      await logAuditEvent(ctx.apiClient, {
        type: "return_created",
        orderId: input.orderId,
        action: `Return request created for order #${input.orderNumber}`,
        status: "success",
        timestamp: now,
      });

      logger.info("Return request created", {
        id: returnRequest.id,
        orderId: input.orderId,
      });
      return { returnRequest };
    }),

  // Create return from a Saleor order (auto-populates fields)
  createFromOrder: protectedClientProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().min(1),
        lineIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const config = await getReturnsConfig(ctx.apiClient, meta);

      if (!config.enabled) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Returns are disabled" });
      }

      // Fetch order from Saleor
      const { data: orderData, error: orderError } = await ctx.apiClient
        .query(FETCH_ORDER_FOR_RETURN, { id: input.orderId })
        .toPromise();

      if (orderError || !orderData?.order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found in Saleor",
        });
      }

      const order = orderData.order;
      const dropship = parseDropshipMeta(order.metadata ?? []);
      const supplier = dropship?.supplier ?? "unknown";

      // Return window validation
      const windowDays = config.returnWindowDays[supplier] ?? 0;
      if (windowDays > 0 && order.created) {
        const daysSinceOrder =
          (Date.now() - new Date(order.created).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceOrder > windowDays) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Return window expired (${windowDays} days for ${supplier})`,
          });
        }
      }

      const returns = parseReturns(meta[METADATA_KEY]);

      // Check for duplicate
      const existing = returns.find(
        (r) => r.orderId === input.orderId && r.status !== "rejected",
      );
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A return already exists for this order (${existing.id})`,
        });
      }

      // Build items from order lines
      let lines = order.lines ?? [];
      if (input.lineIds && input.lineIds.length > 0) {
        lines = lines.filter((l: any) => input.lineIds!.includes(l.id));
      }

      const items = lines.map((l: any) => ({
        productName: l.productName,
        variantName: l.variantName || undefined,
        quantity: l.quantity,
        sku: l.productSku || undefined,
      }));

      if (items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No matching order lines found",
        });
      }

      const now = new Date().toISOString();
      let returnRequest: ReturnRequest = {
        id: `ret-${Date.now()}`,
        orderId: input.orderId,
        orderNumber: order.number ?? "unknown",
        customerEmail: order.userEmail ?? "",
        reason: input.reason,
        items,
        status: "requested",
        supplier,
        createdAt: now,
        updatedAt: now,
        returnWindow: windowDays || 30,
        orderCreated: order.created ?? undefined,
        supplierOrderId: dropship?.supplierOrderId,
        refundAmount: order.total?.gross?.amount,
        refundCurrency: order.total?.gross?.currency,
        timeline: [],
      };

      returnRequest = addTimelineEntry(
        returnRequest,
        "Return created from order lookup",
        "admin",
      );

      returns.push(returnRequest);
      await saveReturns(ctx.apiClient, appId, returns);

      await logAuditEvent(ctx.apiClient, {
        type: "return_created",
        orderId: input.orderId,
        action: `Return created from order #${order.number}`,
        status: "success",
        timestamp: now,
      });

      logger.info("Return created from order", {
        id: returnRequest.id,
        orderId: input.orderId,
      });
      return { returnRequest };
    }),

  // Lookup order details for return creation
  lookupOrder: protectedClientProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.apiClient
        .query(FETCH_ORDER_FOR_RETURN, { id: input.orderId })
        .toPromise();

      if (error || !data?.order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const order = data.order;
      const dropship = parseDropshipMeta(order.metadata ?? []);
      const config = await getReturnsConfig(ctx.apiClient);

      const supplier = dropship?.supplier ?? "unknown";
      const windowDays = config.returnWindowDays[supplier] ?? 0;
      let windowExpired = false;
      let daysRemaining: number | null = null;

      if (windowDays > 0 && order.created) {
        const daysSinceOrder =
          (Date.now() - new Date(order.created).getTime()) / (1000 * 60 * 60 * 24);
        daysRemaining = Math.max(0, Math.ceil(windowDays - daysSinceOrder));
        windowExpired = daysSinceOrder > windowDays;
      }

      return {
        orderId: order.id,
        orderNumber: order.number,
        customerEmail: order.userEmail,
        created: order.created,
        total: order.total?.gross,
        supplier,
        supplierOrderId: dropship?.supplierOrderId ?? null,
        lines: (order.lines ?? []).map((l: any) => ({
          id: l.id,
          productName: l.productName,
          variantName: l.variantName,
          sku: l.productSku,
          quantity: l.quantity,
        })),
        allowedReasons: config.allowedReasons,
        windowDays,
        windowExpired,
        daysRemaining,
      };
    }),

  // Update return status with auto-actions
  updateStatus: protectedClientProcedure
    .input(
      z.object({
        id: z.string(),
        status: ReturnStatusEnum,
        notes: z.string().optional(),
        refundAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const returns = parseReturns(meta[METADATA_KEY]);
      const config = await getReturnsConfig(ctx.apiClient, meta);

      const idx = returns.findIndex((r) => r.id === input.id);
      if (idx === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Return request not found",
        });
      }

      const now = new Date().toISOString();
      let ret = {
        ...returns[idx],
        status: input.status,
        updatedAt: now,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.refundAmount !== undefined ? { refundAmount: input.refundAmount } : {}),
      };

      ret = addTimelineEntry(
        ret,
        `Status changed to ${input.status}${input.notes ? `: ${input.notes}` : ""}`,
        "admin",
      );

      // --- Auto-action: approved -> cancel supplier order ---
      if (
        input.status === "approved" &&
        config.autoCancelSupplierOnApproval &&
        ret.supplierOrderId
      ) {
        try {
          const saleorAppId = await fetchAppId(ctx.apiClient);
          if (saleorAppId) {
            const adapter = supplierRegistry.getAdapter(ret.supplier);
            const creds = adapter
              ? await getSupplierCredentials(ctx.apiClient, saleorAppId, ret.supplier)
              : null;

            if (adapter && creds) {
              const authToken: AuthToken = {
                accessToken: creds.accessToken ?? "",
                expiresAt: creds.tokenExpiresAt
                  ? new Date(creds.tokenExpiresAt)
                  : new Date(Date.now() + 86400_000),
                refreshToken:
                  ("refreshToken" in creds ? creds.refreshToken : undefined) as
                    | string
                    | undefined,
              };

              const cancelResult = await adapter.cancelOrder(
                ret.supplierOrderId,
                authToken,
              );
              if (cancelResult.isOk()) {
                ret = addTimelineEntry(
                  ret,
                  `Auto-cancelled supplier order ${ret.supplierOrderId} with ${ret.supplier}`,
                  "system",
                );
                await logAuditEvent(ctx.apiClient, {
                  type: "return_updated",
                  orderId: ret.orderId,
                  supplierId: ret.supplier,
                  action: `Auto-cancelled supplier order ${ret.supplierOrderId} on return approval`,
                  status: "success",
                  timestamp: now,
                });
              } else {
                ret = addTimelineEntry(
                  ret,
                  `Failed to cancel supplier order: ${cancelResult.error.message}`,
                  "system",
                );
                await logAuditEvent(ctx.apiClient, {
                  type: "return_updated",
                  orderId: ret.orderId,
                  supplierId: ret.supplier,
                  action: `Failed to auto-cancel supplier order on return approval`,
                  status: "failure",
                  error: cancelResult.error.message,
                  timestamp: now,
                });
              }
            }
          }
        } catch (e) {
          logger.error("Error during auto-cancel on approval", {
            error: e instanceof Error ? e.message : String(e),
          });
          ret = addTimelineEntry(
            ret,
            `Error during auto-cancel: ${e instanceof Error ? e.message : "unknown"}`,
            "system",
          );
        }
      }

      // --- Auto-action: shipped_back -> auto-refund ---
      if (input.status === "shipped_back" && config.autoRefundOnReceipt) {
        ret = {
          ...ret,
          status: "refunded",
          updatedAt: new Date().toISOString(),
        };
        ret = addTimelineEntry(ret, "Auto-marked as refunded on receipt", "system");
      }

      // --- Auto-action: refunded -> create Saleor refund ---
      if (ret.status === "refunded" && config.autoCreateSaleorRefund) {
        const refundAmt = ret.refundAmount;
        if (refundAmt && refundAmt > 0) {
          try {
            const { data: refundData, error: refundError } = await ctx.apiClient
              .mutation(CREATE_ORDER_GRANT_REFUND, {
                orderId: ret.orderId,
                input: {
                  amount: refundAmt,
                  reason: `Return: ${ret.reason}`,
                },
              })
              .toPromise();

            if (
              refundData?.orderGrantRefundCreate?.grantedRefund?.id &&
              !refundError
            ) {
              ret.saleorRefundId =
                refundData.orderGrantRefundCreate.grantedRefund.id;
              ret = addTimelineEntry(
                ret,
                `Saleor refund created: ${ret.saleorRefundId} (${refundAmt} ${ret.refundCurrency ?? ""})`,
                "system",
              );
              await logAuditEvent(ctx.apiClient, {
                type: "return_updated",
                orderId: ret.orderId,
                action: `Auto-created Saleor refund ${ret.saleorRefundId}`,
                status: "success",
                timestamp: new Date().toISOString(),
              });
            } else {
              const errMsg =
                refundData?.orderGrantRefundCreate?.errors?.[0]?.message ??
                refundError?.message ??
                "Unknown error";
              ret = addTimelineEntry(
                ret,
                `Failed to create Saleor refund: ${errMsg}`,
                "system",
              );
              await logAuditEvent(ctx.apiClient, {
                type: "return_updated",
                orderId: ret.orderId,
                action: `Failed to auto-create Saleor refund`,
                status: "failure",
                error: errMsg,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (e) {
            logger.error("Error creating Saleor refund", {
              error: e instanceof Error ? e.message : String(e),
            });
            ret = addTimelineEntry(
              ret,
              `Error creating refund: ${e instanceof Error ? e.message : "unknown"}`,
              "system",
            );
          }
        }
      }

      returns[idx] = ret;
      await saveReturns(ctx.apiClient, appId, returns);

      logger.info("Return status updated", { id: input.id, status: ret.status });
      return { ok: true, returnRequest: ret };
    }),

  // Delete a return request
  delete: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const returns = parseReturns(meta[METADATA_KEY]);

      const filtered = returns.filter((r) => r.id !== input.id);
      if (filtered.length === returns.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Return request not found",
        });
      }

      await saveReturns(ctx.apiClient, appId, filtered);

      logger.info("Return request deleted", { id: input.id });
      return { ok: true };
    }),
});
