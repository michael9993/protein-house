import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";
import { fetchAppId, setSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";

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

      // Include webhook registration status for CJ
      let webhooks: { registeredAt: string; baseUrl: string; urls: Record<string, string> } | null = null;
      if (input.supplierId === "cj") {
        const raw = metadata["dropship-cj-webhooks"];
        if (raw) {
          try { webhooks = JSON.parse(raw); } catch { /* ignore */ }
        }
      }

      return { ...config, webhooks };
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
      const { appId: metaAppId, metadata } = await getAppMetadata(ctx.apiClient);
      const configs = getSupplierConfigs(metadata);
      const idx = configs.findIndex((c) => c.id === input.supplierId);

      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Supplier ${input.supplierId} not found` });
      }

      // Resolve the app ID for encrypted storage
      const appId = await fetchAppId(ctx.apiClient);
      if (!appId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to resolve app ID" });
      }

      // Authenticate with supplier to get access token
      const adapter = supplierRegistry.getAdapter(input.supplierId);
      let accessToken: string | undefined;
      let tokenExpiresAt: string | undefined;
      let refreshToken: string | undefined;

      if (adapter && input.supplierId === "cj" && input.credentials.apiKey) {
        const authResult = await adapter.authenticate({
          type: "cj",
          apiKey: input.credentials.apiKey,
        });

        if (authResult.isOk()) {
          accessToken = authResult.value.accessToken;
          tokenExpiresAt = authResult.value.expiresAt.toISOString();
          refreshToken = authResult.value.refreshToken;
          logger.info("CJ authentication successful", { tokenExpiresAt });
        } else {
          logger.warn("CJ authentication failed — credentials saved without token", {
            error: authResult.error.message,
          });
        }
      }

      // Store credentials in encrypted metadata (format matching SupplierCredentialsSchema)
      if (input.supplierId === "cj") {
        await setSupplierCredentials(ctx.apiClient, appId, input.supplierId, {
          type: "cj",
          apiKey: input.credentials.apiKey,
          accessToken,
          tokenExpiresAt,
        });
      } else if (input.supplierId === "aliexpress") {
        await setSupplierCredentials(ctx.apiClient, appId, input.supplierId, {
          type: "aliexpress",
          appKey: input.credentials.appKey ?? "",
          appSecret: input.credentials.appSecret ?? "",
          accessToken,
          refreshToken,
          tokenExpiresAt,
        });
      }

      // Update supplier status in the config list
      configs[idx].status = accessToken ? "connected" : "error";
      configs[idx].enabled = !!accessToken;
      configs[idx].lastConnectedAt = new Date().toISOString();
      configs[idx].tokenExpiresAt = tokenExpiresAt ?? null;
      await setAppMetadata(ctx.apiClient, metaAppId, "dropship-suppliers", JSON.stringify(configs));

      logger.info("Saved supplier credentials", {
        supplierId: input.supplierId,
        authenticated: !!accessToken,
      });

      return {
        success: true,
        authenticated: !!accessToken,
        tokenExpiresAt: tokenExpiresAt ?? null,
      };
    }),

  registerWebhooks: protectedClientProcedure
    .input(z.object({ supplierId: z.literal("cj") }))
    .mutation(async ({ ctx, input }) => {
      const appId = await fetchAppId(ctx.apiClient);
      if (!appId) {
        return { success: false, error: "Failed to resolve app ID" };
      }

      const { getSupplierCredentials } = await import("@/modules/lib/metadata-manager");
      const creds = await getSupplierCredentials(ctx.apiClient, appId, input.supplierId);

      if (!creds || !creds.accessToken) {
        return { success: false, error: "No access token found. Save your API key and test connection first." };
      }

      // Determine the public base URL for webhooks
      const baseUrl = process.env.APP_API_BASE_URL || process.env.NEXT_PUBLIC_APP_API_BASE_URL || "";
      if (!baseUrl) {
        return { success: false, error: "APP_API_BASE_URL is not set. Configure your tunnel URL in the environment." };
      }

      logger.info("Registering CJ webhooks", { baseUrl });

      try {
        const response = await fetch("https://developers.cjdropshipping.com/api2.0/v1/webhook/set", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "CJ-Access-Token": creds.accessToken,
          },
          body: JSON.stringify({
            order: {
              type: "ENABLE",
              callbackUrls: [`${baseUrl}/api/webhooks/cj/order`],
            },
            logistics: {
              type: "ENABLE",
              callbackUrls: [`${baseUrl}/api/webhooks/cj/logistics`],
            },
            stock: {
              type: "ENABLE",
              callbackUrls: [`${baseUrl}/api/webhooks/cj/stock`],
            },
          }),
        });

        const data = await response.json();

        if (data.code === 200 || data.result === true) {
          logger.info("CJ webhooks registered successfully", { baseUrl });

          // Persist registration state in app metadata
          const { appId: metaAppId } = await getAppMetadata(ctx.apiClient);
          await setAppMetadata(ctx.apiClient, metaAppId, "dropship-cj-webhooks", JSON.stringify({
            registeredAt: new Date().toISOString(),
            baseUrl,
            urls: {
              order: `${baseUrl}/api/webhooks/cj/order`,
              logistics: `${baseUrl}/api/webhooks/cj/logistics`,
              stock: `${baseUrl}/api/webhooks/cj/stock`,
            },
          }));

          return {
            success: true,
            message: `Webhooks registered at ${baseUrl}`,
            urls: {
              order: `${baseUrl}/api/webhooks/cj/order`,
              logistics: `${baseUrl}/api/webhooks/cj/logistics`,
              stock: `${baseUrl}/api/webhooks/cj/stock`,
            },
          };
        }

        logger.warn("CJ webhook registration returned non-success", { data });
        return {
          success: false,
          error: `CJ API returned: ${data.message || JSON.stringify(data)}`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("CJ webhook registration failed", { error: msg });
        return { success: false, error: `Request failed: ${msg}` };
      }
    }),

  testConnection: protectedClientProcedure
    .input(z.object({ supplierId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adapter = supplierRegistry.getAdapter(input.supplierId);

      if (!adapter) {
        return { success: false, error: `No adapter registered for supplier "${input.supplierId}"` };
      }

      // Read credentials from encrypted storage
      const appId = await fetchAppId(ctx.apiClient);
      if (!appId) {
        return { success: false, error: "Failed to resolve app ID" };
      }

      const { getSupplierCredentials } = await import("@/modules/lib/metadata-manager");
      const creds = await getSupplierCredentials(ctx.apiClient, appId, input.supplierId);

      if (!creds) {
        return { success: false, error: "No credentials found. Please save your API key first." };
      }

      logger.info("Testing supplier connection", { supplierId: input.supplierId });

      // Test by actually authenticating with the supplier API
      const result = await adapter.authenticate(creds as any);

      if (result.isOk()) {
        return {
          success: true,
          message: `Connected to ${adapter.name} successfully. Token valid until ${result.value.expiresAt.toLocaleDateString()}.`,
        };
      }

      return {
        success: false,
        error: `${adapter.name} connection failed: ${result.error.message}`,
      };
    }),
});
