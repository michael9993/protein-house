import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

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

export const METADATA_KEY = "dropship-returns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const ReturnStatusEnum = z.enum([
  "requested",
  "approved",
  "shipped_back",
  "refunded",
  "rejected",
]);

const TimelineEntrySchema = z.object({
  action: z.string(),
  at: z.string(),
  by: z.string().optional(),
});

export const ReturnRequestSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  customerEmail: z.string(),
  reason: z.string(),
  items: z.array(
    z.object({
      productName: z.string(),
      variantName: z.string().optional(),
      quantity: z.number(),
      sku: z.string().optional(),
    }),
  ),
  status: ReturnStatusEnum,
  supplier: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
  returnWindow: z.number().optional(),
  orderCreated: z.string().optional(),
  refundAmount: z.number().optional(),
  refundCurrency: z.string().optional(),
  supplierOrderId: z.string().optional(),
  saleorRefundId: z.string().optional(),
  timeline: z.array(TimelineEntrySchema).default([]),
});

export type ReturnRequest = z.infer<typeof ReturnRequestSchema>;
export type ReturnStatus = z.infer<typeof ReturnStatusEnum>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function getAppMetadata(
  client: any,
): Promise<{ appId: string; meta: Record<string, string> }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();
  if (error || !data?.app) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch app metadata",
    });
  }
  const meta: Record<string, string> = {};
  for (const entry of data.app.privateMetadata || []) {
    meta[entry.key] = entry.value;
  }
  return { appId: data.app.id, meta };
}

export function parseReturns(raw: string | undefined): ReturnRequest[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReturns(
  client: any,
  appId: string,
  returns: ReturnRequest[],
): Promise<void> {
  await client
    .mutation(UPDATE_PRIVATE_METADATA, {
      id: appId,
      input: [{ key: METADATA_KEY, value: JSON.stringify(returns) }],
    })
    .toPromise();
}

export function addTimelineEntry(
  ret: ReturnRequest,
  action: string,
  by?: string,
): ReturnRequest {
  return {
    ...ret,
    timeline: [
      ...(ret.timeline ?? []),
      { action, at: new Date().toISOString(), by },
    ],
  };
}
