import { TRPCError } from "@trpc/server";

import { PayPalFrontendConfig } from "@/modules/app-config/domain/paypal-config";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { protectedClientProcedure } from "@/modules/trpc/protected-client-procedure";

export class GetPayPalConfigsListTrpcHandler {
  baseProcedure = protectedClientProcedure;

  getTrpcProcedure() {
    return this.baseProcedure.query(async ({ ctx }) => {
      const saleorApiUrl = createSaleorApiUrl(ctx.saleorApiUrl);

      if (saleorApiUrl.isErr()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Malformed request" });
      }

      const config = await ctx.configRepo.getRootConfig({
        saleorApiUrl: saleorApiUrl.value,
        appId: ctx.appId,
      });

      if (config.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch config",
        });
      }

      return {
        configs: config.value.getAllConfigsAsList().map((c) =>
          PayPalFrontendConfig.createFromPayPalConfig(c),
        ),
        channelMappings: config.value.channelConfigMapping,
      };
    });
  }
}
