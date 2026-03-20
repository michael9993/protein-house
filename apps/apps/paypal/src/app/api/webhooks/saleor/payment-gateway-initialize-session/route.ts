
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

import { withRecipientVerification } from "../with-recipient-verification";
import { paymentGatewayInitializeSessionWebhookDefinition } from "./webhook-definition";

const logger = createLogger("PAYMENT_GATEWAY_INITIALIZE_SESSION");

const handler = paymentGatewayInitializeSessionWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);

      if (saleorApiUrlResult.isErr()) {
        return new MalformedRequestResponse(
          appContextContainer.getContextValue(),
          saleorApiUrlResult.error,
        ).getResponse();
      }

      const channelId = ctx.payload.sourceObject?.channel?.id;

      if (!channelId) {
        logger.warn("No channel ID in payload");
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

      // Try sandbox first, then live
      const sandboxClient = new PayPalApiClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment: "SANDBOX",
      });
      const sandboxValid = await sandboxClient.validateCredentials();
      const environment = sandboxValid.isOk() ? "SANDBOX" : "LIVE";

      logger.info("Returning PayPal gateway config", {
        channelId,
        environment,
      });

      // Query channel's default transaction flow strategy to match transaction-initialize-session
      const channelSlug = ctx.payload.sourceObject?.channel?.slug;
      let paypalIntent: "capture" | "authorize" = "capture";

      if (channelSlug) {
        try {
          const saleorUrl = process.env.SALEOR_API_URL || ctx.authData.saleorApiUrl;
          const response = await fetch(saleorUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ctx.authData.token}`,
            },
            body: JSON.stringify({
              query: `query { channel(slug: "${channelSlug}") { defaultTransactionFlowStrategy } }`,
            }),
          });
          const result = await response.json();
          const strategy = result?.data?.channel?.defaultTransactionFlowStrategy;
          if (strategy === "AUTHORIZATION") {
            paypalIntent = "authorize";
          }
          logger.info("Resolved channel transaction flow", { channelSlug, strategy, paypalIntent });
        } catch (err) {
          logger.warn("Failed to query channel flow strategy, defaulting to capture", { error: err });
        }
      }

      return Response.json({
        data: {
          paypalClientId: String(config.clientId),
          paypalEnvironment: environment,
          paypalIntent,
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

export const POST = handler;
