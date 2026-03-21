
import { compose } from "@saleor/apps-shared/compose";

import {
  AppIsNotConfiguredResponse,
  BrokenAppResponse,
  MalformedRequestResponse,
  UnhandledErrorResponse,
} from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { createPayPalOrderId } from "@/modules/paypal/paypal-order-id";
import { parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { generatePayPalOrderUrl } from "@/modules/paypal/generate-paypal-dashboard-urls";

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionProcessSessionWebhookDefinition } from "./webhook-definition";

const logger = createLogger("TRANSACTION_PROCESS_SESSION");

const handler = transactionProcessSessionWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);

      if (saleorApiUrlResult.isErr()) {
        return new MalformedRequestResponse(
          appContextContainer.getContextValue(),
          saleorApiUrlResult.error,
        ).getResponse();
      }

      const event = ctx.payload;
      const channelId =
        event.sourceObject?.channel?.id ??
        event.transaction?.checkout?.channel?.id ??
        event.transaction?.order?.channel?.id ??
        undefined;

      if (!channelId) {
        return new AppIsNotConfiguredResponse(
          appContextContainer.getContextValue(),
        ).getResponse();
      }

      const configResult = await appConfigRepoImpl.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: ctx.authData.appId,
        channelId,
      });

      if (configResult.isErr()) {
        return new BrokenAppResponse(
          appContextContainer.getContextValue(),
          configResult.error,
        ).getResponse();
      }

      const config = configResult.value;
      if (!config) {
        return new AppIsNotConfiguredResponse(
          appContextContainer.getContextValue(),
        ).getResponse();
      }

      // Get PayPal order ID from PSP reference
      const pspReference = event.transaction?.pspReference;

      if (!pspReference) {
        return Response.json({
          result: "CHARGE_FAILURE",
          message: "Missing PayPal order ID (pspReference)",
        });
      }

      const orderIdResult = createPayPalOrderId(pspReference);
      if (orderIdResult.isErr()) {
        return Response.json({
          result: "CHARGE_FAILURE",
          message: "Invalid PayPal order ID",
        });
      }

      const client = new PayPalApiClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment: config.environment,
      });

      const isSandbox = config.environment === "SANDBOX";
      const externalUrl = generatePayPalOrderUrl(pspReference, isSandbox);

      // First, get the order to check its status
      const getOrderResult = await client.getOrder(orderIdResult.value);

      if (getOrderResult.isErr()) {
        return Response.json({
          result: "CHARGE_FAILURE",
          pspReference,
          message: `Failed to get PayPal order: ${getOrderResult.error.publicMessage}`,
        });
      }

      const order = getOrderResult.value;

      const isAuthorizeIntent = order.intent === "AUTHORIZE";

      // Extract payment method details for Saleor
      const payerEmail = order.payer?.email_address;
      const paymentMethodName = payerEmail ? `PayPal (${payerEmail})` : "PayPal";

      // If order is already COMPLETED, return success based on intent
      if (order.status === "COMPLETED") {
        if (isAuthorizeIntent) {
          // AUTHORIZE intent: order completed after authorize call — return authorization success
          const auth = order.purchase_units?.[0]?.payments?.authorizations?.[0];
          const amount = auth ? parsePayPalAmount(auth.amount.value) : event.action.amount;

          return Response.json({
            result: "AUTHORIZATION_SUCCESS",
            pspReference,
            amount,
            externalUrl,
            message: paymentMethodName,
            actions: ["CHARGE", "CANCEL"],
          });
        }

        // CAPTURE intent: already captured
        const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
        const amount = capture ? parsePayPalAmount(capture.amount.value) : event.action.amount;

        return Response.json({
          result: "CHARGE_SUCCESS",
          pspReference,
          amount,
          externalUrl,
          message: paymentMethodName,
          actions: ["REFUND"],
        });
      }

      // If order is APPROVED, handle based on intent
      if (order.status === "APPROVED") {
        if (isAuthorizeIntent) {
          // AUTHORIZE flow: authorize the order (places hold on funds, does NOT capture)
          const authResult = await client.authorizeOrder(orderIdResult.value);

          if (authResult.isErr()) {
            logger.error("Failed to authorize PayPal order", {
              orderId: pspReference,
              error: authResult.error.message,
            });
            return Response.json({
              result: "AUTHORIZATION_FAILURE",
              pspReference,
              message: `Authorization failed: ${authResult.error.publicMessage}`,
            });
          }

          const authorizedOrder = authResult.value;
          const auth = authorizedOrder.purchase_units?.[0]?.payments?.authorizations?.[0];
          const amount = auth ? parsePayPalAmount(auth.amount.value) : event.action.amount;

          logger.info("PayPal order authorized successfully", {
            orderId: pspReference,
            authorizationId: auth?.id,
            amount,
          });

          return Response.json({
            result: "AUTHORIZATION_SUCCESS",
            pspReference,
            amount,
            externalUrl,
            message: paymentMethodName,
            actions: ["CHARGE", "CANCEL"],
          });
        }

        // CAPTURE flow: capture the order
        const captureResult = await client.captureOrder(orderIdResult.value);

        if (captureResult.isErr()) {
          logger.error("Failed to capture PayPal order", {
            orderId: pspReference,
            error: captureResult.error.message,
          });
          return Response.json({
            result: "CHARGE_FAILURE",
            pspReference,
            message: `Capture failed: ${captureResult.error.publicMessage}`,
          });
        }

        const capturedOrder = captureResult.value;
        const capture = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];

        if (!capture || capture.status !== "COMPLETED") {
          return Response.json({
            result: "CHARGE_FAILURE",
            pspReference,
            message: `Capture status: ${capture?.status ?? "unknown"}`,
          });
        }

        const amount = parsePayPalAmount(capture.amount.value);

        logger.info("PayPal order captured successfully", {
          orderId: pspReference,
          captureId: capture.id,
          amount,
        });

        return Response.json({
          result: "CHARGE_SUCCESS",
          pspReference,
          amount,
          externalUrl,
          message: paymentMethodName,
          actions: ["REFUND"],
        });
      }

      // For other statuses, return failure based on intent
      return Response.json({
        result: isAuthorizeIntent ? "AUTHORIZATION_FAILURE" : "CHARGE_FAILURE",
        pspReference,
        message: `Unexpected order status: ${order.status}`,
      });
    } catch (error) {
      logger.error("Unhandled error", { error });
      return new UnhandledErrorResponse(
        appContextContainer.getContextValue(),
        BaseError.normalize(error),
      ).getResponse();
    }
  }),
);

export const POST = compose(appContextContainer.wrapRequest)(handler);
