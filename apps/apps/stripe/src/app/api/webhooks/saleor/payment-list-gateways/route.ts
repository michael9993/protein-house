import { withSpanAttributesAppRouter } from "@saleor/apps-otel/src/with-span-attributes";
import { compose } from "@saleor/apps-shared/compose";
import { captureException } from "@sentry/nextjs";

import {
  MalformedRequestResponse,
  UnhandledErrorResponse,
} from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { withLoggerContext } from "@/lib/logger-context";
import { setObservabilitySaleorApiUrl } from "@/lib/observability-saleor-api-url";
import { setObservabilitySourceObjectId } from "@/lib/observability-source-object-id";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";

import { withRecipientVerification } from "../with-recipient-verification";
import { PaymentListGatewaysUseCase } from "./use-case";
import { paymentListGatewaysWebhookDefinition } from "./webhook-definition";

const useCase = new PaymentListGatewaysUseCase({
  appConfigRepo: appConfigRepoImpl,
});

const logger = createLogger("PAYMENT_LIST_GATEWAYS route");

const handler = paymentListGatewaysWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      // Only set observability source if checkout ID exists
      if (ctx.payload.checkout?.id) {
        setObservabilitySourceObjectId(ctx.payload.checkout.id);
      }

      logger.info("Received webhook request");

      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);

      if (saleorApiUrlResult.isErr()) {
        const response = new MalformedRequestResponse(
          appContextContainer.getContextValue(),
          saleorApiUrlResult.error,
        );

        captureException(saleorApiUrlResult.error);

        return response.getResponse();
      }

      setObservabilitySaleorApiUrl(saleorApiUrlResult.value, ctx.payload.version);

      const channelId = ctx.payload.checkout?.channel?.id;

      if (!channelId) {
        logger.info("No channel ID in payload (query without checkout context), returning gateway for any configured channel");
        // When queried without checkout (e.g., shop.availablePaymentGateways),
        // return the gateway if ANY channel has Stripe configured
        const result = await useCase.executeForAnyChannel({
          appId: ctx.authData.appId,
          saleorApiUrl: saleorApiUrlResult.value,
        });

        return result.match(
          (result) => {
            logger.info("Successfully processed webhook request (any channel)", {
              httpsStatusCode: result.statusCode,
              gatewaysCount: result.gateways.length,
            });

            try {
              return result.getResponse();
            } catch (responseError) {
              logger.error("Error getting response from result", {
                error: responseError instanceof Error ? responseError.message : String(responseError),
                stack: responseError instanceof Error ? responseError.stack : undefined,
              });
              throw responseError;
            }
          },
          (err) => {
            logger.warn("Failed to process webhook request (any channel)", {
              httpsStatusCode: err.statusCode,
              reason: err.message,
            });

            try {
              return err.getResponse();
            } catch (responseError) {
              logger.error("Error getting response from error", {
                error: responseError instanceof Error ? responseError.message : String(responseError),
                stack: responseError instanceof Error ? responseError.stack : undefined,
              });
              throw responseError;
            }
          },
        );
      }

      const result = await useCase.execute({
        channelId,
        appId: ctx.authData.appId,
        saleorApiUrl: saleorApiUrlResult.value,
      });

      return result.match(
        (result) => {
          logger.info("Successfully processed webhook request", {
            httpsStatusCode: result.statusCode,
            gatewaysCount: result.gateways.length,
          });

          try {
            return result.getResponse();
          } catch (responseError) {
            logger.error("Error getting response from result", {
              error: responseError instanceof Error ? responseError.message : String(responseError),
              stack: responseError instanceof Error ? responseError.stack : undefined,
            });
            throw responseError;
          }
        },
        (err) => {
          logger.warn("Failed to process webhook request", {
            httpsStatusCode: err.statusCode,
            reason: err.message,
          });

          try {
            return err.getResponse();
          } catch (responseError) {
            logger.error("Error getting response from error", {
              error: responseError instanceof Error ? responseError.message : String(responseError),
              stack: responseError instanceof Error ? responseError.stack : undefined,
            });
            throw responseError;
          }
        },
      );
    } catch (error) {
      captureException(error);
      
      // Log detailed error information
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        errorString: String(error),
      };
      
      logger.error("Unhandled error", errorDetails);

      try {
        const appContext = appContextContainer.getContextValue();
        const normalizedError = BaseError.normalize(error);
        const response = new UnhandledErrorResponse(appContext, normalizedError);
        return response.getResponse();
      } catch (responseError) {
        logger.error("Error creating error response", {
          originalError: errorDetails,
          responseError: responseError instanceof Error ? responseError.message : String(responseError),
          responseErrorStack: responseError instanceof Error ? responseError.stack : undefined,
        });
        
        // Fallback: return a basic error response
        return Response.json(
          { message: "Unhandled error", details: errorDetails.message },
          { status: 500 },
        );
      }
    }
  }),
);

export const POST = compose(
  withLoggerContext,
  appContextContainer.wrapRequest,
  withSpanAttributesAppRouter,
)(handler);
