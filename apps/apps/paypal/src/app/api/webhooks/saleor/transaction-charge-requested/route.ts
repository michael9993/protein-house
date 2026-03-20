
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

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionChargeRequestedWebhookDefinition } from "./webhook-definition";

const logger = createLogger("TRANSACTION_CHARGE_REQUESTED");

const handler = transactionChargeRequestedWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);
      if (saleorApiUrlResult.isErr()) {
        return new MalformedRequestResponse(appContextContainer.getContextValue(), saleorApiUrlResult.error).getResponse();
      }

      const event = ctx.payload;
      const channelId = event.transaction?.checkout?.channel?.id ?? event.transaction?.order?.channel?.id;

      if (!channelId) {
        return new AppIsNotConfiguredResponse(appContextContainer.getContextValue()).getResponse();
      }

      const configResult = await appConfigRepoImpl.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: ctx.authData.appId,
        channelId,
      });

      if (configResult.isErr()) {
        return new BrokenAppResponse(appContextContainer.getContextValue(), configResult.error).getResponse();
      }

      const config = configResult.value;
      if (!config) {
        return new AppIsNotConfiguredResponse(appContextContainer.getContextValue()).getResponse();
      }

      const pspReference = event.transaction?.pspReference;
      if (!pspReference) {
        return Response.json({ result: "CHARGE_FAILURE", message: "Missing pspReference" });
      }

      const orderIdResult = createPayPalOrderId(pspReference);
      if (orderIdResult.isErr()) {
        return Response.json({ result: "CHARGE_FAILURE", message: "Invalid PayPal order ID" });
      }

      const sandboxClient = new PayPalApiClient({ clientId: config.clientId, clientSecret: config.clientSecret, environment: "SANDBOX" });
      const sandboxValid = await sandboxClient.validateCredentials();
      const environment = sandboxValid.isOk() ? "SANDBOX" : "LIVE";

      const client = new PayPalApiClient({ clientId: config.clientId, clientSecret: config.clientSecret, environment });

      const captureResult = await client.captureOrder(orderIdResult.value);

      if (captureResult.isErr()) {
        return Response.json({
          result: "CHARGE_FAILURE",
          pspReference,
          message: captureResult.error.publicMessage,
          actions: ["CHARGE"],
        });
      }

      const capture = captureResult.value.purchase_units?.[0]?.payments?.captures?.[0];
      const amount = capture ? parsePayPalAmount(capture.amount.value) : event.action.amount;

      return Response.json({
        result: "CHARGE_SUCCESS",
        pspReference,
        amount,
        message: "Payment captured successfully",
        actions: ["REFUND"],
      });
    } catch (error) {
      logger.error("Unhandled error", { error });
      return new UnhandledErrorResponse(appContextContainer.getContextValue(), BaseError.normalize(error)).getResponse();
    }
  }),
);

export const POST = handler;
