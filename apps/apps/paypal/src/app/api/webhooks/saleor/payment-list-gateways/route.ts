
import { compose } from "@saleor/apps-shared/compose";

import { appContextContainer } from "@/lib/app-context";
import { createLogger } from "@/lib/logger";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";

import { withRecipientVerification } from "../with-recipient-verification";
import { paymentListGatewaysWebhookDefinition } from "./webhook-definition";

const logger = createLogger("PAYMENT_LIST_GATEWAYS");

const handler = paymentListGatewaysWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);

      if (saleorApiUrlResult.isErr()) {
        return Response.json([]);
      }

      const channelId =
        ctx.payload.checkout?.channel?.id ?? undefined;

      if (!channelId) {
        // No channel — try to find any configured channel
        const rootConfigResult = await appConfigRepoImpl.getRootConfig({
          saleorApiUrl: saleorApiUrlResult.value,
          appId: ctx.authData.appId,
        });

        if (rootConfigResult.isErr() || rootConfigResult.value.getAllConfigsAsList().length === 0) {
          return Response.json([]);
        }

        // Return PayPal as available
        return Response.json([
          {
            id: "saleor.app.payment.paypal",
            name: "PayPal",
            currencies: ["USD", "EUR", "GBP", "ILS", "CAD", "AUD"],
          },
        ]);
      }

      const configResult = await appConfigRepoImpl.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: ctx.authData.appId,
        channelId,
      });

      if (configResult.isErr() || !configResult.value) {
        return Response.json([]);
      }

      return Response.json([
        {
          id: "saleor.app.payment.paypal",
          name: "PayPal",
          currencies: ["USD", "EUR", "GBP", "ILS", "CAD", "AUD"],
          data: {
            paypalClientId: String(configResult.value.clientId),
          },
        },
      ]);
    } catch (error) {
      logger.error("Unhandled error in payment-list-gateways", { error });
      return Response.json([]);
    }
  }),
);

export const POST = compose(appContextContainer.wrapRequest)(handler);
