import { TRPCError } from "@trpc/server";
import { Result } from "neverthrow";
import { z } from "zod";

import { createLogger } from "@/lib/logger";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { deletePayPalWebhook } from "@/modules/paypal/paypal-webhook-manager";
import { protectedClientProcedure } from "@/modules/trpc/protected-client-procedure";

const logger = createLogger("RemovePayPalConfig");

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

        // Delete PayPal webhook if one was registered
        if (configToRemove.webhookId) {
          const client = new PayPalApiClient({
            clientId: configToRemove.clientId,
            clientSecret: configToRemove.clientSecret,
            environment: configToRemove.environment,
          });
          const webhookDeleteResult = await deletePayPalWebhook(client, configToRemove.webhookId);
          if (webhookDeleteResult.isErr()) {
            // Non-fatal — continue with config removal even if webhook deletion fails
            logger.warn("Failed to delete PayPal webhook, continuing with config removal", {
              webhookId: configToRemove.webhookId,
              error: webhookDeleteResult.error.message,
            });
          }
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
