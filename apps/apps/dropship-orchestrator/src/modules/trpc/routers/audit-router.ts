import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";

const FETCH_APP_METADATA = gql`
  query FetchAuditMetadata {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

interface AuditEvent {
  id: string;
  type: "order_forward" | "order_cancel" | "tracking_sync" | "stock_sync" | "token_refresh" | "fraud_check" | "exception_create" | "api_call";
  supplierId: string;
  orderId?: string;
  action: string;
  status: "success" | "failure" | "error";
  duration?: number;
  timestamp: string;
  error?: string;
  details?: Record<string, unknown>;
}

export const auditRouter = router({
  list: protectedClientProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
        type: z.string().optional(),
        supplierId: z.string().optional(),
        status: z.enum(["success", "failure", "error"]).optional(),
        orderId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.apiClient.query(FETCH_APP_METADATA, {}).toPromise();

      if (error || !data?.app) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch audit log" });
      }

      const entry = (data.app.privateMetadata || []).find((m: any) => m.key === "dropship-audit-log");
      let events: AuditEvent[] = [];
      if (entry) {
        try {
          events = JSON.parse(entry.value);
        } catch {
          events = [];
        }
      }

      // Apply filters
      let filtered = events;
      if (input.type) filtered = filtered.filter((e) => e.type === input.type);
      if (input.supplierId) filtered = filtered.filter((e) => e.supplierId === input.supplierId);
      if (input.status) filtered = filtered.filter((e) => e.status === input.status);
      if (input.orderId) filtered = filtered.filter((e) => e.orderId === input.orderId);

      // Sort by timestamp DESC
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        events: filtered.slice(input.offset, input.offset + input.limit),
        totalCount: filtered.length,
        stats: {
          total: events.length,
          success: events.filter((e) => e.status === "success").length,
          failure: events.filter((e) => e.status === "failure").length,
          error: events.filter((e) => e.status === "error").length,
        },
      };
    }),

  clear: protectedClientProcedure
    .input(z.object({ olderThanDays: z.number().min(1).default(30) }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.apiClient.query(FETCH_APP_METADATA, {}).toPromise();

      if (error || !data?.app) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch audit log" });
      }

      const appId = data.app.id;
      const entry = (data.app.privateMetadata || []).find((m: any) => m.key === "dropship-audit-log");
      let events: AuditEvent[] = [];
      if (entry) {
        try {
          events = JSON.parse(entry.value);
        } catch {
          events = [];
        }
      }

      const cutoff = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
      const kept = events.filter((e) => new Date(e.timestamp) > cutoff);
      const removed = events.length - kept.length;

      const UPDATE = gql`
        mutation UpdateAuditLog($id: ID!, $input: [MetadataInput!]!) {
          updatePrivateMetadata(id: $id, input: $input) {
            errors { field message }
          }
        }
      `;

      await ctx.apiClient
        .mutation(UPDATE, {
          id: appId,
          input: [{ key: "dropship-audit-log", value: JSON.stringify(kept) }],
        })
        .toPromise();

      return { removed, remaining: kept.length };
    }),
});
