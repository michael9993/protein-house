import { compose } from "@saleor/apps-shared/compose";

import { appContextContainer } from "@/lib/app-context";
import { createLogger } from "@/lib/logger";
import { withLoggerContext } from "@/lib/logger-context";
import {
  captureException,
  ObservabilityAttributes,
  setObservabilitySourceObjectId,
  withSpanAttributes,
} from "@/lib/observability";
import { MalformedRequestResponse, UnhandledErrorResponse } from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { BaseError } from "@/lib/errors";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";

import { withRecipientVerification } from "../with-recipient-verification";
import { transactionInitializeSessionWebhookDefinition } from "./webhook-definition";
import { TransactionInitializeSessionUseCase } from "./use-case";

const logger = createLogger("TRANSACTION_INITIALIZE_SESSION route");

const handler = transactionInitializeSessionWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      setObservabilitySourceObjectId(ctx.payload.sourceObject);

      logger.info("Received webhook request", {
        [ObservabilityAttributes.TRANSACTION_AMOUNT]: ctx.payload.action.amount ?? null,
      });

      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);

      if (saleorApiUrlResult.isErr()) {
        captureException(saleorApiUrlResult.error);
        return new MalformedRequestResponse(
          appContextContainer.getContextValue(),
          saleorApiUrlResult.error,
        ).getResponse();
      }

      const useCase = new TransactionInitializeSessionUseCase({
        configRepo: appConfigRepoImpl,
        logger: createLogger("TRANSACTION_INITIALIZE_SESSION"),
      });

      return useCase.execute(ctx.payload, ctx.authData);
    } catch (error) {
      captureException(error);
      logger.error("Unhandled error in route handler", { error });
      return new UnhandledErrorResponse(
        appContextContainer.getContextValue(),
        BaseError.normalize(error),
      ).getResponse();
    }
  }),
);

export const POST = compose(
  withLoggerContext,
  appContextContainer.wrapRequest,
  withSpanAttributes,
)(handler);
