import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { ChannelTaxConfigSchema, TaxManagerConfigSchema } from "@/modules/tax-engine/schemas";
import { createLogger } from "@/logger";

const logger = createLogger("channels-router");

const METADATA_KEY = "tax-manager-config";

async function fetchConfig(saleorApiUrl: string, appToken: string) {
  const query = `query { app { id privateMetadata { key value } } }`;
  const url = saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
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
    updatePrivateMetadata(id: $id, input: $input) { errors { field message } }
  }`;
  const url = saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
    body: JSON.stringify({
      query: mutation,
      variables: { id: appId, input: [{ key: METADATA_KEY, value: JSON.stringify(config) }] },
    }),
  });
}

async function fetchSaleorChannels(saleorApiUrl: string, appToken: string) {
  const query = `query { channels { slug name currencyCode } }`;
  const url = saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${appToken}` },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  return json.data?.channels ?? [];
}

export const channelsRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const [{ config }, saleorChannels] = await Promise.all([
      fetchConfig(ctx.saleorApiUrl, ctx.appToken),
      fetchSaleorChannels(ctx.saleorApiUrl, ctx.appToken),
    ]);

    return saleorChannels.map((ch: any) => {
      const existing = config.channels.find((c) => c.channelSlug === ch.slug);
      return {
        channelSlug: ch.slug,
        channelName: ch.name,
        currencyCode: ch.currencyCode,
        config: existing ?? {
          channelSlug: ch.slug,
          enabled: false,
          pricesIncludeTax: false,
          defaultTaxRate: 0,
          exportZeroRating: { enabled: true, domesticCountryCode: "IL" },
        },
      };
    });
  }),

  update: protectedClientProcedure
    .input(ChannelTaxConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      const index = config.channels.findIndex((c) => c.channelSlug === input.channelSlug);

      if (index >= 0) {
        config.channels[index] = input;
      } else {
        config.channels.push(input);
      }

      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      logger.info("Channel config updated", { channel: input.channelSlug });
      return input;
    }),

  getGlobalEnabled: protectedClientProcedure.query(async ({ ctx }) => {
    const { config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
    return { enabled: config.enabled, logTransactions: config.logTransactions };
  }),

  updateGlobalEnabled: protectedClientProcedure
    .input(z.object({ enabled: z.boolean().optional(), logTransactions: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      if (input.enabled !== undefined) config.enabled = input.enabled;
      if (input.logTransactions !== undefined) config.logTransactions = input.logTransactions;
      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      return { enabled: config.enabled, logTransactions: config.logTransactions };
    }),
});
