import { z } from "zod";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { TaxManagerConfigSchema } from "@/modules/tax-engine/schemas";
import { PRESETS, PresetId } from "@/modules/tax-engine/presets";
import { createLogger } from "@/logger";

const logger = createLogger("presets-router");

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

export const presetsRouter = router({
  list: protectedClientProcedure.query(async () => {
    return Object.entries(PRESETS).map(([id, preset]) => ({
      id,
      name: preset.name,
      count: preset.count,
    }));
  }),

  apply: protectedClientProcedure
    .input(
      z.object({
        presetId: z.enum(["israel", "eu", "us", "zero-tax"] as const),
        mode: z.enum(["merge", "replace"]).default("merge"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      const preset = PRESETS[input.presetId];
      const newRules = preset.factory();

      if (input.mode === "replace") {
        // Remove existing rules for the same countries as the preset
        const presetCountries = new Set(newRules.map((r) => r.countryCode));
        config.rules = config.rules.filter((r) => !presetCountries.has(r.countryCode));
      }

      // Add new rules (avoid duplicate country+area combos)
      for (const rule of newRules) {
        const exists = config.rules.some(
          (r) =>
            r.countryCode === rule.countryCode &&
            (r.countryArea ?? "") === (rule.countryArea ?? "")
        );
        if (!exists) {
          config.rules.push(rule);
        }
      }

      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      logger.info("Preset applied", { preset: input.presetId, mode: input.mode, rulesAdded: newRules.length });
      return { added: newRules.length, total: config.rules.length };
    }),

  removePreset: protectedClientProcedure
    .input(z.object({ presetId: z.enum(["israel", "eu", "us", "zero-tax"] as const) }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl, ctx.appToken);
      const preset = PRESETS[input.presetId];
      const presetRules = preset.factory();
      const presetCountries = new Set(
        presetRules.map((r) => `${r.countryCode}:${r.countryArea ?? ""}`)
      );

      const before = config.rules.length;
      config.rules = config.rules.filter(
        (r) => !presetCountries.has(`${r.countryCode}:${r.countryArea ?? ""}`)
      );

      await saveConfig(ctx.saleorApiUrl, ctx.appToken, appId, config);
      return { removed: before - config.rules.length, total: config.rules.length };
    }),
});
