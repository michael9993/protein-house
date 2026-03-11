import { z } from "zod";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { fetchConfig, saveConfig } from "../config-repository";
import { PRESETS, PresetId } from "@/modules/tax-engine/presets";
import { createLogger } from "@/logger";

const logger = createLogger("presets-router");

export const presetsRouter = router({
  list: protectedClientProcedure.query(async () => {
    return Object.entries(PRESETS).map(([id, preset]) => ({
      id: id as PresetId,
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
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
      const preset = PRESETS[input.presetId];
      const newRules = preset.factory();

      if (input.mode === "replace") {
        const presetCountries = new Set(newRules.map((r) => r.countryCode));
        config.rules = config.rules.filter((r) => !presetCountries.has(r.countryCode));
      }

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

      await saveConfig(ctx.saleorApiUrl!, ctx.appToken!, appId, config);
      logger.info("Preset applied", { preset: input.presetId, mode: input.mode, rulesAdded: newRules.length });
      return { added: newRules.length, total: config.rules.length };
    }),

  removePreset: protectedClientProcedure
    .input(z.object({ presetId: z.enum(["israel", "eu", "us", "zero-tax"] as const) }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
      const preset = PRESETS[input.presetId];
      const presetRules = preset.factory();
      const presetCountries = new Set(
        presetRules.map((r) => `${r.countryCode}:${r.countryArea ?? ""}`)
      );

      const before = config.rules.length;
      config.rules = config.rules.filter(
        (r) => !presetCountries.has(`${r.countryCode}:${r.countryArea ?? ""}`)
      );

      await saveConfig(ctx.saleorApiUrl!, ctx.appToken!, appId, config);
      return { removed: before - config.rules.length, total: config.rules.length };
    }),
});
