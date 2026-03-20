
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { createPayPalOrderId } from "@/modules/paypal/paypal-order-id";
import { createPayPalMoney, parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { UnhandledErrorResponse } from "@/app/api/webhooks/saleor/saleor-webhook-responses";

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionRefundRequestedWebhookDefinition } from "./webhook-definition";

const logger = createLogger("TRANSACTION_REFUND_REQUESTED");

const handler = transactionRefundRequestedWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);
      if (saleorApiUrlResult.isErr()) {
        return Response.json({ result: "REFUND_FAILURE", message: "Malformed request" });
      }

      const event = ctx.payload;
      const channelId = event.transaction?.checkout?.channel?.id ?? event.transaction?.order?.channel?.id;
      const pspReference = event.transaction?.pspReference;

      if (!channelId || !pspReference) {
        return Response.json({ result: "REFUND_FAILURE", message: "Missing channel or pspReference" });
      }

      const configResult = await appConfigRepoImpl.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: ctx.authData.appId,
        channelId,
      });

      if (configResult.isErr() || !configResult.value) {
        return Response.json({ result: "REFUND_FAILURE", message: "Config not found" });
      }

      const config = configResult.value;
      const orderIdResult = createPayPalOrderId(pspReference);
      if (orderIdResult.isErr()) {
        return Response.json({ result: "REFUND_FAILURE", message: "Invalid PayPal order ID" });
      }

      const sandboxClient = new PayPalApiClient({ clientId: config.clientId, clientSecret: config.clientSecret, environment: "SANDBOX" });
      const sandboxValid = await sandboxClient.validateCredentials();
      const environment = sandboxValid.isOk() ? "SANDBOX" : "LIVE";
      const client = new PayPalApiClient({ clientId: config.clientId, clientSecret: config.clientSecret, environment });

      // Get order to find capture ID
      const orderResult = await client.getOrder(orderIdResult.value);
      if (orderResult.isErr()) {
        return Response.json({
          result: "REFUND_FAILURE",
          pspReference,
          message: `Failed to get order: ${orderResult.error.publicMessage}`,
        });
      }

      const capture = orderResult.value.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture) {
        return Response.json({
          result: "REFUND_FAILURE",
          pspReference,
          message: "No capture found for this order",
        });
      }

      // Refund — partial if amount provided, full otherwise
      const refundAmount = event.action.amount;
      const refundCurrency = event.action.currency ?? capture.amount.currency_code;

      const paypalRefundAmount = refundAmount
        ? createPayPalMoney(refundAmount, refundCurrency)
        : undefined;

      const refundResult = await client.refundCapture(capture.id, paypalRefundAmount);

      if (refundResult.isErr()) {
        return Response.json({
          result: "REFUND_FAILURE",
          pspReference,
          message: `Refund failed: ${refundResult.error.publicMessage}`,
          actions: ["REFUND"],
        });
      }

      const refund = refundResult.value;
      const refundedAmount = parsePayPalAmount(refund.amount.value);

      logger.info("Refund processed", {
        refundId: refund.id,
        refundStatus: refund.status,
        amount: refundedAmount,
      });

      if (refund.status === "COMPLETED") {
        return Response.json({
          result: "REFUND_SUCCESS",
          pspReference: refund.id,
          amount: refundedAmount,
          message: "Refund processed successfully",
        });
      }

      // Pending refund — use async flow
      return Response.json({
        pspReference: refund.id,
      });
    } catch (error) {
      logger.error("Unhandled error", { error });
      return new UnhandledErrorResponse(appContextContainer.getContextValue(), BaseError.normalize(error)).getResponse();
    }
  }),
);

export const POST = handler;
