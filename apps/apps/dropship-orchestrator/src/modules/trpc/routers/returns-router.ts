import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";

const logger = createLogger("ReturnsRouter");

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_APP_METADATA = gql`
  query FetchReturnsAppMetadata {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const UPDATE_PRIVATE_METADATA = gql`
  mutation UpdateReturnsAppMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        ... on App {
          id
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const METADATA_KEY = "dropship-returns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const ReturnStatusEnum = z.enum(["requested", "approved", "shipped_back", "refunded", "rejected"]);

const ReturnRequestSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  customerEmail: z.string(),
  reason: z.string(),
  items: z.array(z.object({
    productName: z.string(),
    variantName: z.string().optional(),
    quantity: z.number(),
    sku: z.string().optional(),
  })),
  status: ReturnStatusEnum,
  supplier: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
  returnWindow: z.number().optional(),
});

type ReturnRequest = z.infer<typeof ReturnRequestSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAppMetadata(client: any): Promise<{ appId: string; meta: Record<string, string> }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();
  if (error || !data?.app) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch app metadata" });
  }
  const meta: Record<string, string> = {};
  for (const entry of data.app.privateMetadata || []) {
    meta[entry.key] = entry.value;
  }
  return { appId: data.app.id, meta };
}

function parseReturns(raw: string | undefined): ReturnRequest[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveReturns(client: any, appId: string, returns: ReturnRequest[]): Promise<void> {
  await client
    .mutation(UPDATE_PRIVATE_METADATA, {
      id: appId,
      input: [{ key: METADATA_KEY, value: JSON.stringify(returns) }],
    })
    .toPromise();
}

// Default return windows per supplier (days)
const DEFAULT_RETURN_WINDOWS: Record<string, number> = {
  cj: 15,
  aliexpress: 30,
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const returnsRouter = router({
  // List all return requests
  list: protectedClientProcedure
    .input(z.object({
      status: ReturnStatusEnum.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { meta } = await getAppMetadata(ctx.apiClient);
      let returns = parseReturns(meta[METADATA_KEY]);

      if (input?.status) {
        returns = returns.filter((r) => r.status === input.status);
      }

      // Sort by newest first
      returns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const counts = {
        total: returns.length,
        requested: returns.filter((r) => r.status === "requested").length,
        approved: returns.filter((r) => r.status === "approved").length,
        shipped_back: returns.filter((r) => r.status === "shipped_back").length,
        refunded: returns.filter((r) => r.status === "refunded").length,
        rejected: returns.filter((r) => r.status === "rejected").length,
      };

      return { returns, counts };
    }),

  // Create a new return request
  create: protectedClientProcedure
    .input(z.object({
      orderId: z.string(),
      orderNumber: z.string(),
      customerEmail: z.string(),
      reason: z.string().min(1),
      items: z.array(z.object({
        productName: z.string(),
        variantName: z.string().optional(),
        quantity: z.number().min(1),
        sku: z.string().optional(),
      })).min(1),
      supplier: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const returns = parseReturns(meta[METADATA_KEY]);

      const now = new Date().toISOString();
      const returnRequest: ReturnRequest = {
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
        returnWindow: DEFAULT_RETURN_WINDOWS[input.supplier] ?? 30,
      };

      returns.push(returnRequest);
      await saveReturns(ctx.apiClient, appId, returns);

      logger.info("Return request created", { id: returnRequest.id, orderId: input.orderId });
      return { returnRequest };
    }),

  // Update return status
  updateStatus: protectedClientProcedure
    .input(z.object({
      id: z.string(),
      status: ReturnStatusEnum,
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const returns = parseReturns(meta[METADATA_KEY]);

      const idx = returns.findIndex((r) => r.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Return request not found" });
      }

      returns[idx] = {
        ...returns[idx],
        status: input.status,
        updatedAt: new Date().toISOString(),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };

      await saveReturns(ctx.apiClient, appId, returns);

      logger.info("Return status updated", { id: input.id, status: input.status });
      return { ok: true };
    }),

  // Delete a return request
  delete: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, meta } = await getAppMetadata(ctx.apiClient);
      const returns = parseReturns(meta[METADATA_KEY]);

      const filtered = returns.filter((r) => r.id !== input.id);
      if (filtered.length === returns.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Return request not found" });
      }

      await saveReturns(ctx.apiClient, appId, filtered);

      logger.info("Return request deleted", { id: input.id });
      return { ok: true };
    }),
});
