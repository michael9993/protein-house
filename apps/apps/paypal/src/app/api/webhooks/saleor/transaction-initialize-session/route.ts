
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
import { createPayPalMoney } from "@/modules/paypal/paypal-money";

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionInitializeSessionWebhookDefinition } from "./webhook-definition";

const logger = createLogger("TRANSACTION_INITIALIZE_SESSION");

const handler = transactionInitializeSessionWebhookDefinition.createHandler(
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
        event.sourceObject?.channel?.id ?? undefined;

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

      // Determine PayPal environment
      const sandboxClient = new PayPalApiClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment: "SANDBOX",
      });
      const sandboxValid = await sandboxClient.validateCredentials();
      const environment = sandboxValid.isOk() ? "SANDBOX" : "LIVE";

      const client = new PayPalApiClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment,
      });

      // Get amount from Saleor event
      const saleorAmount = event.action.amount;
      const saleorCurrency = event.action.currency;

      if (!saleorAmount || !saleorCurrency) {
        return new BrokenAppResponse(
          appContextContainer.getContextValue(),
          new BaseError("Missing amount or currency in transaction event"),
        ).getResponse();
      }

      const paypalMoney = createPayPalMoney(saleorAmount, saleorCurrency);

      // Determine intent from Saleor action type (controlled by channel's default transaction flow)
      const isAuthorize = event.action.actionType === "AUTHORIZATION";
      const intent = isAuthorize ? "AUTHORIZE" : "CAPTURE";

      // Fetch billing address from Saleor to pre-fill PayPal's card form
      let payer: Parameters<typeof client.createOrder>[0]["payer"];
      const sourceId = event.sourceObject?.id;
      const sourceType = event.sourceObject?.__typename;
      if (sourceId) {
        try {
          const saleorUrl = process.env.SALEOR_API_URL || ctx.authData.saleorApiUrl;
          const query = sourceType === "Checkout"
            ? `query { checkout(id: "${sourceId}") { billingAddress { firstName lastName streetAddress1 streetAddress2 city countryArea postalCode country { code } } email } }`
            : `query { order(id: "${sourceId}") { billingAddress { firstName lastName streetAddress1 streetAddress2 city countryArea postalCode country { code } } userEmail } }`;
          const resp = await fetch(saleorUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ctx.authData.token}` },
            body: JSON.stringify({ query }),
          });
          const result = await resp.json();
          const src = result?.data?.checkout ?? result?.data?.order;
          const addr = src?.billingAddress;
          if (addr) {
            payer = {
              name: { given_name: addr.firstName || "", surname: addr.lastName || "" },
              email_address: src.email ?? src.userEmail,
              address: {
                address_line_1: addr.streetAddress1 || undefined,
                address_line_2: addr.streetAddress2 || undefined,
                admin_area_2: addr.city || undefined,
                admin_area_1: addr.countryArea || undefined,
                postal_code: addr.postalCode || undefined,
                country_code: addr.country?.code || undefined,
              },
            };
          }
        } catch (err) {
          logger.warn("Failed to fetch billing address for PayPal payer pre-fill", { error: err });
        }
      }

      // Create PayPal order
      const orderResult = await client.createOrder({
        amount: paypalMoney,
        referenceId: event.transaction?.id ?? "unknown",
        intent,
        payer,
      });

      if (orderResult.isErr()) {
        logger.error("Failed to create PayPal order", {
          error: orderResult.error.message,
        });
        return Response.json(
          {
            result: isAuthorize ? "AUTHORIZATION_FAILURE" : "CHARGE_FAILURE",
            amount: saleorAmount,
            message: `PayPal order creation failed: ${orderResult.error.publicMessage}`,
          },
          { status: 200 },
        );
      }

      const paypalOrder = orderResult.value;

      logger.info("Created PayPal order", {
        paypalOrderId: paypalOrder.id,
        status: paypalOrder.status,
        environment,
      });

      // Return action required — storefront will show PayPal buttons
      return Response.json({
        result: isAuthorize ? "AUTHORIZATION_ACTION_REQUIRED" : "CHARGE_ACTION_REQUIRED",
        amount: saleorAmount,
        pspReference: paypalOrder.id,
        data: {
          paypalOrderId: paypalOrder.id,
          paypalEnvironment: environment,
        },
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
