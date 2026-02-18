import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";

const logger = createLogger("SettingsRouter");

const FETCH_APP_METADATA = gql`
  query FetchSettingsMetadata {
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
  mutation UpdateSettingsMetadata($id: ID!, $input: [MetadataInput!]!) {
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

const DropshipConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoForward: z.boolean().default(true),
  costCeilingPercent: z.number().min(0).max(100).default(70),
  dailySpendLimit: z.number().min(0).default(1000),
  fraudChecksEnabled: z.boolean().default(true),
});

const FraudConfigSchema = z.object({
  maxOrdersPerHour: z.number().min(1).default(3),
  maxSpendPer24h: z.number().min(0).default(500),
  highValueThreshold: z.number().min(0).default(200),
  newCustomerHighValueThreshold: z.number().min(0).default(100),
  billingShippingMismatchBlocking: z.boolean().default(false),
  enabledRules: z
    .array(z.enum(["velocity_check", "address_mismatch", "value_threshold", "blacklist_match", "new_customer_high_value"]))
    .default(["velocity_check", "address_mismatch", "value_threshold", "blacklist_match", "new_customer_high_value"]),
});

const IpWhitelistSchema = z.object({
  enabled: z.boolean().default(false),
  allowedIps: z.array(z.string()).default([]),
});

const BlacklistEntrySchema = z.object({
  type: z.enum(["email", "address", "phone", "ip"]),
  value: z.string(),
  addedAt: z.string(),
  reason: z.string(),
});

async function getSettingsFromMetadata(client: any, key: string): Promise<{ appId: string; value: any }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (error || !data?.app) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch settings" });
  }

  const entry = (data.app.privateMetadata || []).find((m: any) => m.key === key);
  let value = null;
  if (entry) {
    try {
      value = JSON.parse(entry.value);
    } catch {
      value = null;
    }
  }

  return { appId: data.app.id, value };
}

async function saveSettings(client: any, appId: string, key: string, value: any): Promise<void> {
  const { error } = await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key, value: JSON.stringify(value) }],
    })
    .toPromise();

  if (error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to save settings: ${error.message}` });
  }
}

export const settingsRouter = router({
  getDropshipConfig: protectedClientProcedure.query(async ({ ctx }) => {
    const { value } = await getSettingsFromMetadata(ctx.apiClient, "dropship-config");
    return DropshipConfigSchema.parse(value ?? {});
  }),

  updateDropshipConfig: protectedClientProcedure
    .input(DropshipConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const { appId, value: existing } = await getSettingsFromMetadata(ctx.apiClient, "dropship-config");
      const merged = DropshipConfigSchema.parse({ ...(existing ?? {}), ...input });
      await saveSettings(ctx.apiClient, appId, "dropship-config", merged);
      logger.info("Updated dropship config", { changes: Object.keys(input) });
      return merged;
    }),

  getFraudConfig: protectedClientProcedure.query(async ({ ctx }) => {
    const { value } = await getSettingsFromMetadata(ctx.apiClient, "dropship-fraud-config");
    return FraudConfigSchema.parse(value ?? {});
  }),

  updateFraudConfig: protectedClientProcedure
    .input(FraudConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const { appId, value: existing } = await getSettingsFromMetadata(ctx.apiClient, "dropship-fraud-config");
      const merged = FraudConfigSchema.parse({ ...(existing ?? {}), ...input });
      await saveSettings(ctx.apiClient, appId, "dropship-fraud-config", merged);
      logger.info("Updated fraud config", { changes: Object.keys(input) });
      return merged;
    }),

  getIpWhitelist: protectedClientProcedure.query(async ({ ctx }) => {
    const { value } = await getSettingsFromMetadata(ctx.apiClient, "dropship-ip-whitelist");
    return IpWhitelistSchema.parse(value ?? {});
  }),

  updateIpWhitelist: protectedClientProcedure
    .input(IpWhitelistSchema)
    .mutation(async ({ ctx, input }) => {
      const { appId } = await getSettingsFromMetadata(ctx.apiClient, "dropship-ip-whitelist");
      const validated = IpWhitelistSchema.parse(input);
      await saveSettings(ctx.apiClient, appId, "dropship-ip-whitelist", validated);
      logger.info("Updated IP whitelist", { ipCount: validated.allowedIps.length });
      return validated;
    }),

  getBlacklist: protectedClientProcedure.query(async ({ ctx }) => {
    const { value } = await getSettingsFromMetadata(ctx.apiClient, "dropship-blacklist");
    return (value ?? []) as z.infer<typeof BlacklistEntrySchema>[];
  }),

  addToBlacklist: protectedClientProcedure
    .input(BlacklistEntrySchema.omit({ addedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const { appId, value: existing } = await getSettingsFromMetadata(ctx.apiClient, "dropship-blacklist");
      const blacklist = (existing ?? []) as z.infer<typeof BlacklistEntrySchema>[];

      const entry = { ...input, addedAt: new Date().toISOString() };
      blacklist.push(entry);

      await saveSettings(ctx.apiClient, appId, "dropship-blacklist", blacklist);
      logger.info("Added to blacklist", { type: input.type, value: input.value });
      return blacklist;
    }),

  removeFromBlacklist: protectedClientProcedure
    .input(z.object({ type: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, value: existing } = await getSettingsFromMetadata(ctx.apiClient, "dropship-blacklist");
      const blacklist = ((existing ?? []) as z.infer<typeof BlacklistEntrySchema>[]).filter(
        (e) => !(e.type === input.type && e.value === input.value),
      );

      await saveSettings(ctx.apiClient, appId, "dropship-blacklist", blacklist);
      logger.info("Removed from blacklist", { type: input.type, value: input.value });
      return blacklist;
    }),
});
