
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { createPayPalOrderId } from "@/modules/paypal/paypal-order-id";
import { UnhandledErrorResponse } from "@/app/api/webhooks/saleor/saleor-webhook-responses";

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionCancelationRequestedWebhookDefinition } from "./webhook-definition";

const logger = createLogger("TRANSACTION_CANCELATION_REQUESTED");

const handler = transactionCancelationRequestedWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);
      if (saleorApiUrlResult.isErr()) {
        return Response.json({ result: "CANCEL_FAILURE", message: "Malformed request" });
      }

      const event = ctx.payload;
      const channelId = event.transaction?.checkout?.channel?.id ?? event.transaction?.order?.channel?.id;
      const pspReference = event.transaction?.pspReference;

      if (!channelId || !pspReference) {
        return Response.json({ result: "CANCEL_FAILURE", message: "Missing channel or pspReference" });
      }

      const configResult = await appConfigRepoImpl.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: ctx.authData.appId,
        channelId,
      });

      if (configResult.isErr() || !configResult.value) {
        return Response.json({ result: "CANCEL_FAILURE", message: "Config not found" });
      }

      const config = configResult.value;
      const orderIdResult = createPayPalOrderId(pspReference);
      if (orderIdResult.isErr()) {
        return Response.json({ result: "CANCEL_FAILURE", message: "Invalid PayPal order ID" });
      }

      const sandboxClient = new PayPalApiClient({ clientId: config.clientId, clientSecret: config.clientSecret, environment: "SANDBOX" });
      const sandboxValid = await sandboxClient.validateCredentials();
      const environment = sandboxValid.isOk() ? "SANDBOX" : "LIVE";
      const client = new PayPalApiClient({ clientId: config.clientId, clientSecret: config.clientSecret, environment });

      // Get order status — if CREATED or APPROVED but not captured, it's effectively voided
      const orderResult = await client.getOrder(orderIdResult.value);

      if (orderResult.isErr()) {
        return Response.json({
          result: "CANCEL_FAILURE",
          pspReference,
          message: orderResult.error.publicMessage,
        });
      }

      const order = orderResult.value;

      // PayPal orders that aren't completed can be considered cancelled
      if (order.status === "VOIDED" || order.status === "CREATED" || order.status === "APPROVED") {
        return Response.json({
          result: "CANCEL_SUCCESS",
          pspReference,
          message: `Order ${order.status.toLowerCase()} — cancellation acknowledged`,
        });
      }

      // If already completed, can't cancel
      return Response.json({
        result: "CANCEL_FAILURE",
        pspReference,
        message: `Cannot cancel order in ${order.status} status`,
      });
    } catch (error) {
      logger.error("Unhandled error", { error });
      return new UnhandledErrorResponse(appContextContainer.getContextValue(), BaseError.normalize(error)).getResponse();
    }
  }),
);

export const POST = handler;
