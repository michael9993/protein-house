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
import { transactionChargeRequestedWebhookDefinition } from "./webhook-definition";
import { TransactionChargeRequestedUseCase } from "./use-case";

const logger = createLogger("TRANSACTION_CHARGE_REQUESTED route");

const handler = transactionChargeRequestedWebhookDefinition.createHandler(
  withRecipientVerification(async (_req, ctx) => {
    try {
      // TransactionChargeRequested has no sourceObject; extract from transaction
      const sourceCheckout = ctx.payload.transaction?.checkout;
      const sourceOrder = ctx.payload.transaction?.order;
      if (sourceCheckout) {
        setObservabilitySourceObjectId({ __typename: "Checkout", id: sourceCheckout.id });
      } else if (sourceOrder) {
        setObservabilitySourceObjectId({ __typename: "Order", id: sourceOrder.id });
      }

      logger.info("Received webhook request", {
        [ObservabilityAttributes.TRANSACTION_AMOUNT]: ctx.payload.action.amount ?? null,
        [ObservabilityAttributes.PSP_REFERENCE]: ctx.payload.transaction?.pspReference ?? null,
      });

      const saleorApiUrlResult = createSaleorApiUrl(ctx.authData.saleorApiUrl);

      if (saleorApiUrlResult.isErr()) {
        captureException(saleorApiUrlResult.error);
        return new MalformedRequestResponse(
          appContextContainer.getContextValue(),
          saleorApiUrlResult.error,
        ).getResponse();
      }

      const useCase = new TransactionChargeRequestedUseCase({
        configRepo: appConfigRepoImpl,
        logger: createLogger("TRANSACTION_CHARGE_REQUESTED"),
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
