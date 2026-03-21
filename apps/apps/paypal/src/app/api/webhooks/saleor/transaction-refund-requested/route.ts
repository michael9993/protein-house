
import { compose } from "@saleor/apps-shared/compose";

import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { createPayPalOrderId } from "@/modules/paypal/paypal-order-id";
import { createPayPalMoney, parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { generatePayPalOrderUrl } from "@/modules/paypal/generate-paypal-dashboard-urls";
import { UnhandledErrorResponse } from "@/app/api/webhooks/saleor/saleor-webhook-responses";

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionRefundRequestedWebhookDefinition } from "./webhook-definition";

const logger = createLogger("TRANSACTION_REFUND_REQUESTED");

const handler = transactionRefundRequestedWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      logger.info("Refund webhook received", {
        payload: JSON.stringify(ctx.payload).slice(0, 500),
      });

      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);
      if (saleorApiUrlResult.isErr()) {
        logger.error("Malformed saleorApiUrl");
        return Response.json({ result: "REFUND_FAILURE", message: "Malformed request" });
      }

      const event = ctx.payload;
      const channelId = event.sourceObject?.channel?.id ?? event.transaction?.checkout?.channel?.id ?? event.transaction?.order?.channel?.id;
      const pspReference = event.transaction?.pspReference;

      logger.info("Refund context", { channelId, pspReference });

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

      const client = new PayPalApiClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment: config.environment,
      });

      const isSandbox = config.environment === "SANDBOX";
      const externalUrl = generatePayPalOrderUrl(pspReference, isSandbox);

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
      const refundCurrency = event.action.currency ?? capture.amount?.currency_code ?? "USD";

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
      const refundedAmount = refund.amount?.value ? parsePayPalAmount(refund.amount.value) : event.action.amount;

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
          externalUrl,
          message: "Refund processed successfully",
        });
      }

      // Pending refund — Saleor only supports REFUND_SUCCESS/REFUND_FAILURE,
      // so record it as success (PayPal will complete asynchronously)
      return Response.json({
        result: "REFUND_SUCCESS",
        pspReference: refund.id,
        amount: refundedAmount,
        externalUrl,
        message: "Refund pending — PayPal will complete asynchronously",
      });
    } catch (error) {
      logger.error("Unhandled error", { error });
      return Response.json({
        result: "REFUND_FAILURE",
        pspReference: ctx.payload?.transaction?.pspReference ?? "unknown",
        message: error instanceof Error ? error.message : "Internal error",
      });
    }
  }),
);

export const POST = compose(appContextContainer.wrapRequest)(handler);
