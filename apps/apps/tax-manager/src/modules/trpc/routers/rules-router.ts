import { z } from "zod";
import { v4 as uuid } from "uuid";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { TaxRuleSchema, TaxManagerConfigSchema } from "@/modules/tax-engine/schemas";
import { createLogger } from "@/logger";

const logger = createLogger("rules-router");

const METADATA_KEY = "tax-manager-config";

async function fetchConfig(saleorApiUrl: string, appToken: string) {
  const query = `query { app { id privateMetadata { key value } } }`;
  const response = await fetch(saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appToken}`,
    },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  const appId = json.data?.app?.id;
  const metadata = json.data?.app?.privateMetadata ?? [];
  const entry = metadata.find((m: any) => m.key === METADATA_KEY);

  let config;
  try {
    config = entry?.value ? TaxManagerConfigSchema.parse(JSON.parse(entry.value)) : TaxManagerConfigSchema.parse({});
  } catch {
    config = TaxManagerConfigSchema.parse({});
  }

  return { appId, config };
}

async function saveConfig(saleorApiUrl: string, appToken: string, appId: string, config: any) {
  const mutation = `mutation UpdateMeta($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      errors { field message }
    }
  }`;
  const url = saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appToken}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        id: appId,
        input: [{ key: METADATA_KEY, value: JSON.stringify(config) }],
      },
    }),
  });
  const json = await response.json();
  if (json.data?.updatePrivateMetadata?.errors?.length) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to save config: ${JSON.stringify(json.data.updatePrivateMetadata.errors)}`,
    });
  }
}

export const rulesRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const { config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
    return config.rules;
  }),

  create: protectedClientProcedure
    .input(TaxRuleSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      const newRule = { ...input, id: uuid() };
      config.rules.push(newRule);
      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      logger.info("Tax rule created", { rule: newRule.name, id: newRule.id });
      return newRule;
    }),

  update: protectedClientProcedure
    .input(z.object({ id: z.string().uuid(), data: TaxRuleSchema.partial().omit({ id: true }) }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      const index = config.rules.findIndex((r) => r.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }
      config.rules[index] = { ...config.rules[index], ...input.data };
      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      logger.info("Tax rule updated", { id: input.id });
      return config.rules[index];
    }),

  delete: protectedClientProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      config.rules = config.rules.filter((r) => r.id !== input.id);
      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      logger.info("Tax rule deleted", { id: input.id });
      return { success: true };
    }),

  toggleEnabled: protectedClientProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      const rule = config.rules.find((r) => r.id === input.id);
      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }
      rule.enabled = input.enabled;
      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      return rule;
    }),
});
