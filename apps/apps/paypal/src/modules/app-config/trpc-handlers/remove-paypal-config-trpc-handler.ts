import { TRPCError } from "@trpc/server";
import { Result } from "neverthrow";
import { z } from "zod";

import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { protectedClientProcedure } from "@/modules/trpc/protected-client-procedure";

export class RemovePayPalConfigTrpcHandler {
  baseProcedure = protectedClientProcedure;

  getTrpcProcedure() {
    return this.baseProcedure
      .input(z.object({ configId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const saleorApiUrl = createSaleorApiUrl(ctx.saleorApiUrl);

        if (saleorApiUrl.isErr()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Malformed request" });
        }

        const rootConfigResult = await ctx.configRepo.getRootConfig({
          saleorApiUrl: saleorApiUrl.value,
          appId: ctx.appId,
        });

        if (rootConfigResult.isErr()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch config.",
          });
        }

        const rootConfig = rootConfigResult.value;
        const configToRemove = rootConfig.paypalConfigsById[input.configId];

        if (!configToRemove) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Config not found." });
        }

        // Unbind all channels
        const channelsToUnbind = rootConfig.getChannelsBoundToGivenConfig(input.configId);

        const unbindResults = Result.combine(
          await Promise.all(
            channelsToUnbind.map((id) =>
              ctx.configRepo.updateMapping(
                { saleorApiUrl: saleorApiUrl.value, appId: ctx.appId },
                { configId: null, channelId: id },
              ),
            ),
          ),
        );

        if (unbindResults.isErr()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to unbind channels.",
          });
        }

        const removalResult = await ctx.configRepo.removeConfig(
          { saleorApiUrl: saleorApiUrl.value, appId: ctx.appId },
          { configId: input.configId },
        );

        if (removalResult.isErr()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to remove PayPal configuration.",
          });
        }
      });
  }
}
