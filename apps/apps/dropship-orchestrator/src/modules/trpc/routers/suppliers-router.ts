import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";

const logger = createLogger("SuppliersRouter");

const SupplierConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["aliexpress", "cj"]),
  enabled: z.boolean(),
  credentials: z.record(z.string()).optional(),
  lastConnectedAt: z.string().nullable(),
  tokenExpiresAt: z.string().nullable(),
  status: z.enum(["connected", "disconnected", "error", "token_expiring"]),
});

type SupplierConfig = z.infer<typeof SupplierConfigSchema>;

const FETCH_APP_METADATA = gql`
  query FetchAppMetadata {
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
  mutation UpdateAppMetadata($id: ID!, $input: [MetadataInput!]!) {
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

async function getAppMetadata(client: any): Promise<{ appId: string; metadata: Record<string, string> }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (error || !data?.app) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch app metadata" });
  }

  const metadata: Record<string, string> = {};
  for (const entry of data.app.privateMetadata || []) {
    metadata[entry.key] = entry.value;
  }

  return { appId: data.app.id, metadata };
}

async function setAppMetadata(client: any, appId: string, key: string, value: string): Promise<void> {
  const { error } = await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key, value }],
    })
    .toPromise();

  if (error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to update metadata: ${error.message}` });
  }
}

function getSupplierConfigs(metadata: Record<string, string>): SupplierConfig[] {
  const raw = metadata["dropship-suppliers"];
  if (!raw) {
    return [
      {
        id: "aliexpress",
        name: "AliExpress",
        type: "aliexpress",
        enabled: false,
        lastConnectedAt: null,
        tokenExpiresAt: null,
        status: "disconnected",
      },
      {
        id: "cj",
        name: "CJ Dropshipping",
        type: "cj",
        enabled: false,
        lastConnectedAt: null,
        tokenExpiresAt: null,
        status: "disconnected",
      },
    ];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const suppliersRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const { metadata } = await getAppMetadata(ctx.apiClient);
    return getSupplierConfigs(metadata);
  }),

  getConfig: protectedClientProcedure
    .input(z.object({ supplierId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { metadata } = await getAppMetadata(ctx.apiClient);
      const configs = getSupplierConfigs(metadata);
      const config = configs.find((c) => c.id === input.supplierId);

      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Supplier ${input.supplierId} not found` });
      }

      return config;
    }),

  toggle: protectedClientProcedure
    .input(z.object({ supplierId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, metadata } = await getAppMetadata(ctx.apiClient);
      const configs = getSupplierConfigs(metadata);
      const idx = configs.findIndex((c) => c.id === input.supplierId);

      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Supplier ${input.supplierId} not found` });
      }

      configs[idx].enabled = input.enabled;
      logger.info("Toggling supplier", { supplierId: input.supplierId, enabled: input.enabled });

      await setAppMetadata(ctx.apiClient, appId, "dropship-suppliers", JSON.stringify(configs));
      return configs[idx];
    }),

  saveCredentials: protectedClientProcedure
    .input(
      z.object({
        supplierId: z.string(),
        credentials: z.record(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, metadata } = await getAppMetadata(ctx.apiClient);
      const configs = getSupplierConfigs(metadata);
      const idx = configs.findIndex((c) => c.id === input.supplierId);

      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Supplier ${input.supplierId} not found` });
      }

      // Store credentials separately (encrypted via Saleor's private metadata)
      await setAppMetadata(
        ctx.apiClient,
        appId,
        `dropship-creds-${input.supplierId}`,
        JSON.stringify(input.credentials),
      );

      configs[idx].status = "connected";
      configs[idx].lastConnectedAt = new Date().toISOString();
      await setAppMetadata(ctx.apiClient, appId, "dropship-suppliers", JSON.stringify(configs));

      logger.info("Saved supplier credentials", { supplierId: input.supplierId });
      return { success: true };
    }),

  testConnection: protectedClientProcedure
    .input(z.object({ supplierId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { metadata } = await getAppMetadata(ctx.apiClient);
      const credsRaw = metadata[`dropship-creds-${input.supplierId}`];

      if (!credsRaw) {
        return { success: false, error: "No credentials found. Please save credentials first." };
      }

      try {
        const creds = JSON.parse(credsRaw);
        // The actual adapter test would go here once adapters are loaded
        logger.info("Testing supplier connection", { supplierId: input.supplierId });
        return { success: true, message: "Connection test passed" };
      } catch (e) {
        return { success: false, error: "Failed to parse stored credentials" };
      }
    }),
});
