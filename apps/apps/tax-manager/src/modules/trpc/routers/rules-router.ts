import { z } from "zod";
import { v4 as uuid } from "uuid";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { fetchConfig, saveConfig } from "../config-repository";
import { TaxRuleSchema } from "@/modules/tax-engine/schemas";
import { createLogger } from "@/logger";

const logger = createLogger("rules-router");

export const rulesRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const { config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
    return config.rules;
  }),

  create: protectedClientProcedure
    .input(TaxRuleSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
      const newRule = { ...input, id: uuid() };
      config.rules.push(newRule);
      await saveConfig(ctx.saleorApiUrl!, ctx.appToken!, appId, config);
      logger.info("Tax rule created", { rule: newRule.name, id: newRule.id });
      return newRule;
    }),

  update: protectedClientProcedure
    .input(z.object({ id: z.string().uuid(), data: TaxRuleSchema.partial().omit({ id: true }) }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
      const index = config.rules.findIndex((r) => r.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }
      config.rules[index] = { ...config.rules[index], ...input.data };
      await saveConfig(ctx.saleorApiUrl!, ctx.appToken!, appId, config);
      logger.info("Tax rule updated", { id: input.id });
      return config.rules[index];
    }),

  delete: protectedClientProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
      config.rules = config.rules.filter((r) => r.id !== input.id);
      await saveConfig(ctx.saleorApiUrl!, ctx.appToken!, appId, config);
      logger.info("Tax rule deleted", { id: input.id });
      return { success: true };
    }),

  toggleEnabled: protectedClientProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { appId, config } = await fetchConfig(ctx.saleorApiUrl!, ctx.appToken!);
      const rule = config.rules.find((r) => r.id === input.id);
      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }
      rule.enabled = input.enabled;
      await saveConfig(ctx.saleorApiUrl!, ctx.appToken!, appId, config);
      return rule;
    }),
});
