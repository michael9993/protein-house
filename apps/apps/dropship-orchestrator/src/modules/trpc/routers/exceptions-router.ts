import { createHash } from "crypto";

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { classifyOrderLines } from "@/modules/webhooks/order-paid/order-classifier";
import { supplierRegistry } from "@/modules/suppliers/registry";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import type { AuthToken, SupplierOrderRequest } from "@/modules/suppliers/types";

const logger = createLogger("ExceptionsRouter");

const ExceptionStatusEnum = z.enum(["pending_review", "approved", "rejected", "auto_resolved"]);

const FETCH_ORDER_FOR_FORWARDING = gql`
  query FetchOrderForForwarding($id: ID!) {
    order(id: $id) {
      id
      number
      shippingAddress {
        firstName
        lastName
        streetAddress1
        city
        postalCode
        country {
          code
        }
        phone
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
  mutation UpdateOrderMetadataFromException($id: ID!, $input: [MetadataInput!]!) {
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
  query FetchAppMetadataForExceptions {
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
  mutation UpdateExceptionMetadata($id: ID!, $input: [MetadataInput!]!) {
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

interface ExceptionRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

async function getExceptions(client: any): Promise<{ appId: string; exceptions: ExceptionRecord[] }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (error || !data?.app) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch exceptions" });
  }

  const appId = data.app.id;
  const entry = (data.app.privateMetadata || []).find((m: any) => m.key === "dropship-exceptions");

  let exceptions: ExceptionRecord[] = [];
  if (entry) {
    try {
      exceptions = JSON.parse(entry.value);
    } catch {
      exceptions = [];
    }
  }

  return { appId, exceptions };
}

async function saveExceptions(client: any, appId: string, exceptions: ExceptionRecord[]): Promise<void> {
  const { error } = await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key: "dropship-exceptions", value: JSON.stringify(exceptions) }],
    })
    .toPromise();

  if (error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to save exceptions: ${error.message}` });
  }
}

function generateIdempotencyKey(orderId: string, supplierId: string): string {
  const hash = createHash("sha256")
    .update(`${orderId}:${supplierId}:approved`)
    .digest("hex")
    .slice(0, 32);

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Forward an order to suppliers after an exception is approved.
 * Skips fraud and cost checks (admin already reviewed).
 */
async function forwardApprovedOrder(
  client: any,
  orderId: string,
): Promise<{ forwarded: number; errors: string[] }> {
  const errors: string[] = [];
  let forwarded = 0;

  const { data, error } = await client.query(FETCH_ORDER_FOR_FORWARDING, { id: orderId }).toPromise();

  if (error || !data?.order) {
    return { forwarded: 0, errors: [`Failed to fetch order: ${error?.message ?? "not found"}`] };
  }

  const order = data.order;
  const classified = classifyOrderLines(order.lines);

  if (classified.dropship.size === 0) {
    return { forwarded: 0, errors: ["No dropship lines found in order"] };
  }

  const appId = await fetchAppId(client);

  if (!appId) {
    return { forwarded: 0, errors: ["Cannot resolve app ID"] };
  }

  const supplierOrders: Record<string, string> = {};

  for (const [supplierId, group] of classified.dropship.entries()) {
    const adapter = supplierRegistry.getAdapter(supplierId);

    if (!adapter) {
      errors.push(`No adapter for supplier "${supplierId}"`);
      continue;
    }

    const creds = await getSupplierCredentials(client, appId, supplierId);

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
      const line = group.lines[i];
      const meta = group.metadata[i];

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
        idempotencyKey: generateIdempotencyKey(orderId, supplierId),
      };

      const result = await adapter.placeOrder(request, authToken);

      if (result.isOk()) {
        supplierOrders[supplierId] = result.value.supplierOrderId;
        forwarded++;

        await logAuditEvent(client, {
          type: "order_forwarded",
          supplierId,
          orderId,
          action: `Forwarded (approved exception) to ${supplierId}: supplierOrderId=${result.value.supplierOrderId}`,
          status: "success",
          timestamp: new Date().toISOString(),
        });
      } else {
        errors.push(`${supplierId}: ${result.error.message}`);
      }
    }
  }

  // Update order metadata
  if (Object.keys(supplierOrders).length > 0) {
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
              approvedByAdmin: true,
            }),
          },
        ],
      })
      .toPromise();
  }

  return { forwarded, errors };
}

export const exceptionsRouter = router({
  list: protectedClientProcedure
    .input(
      z.object({
        status: ExceptionStatusEnum.optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { exceptions } = await getExceptions(ctx.apiClient);

      let filtered = exceptions;
      if (input.status) {
        filtered = exceptions.filter((e) => e.status === input.status);
      }

      // Sort by createdAt DESC (newest first)
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        exceptions: filtered.slice(0, input.limit),
        totalCount: filtered.length,
        pendingCount: exceptions.filter((e) => e.status === "pending_review").length,
      };
    }),

  approve: protectedClientProcedure
    .input(z.object({ exceptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, exceptions } = await getExceptions(ctx.apiClient);
      const idx = exceptions.findIndex((e) => e.id === input.exceptionId);

      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Exception not found" });
      }

      exceptions[idx].status = "approved";
      exceptions[idx].resolvedAt = new Date().toISOString();
      exceptions[idx].resolvedBy = "admin";

      await saveExceptions(ctx.apiClient, appId, exceptions);
      logger.info("Exception approved", { exceptionId: input.exceptionId, orderId: exceptions[idx].orderId });

      // Forward the order to suppliers (skip fraud/cost checks — admin approved)
      const forwardResult = await forwardApprovedOrder(ctx.apiClient, exceptions[idx].orderId);

      if (forwardResult.errors.length > 0) {
        logger.warn("Exception approved but some forwards failed", {
          exceptionId: input.exceptionId,
          forwarded: forwardResult.forwarded,
          errors: forwardResult.errors,
        });
      }

      return {
        success: true,
        exception: exceptions[idx],
        forwarded: forwardResult.forwarded,
        forwardErrors: forwardResult.errors,
      };
    }),

  reject: protectedClientProcedure
    .input(z.object({ exceptionId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, exceptions } = await getExceptions(ctx.apiClient);
      const idx = exceptions.findIndex((e) => e.id === input.exceptionId);

      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Exception not found" });
      }

      exceptions[idx].status = "rejected";
      exceptions[idx].resolvedAt = new Date().toISOString();
      exceptions[idx].resolvedBy = "admin";
      if (input.reason) {
        exceptions[idx].details += ` | Rejection reason: ${input.reason}`;
      }

      await saveExceptions(ctx.apiClient, appId, exceptions);
      logger.info("Exception rejected", { exceptionId: input.exceptionId, orderId: exceptions[idx].orderId });

      return { success: true, exception: exceptions[idx] };
    }),

  bulkApprove: protectedClientProcedure
    .input(z.object({ exceptionIds: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { appId, exceptions } = await getExceptions(ctx.apiClient);
      const results: Array<{ id: string; success: boolean; error?: string }> = [];

      for (const exceptionId of input.exceptionIds) {
        const idx = exceptions.findIndex((e) => e.id === exceptionId);
        if (idx === -1) {
          results.push({ id: exceptionId, success: false, error: "Not found" });
          continue;
        }
        if (exceptions[idx].status !== "pending_review") {
          results.push({ id: exceptionId, success: false, error: "Not pending" });
          continue;
        }

        exceptions[idx].status = "approved";
        exceptions[idx].resolvedAt = new Date().toISOString();
        exceptions[idx].resolvedBy = "admin";

        const forwardResult = await forwardApprovedOrder(ctx.apiClient, exceptions[idx].orderId);
        results.push({ id: exceptionId, success: true, error: forwardResult.errors.length > 0 ? forwardResult.errors.join("; ") : undefined });
      }

      await saveExceptions(ctx.apiClient, appId, exceptions);
      logger.info("Bulk approve", { count: input.exceptionIds.length, approved: results.filter((r) => r.success).length });

      return { results };
    }),

  bulkReject: protectedClientProcedure
    .input(z.object({ exceptionIds: z.array(z.string()).min(1), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, exceptions } = await getExceptions(ctx.apiClient);
      const results: Array<{ id: string; success: boolean; error?: string }> = [];

      for (const exceptionId of input.exceptionIds) {
        const idx = exceptions.findIndex((e) => e.id === exceptionId);
        if (idx === -1) {
          results.push({ id: exceptionId, success: false, error: "Not found" });
          continue;
        }
        if (exceptions[idx].status !== "pending_review") {
          results.push({ id: exceptionId, success: false, error: "Not pending" });
          continue;
        }

        exceptions[idx].status = "rejected";
        exceptions[idx].resolvedAt = new Date().toISOString();
        exceptions[idx].resolvedBy = "admin";
        if (input.reason) {
          exceptions[idx].details += ` | Rejection reason: ${input.reason}`;
        }
        results.push({ id: exceptionId, success: true });
      }

      await saveExceptions(ctx.apiClient, appId, exceptions);
      logger.info("Bulk reject", { count: input.exceptionIds.length, rejected: results.filter((r) => r.success).length });

      return { results };
    }),

  getStats: protectedClientProcedure.query(async ({ ctx }) => {
    const { exceptions } = await getExceptions(ctx.apiClient);

    const stats = {
      total: exceptions.length,
      pending: exceptions.filter((e) => e.status === "pending_review").length,
      approved: exceptions.filter((e) => e.status === "approved").length,
      rejected: exceptions.filter((e) => e.status === "rejected").length,
      autoResolved: exceptions.filter((e) => e.status === "auto_resolved").length,
      byReason: {} as Record<string, number>,
    };

    for (const exc of exceptions) {
      stats.byReason[exc.reason] = (stats.byReason[exc.reason] || 0) + 1;
    }

    return stats;
  }),
});
