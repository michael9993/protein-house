import { APL, AuthData } from "@saleor/app-sdk/APL";
import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { captureException } from "@sentry/nextjs";
import { err, ok, Result } from "neverthrow";
import Stripe from "stripe";

import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { loggerContext } from "@/lib/logger-context";
import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import {
  ITransactionEventReporter,
  TransactionEventReporterErrors,
} from "@/modules/saleor/transaction-event-reporter";
import { StripeClient } from "@/modules/stripe/stripe-client";
import { StripeEnv } from "@/modules/stripe/stripe-env";
import { StripeRestrictedKey } from "@/modules/stripe/stripe-restricted-key";
import { StripeWebhookManager } from "@/modules/stripe/stripe-webhook-manager";
import {
  AllowedStripeObjectMetadata,
  IStripeEventVerify,
  IStripePaymentIntentsApiFactory,
} from "@/modules/stripe/types";
import {
  TransactionRecorderError,
  TransactionRecorderRepo,
} from "@/modules/transactions-recording/repositories/transaction-recorder-repo";

import { StripePaymentIntentHandler } from "./stripe-object-handlers/stripe-payment-intent-handler";
import { StripeRefundHandler } from "./stripe-object-handlers/stripe-refund-handler";
import {
  ObjectCreatedOutsideOfSaleorResponse,
  PossibleStripeWebhookErrorResponses,
  PossibleStripeWebhookSuccessResponses,
  StripeWebhookAppIsNotConfiguredResponse,
  StripeWebhookMalformedRequestResponse,
  StripeWebhookSeverErrorResponse,
  StripeWebhookSuccessResponse,
  StripeWebhookTransactionMissingResponse,
} from "./stripe-webhook-responses";
import { WebhookParams } from "./webhook-params";

type R = Promise<
  Result<PossibleStripeWebhookSuccessResponses, PossibleStripeWebhookErrorResponses>
>;

type StripeVerifyEventFactory = (stripeClient: StripeClient) => IStripeEventVerify;
type SaleorTransactionEventReporterFactory = (authData: AuthData) => ITransactionEventReporter;

const ObjectMetadataMissingError = BaseError.subclass("ObjectMetadataMissingError");

export class StripeWebhookUseCase {
  private appConfigRepo: AppConfigRepo;
  private webhookEventVerifyFactory: StripeVerifyEventFactory;
  private apl: APL;
  private logger = createLogger("StripeWebhookUseCase");
  private transactionRecorder: TransactionRecorderRepo;
  private transactionEventReporterFactory: SaleorTransactionEventReporterFactory;
  private webhookManager: StripeWebhookManager;
  private stripePaymentIntentsApiFactory: IStripePaymentIntentsApiFactory;

  constructor(deps: {
    appConfigRepo: AppConfigRepo;
    webhookEventVerifyFactory: StripeVerifyEventFactory;
    apl: APL;
    transactionRecorder: TransactionRecorderRepo;
    transactionEventReporterFactory: SaleorTransactionEventReporterFactory;
    webhookManager: StripeWebhookManager;
    stripePaymentIntentsApiFactory: IStripePaymentIntentsApiFactory;
  }) {
    this.appConfigRepo = deps.appConfigRepo;
    this.webhookEventVerifyFactory = deps.webhookEventVerifyFactory;
    this.apl = deps.apl;
    this.transactionRecorder = deps.transactionRecorder;
    this.transactionEventReporterFactory = deps.transactionEventReporterFactory;
    this.webhookManager = deps.webhookManager;
    this.stripePaymentIntentsApiFactory = deps.stripePaymentIntentsApiFactory;
  }

  private async removeStripeWebhook({
    webhookId,
    restrictedKey,
  }: {
    webhookId: string;
    restrictedKey: StripeRestrictedKey;
  }) {
    const result = await this.webhookManager.removeWebhook({ webhookId, restrictedKey });

    if (result.isErr()) {
      this.logger.warn(`Failed to remove webhook ${webhookId}`, result.error);

      return err(new BaseError("Failed to remove webhook", { cause: result.error }));
    }

    this.logger.info(`Webhook ${webhookId} removed successfully`);

    return ok(null);
  }

  private async processEvent({
    event,
    saleorApiUrl,
    appId,
    stripeEnv,
    restrictedKey,
    fallbackAppIds,
  }: {
    event: Stripe.Event;
    saleorApiUrl: SaleorApiUrl;
    appId: string;
    stripeEnv: StripeEnv;
    restrictedKey: StripeRestrictedKey;
    fallbackAppIds?: string[];
  }) {
    switch (event.data.object.object) {
      case "payment_intent": {
        loggerContext.set(ObservabilityAttributes.PSP_REFERENCE, event.data.object.id);

        const meta = event.data.object.metadata as AllowedStripeObjectMetadata;

        if (!meta?.saleor_transaction_id) {
          return err(
            new ObjectMetadataMissingError(
              "Missing metadata on object, it was not created by Saleor",
              {
                props: {
                  meta,
                },
              },
            ),
          );
        }

        const handler = new StripePaymentIntentHandler();

        const stripePaymentIntentsApi = this.stripePaymentIntentsApiFactory.create({
          key: restrictedKey,
        });

        return handler.processPaymentIntentEvent({
          event,
          stripeEnv,
          transactionRecorder: this.transactionRecorder,
          appId,
          saleorApiUrl,
          stripePaymentIntentsApi,
        });
      }

      case "refund": {
        loggerContext.set("stripeRefundId", event.data.object.id);

        const meta = event.data.object.metadata as AllowedStripeObjectMetadata;

        // For refunds created from Stripe dashboard, metadata might be missing
        // but we can still look up the transaction by payment_intent ID
        // So we allow processing even without metadata
        if (!meta?.saleor_transaction_id) {
          this.logger.debug(
            "Refund object missing saleor_transaction_id metadata (likely created from Stripe dashboard). Will attempt to look up transaction by payment_intent ID.",
            {
              refundId: event.data.object.id,
              paymentIntentId: (event.data.object as Stripe.Refund).payment_intent,
            },
          );
        }

        const handler = new StripeRefundHandler();

        return handler.processRefundEvent({
          event,
          stripeEnv,
          transactionRecorder: this.transactionRecorder,
          appId,
          saleorApiUrl,
          fallbackAppIds,
        });
      }

      default: {
        throw new BaseError(`Support for object ${event.data.object.object} not implemented`);
      }
    }
  }

  /**
   * It handles case when
   * 1. App was installed and configured. Webhook exists in Stripe
   * 2. App is removed - webhook is not
   * 3. App is reinstalled and configured again
   * 4. There are now 2 webhooks - old and new. Old one will always fail.
   *
   * At this point we detect an old webhook because it has different appId in URL (from previous installation).
   * Now we can use that to fetch old config from DB and remove the webhook.
   * 
   * If the legacy config doesn't exist (app was fully uninstalled), we return success to stop Stripe from retrying.
   */
  private async processLegacyWebhook(webhookParams: WebhookParams) {
    // First, try to find config by configId with the old appId
    let legacyConfig = await this.appConfigRepo.getStripeConfig({
      configId: webhookParams.configurationId,
      // Use app ID from webhook, not AuthData, so we have it frozen in time
      appId: webhookParams.appId,
      saleorApiUrl: webhookParams.saleorApiUrl,
    });

    // If not found with old appId, try to find by configId only (in case it exists under current app)
    if (legacyConfig.isOk() && !legacyConfig.value) {
      // Get current auth data to try with current appId
      const currentAuthData = await this.apl.get(webhookParams.saleorApiUrl);
      if (currentAuthData) {
        legacyConfig = await this.appConfigRepo.getStripeConfig({
          configId: webhookParams.configurationId,
          appId: currentAuthData.appId,
          saleorApiUrl: webhookParams.saleorApiUrl,
        });
      }
    }

    if (legacyConfig.isErr()) {
      this.logger.warn(
        "Failed to fetch config attached to legacy Webhook. Config may have been removed. Returning success to stop Stripe retries.",
        {
          configurationId: webhookParams.configurationId,
          appId: webhookParams.appId,
          error: legacyConfig.error,
        },
      );

      // Return success so Stripe stops retrying this webhook
      return ok(null);
    }

    if (!legacyConfig.value) {
      this.logger.warn(
        "Legacy config not found. This webhook is from an uninstalled app. Returning success to stop Stripe retries.",
        {
          configurationId: webhookParams.configurationId,
          appId: webhookParams.appId,
        },
      );

      // Return success so Stripe stops retrying this webhook
      return ok(null);
    }

    // Config found - try to remove the webhook
    const removalResult = await this.removeStripeWebhook({
      webhookId: legacyConfig.value.webhookId,
      restrictedKey: legacyConfig.value.restrictedKey,
    });

    if (removalResult.isErr()) {
      this.logger.warn("Failed to remove legacy webhook, but returning success to stop retries", {
        webhookId: legacyConfig.value.webhookId,
        error: removalResult.error,
      });
      // Still return success to stop Stripe from retrying
      return ok(null);
    }

    this.logger.info("Successfully removed legacy webhook", {
      webhookId: legacyConfig.value.webhookId,
    });

    return ok(null);
  }

  async execute({
    rawBody,
    signatureHeader,
    webhookParams,
  }: {
    /**
     * Raw request body for signature verification
     */
    rawBody: string;
    /**
     * Header that Stripe sends with webhook
     */
    signatureHeader: string;
    /**
     * Parsed params that come from Stripe Webhook
     */
    webhookParams: WebhookParams;
  }): R {
    this.logger.debug("Executing");
    const authData = await this.apl.get(webhookParams.saleorApiUrl);

    if (!authData) {
      captureException(
        new BaseError("AuthData from APL is empty, installation may be broken"),
        (s) => s.setLevel("warning"),
      );

      return err(new StripeWebhookAppIsNotConfiguredResponse());
    }

    if (authData.appId !== webhookParams.appId) {
      this.logger.warn(
        "Received webhook with different appId than expected. There may be old webhook from uninstalled app. Will try to process it or remove it.",
        {
          expectedAppId: authData.appId,
          receivedAppId: webhookParams.appId,
        },
      );

      // First, try to find a config for this webhook (legacy or current)
      let config = await this.appConfigRepo.getStripeConfig({
        configId: webhookParams.configurationId,
        appId: webhookParams.appId,
        saleorApiUrl: webhookParams.saleorApiUrl,
      });

      // If not found with old appId, try with current appId
      if (config.isOk() && !config.value) {
        config = await this.appConfigRepo.getStripeConfig({
          configId: webhookParams.configurationId,
          appId: authData.appId,
          saleorApiUrl: webhookParams.saleorApiUrl,
        });
      }

      // If we found a config, try to process the event (for refunds/captures that need to be processed)
      if (config.isOk() && config.value) {
        this.logger.info(
          "Found config for legacy webhook, attempting to process event",
          {
            configurationId: webhookParams.configurationId,
          },
        );

        appContextContainer.set({
          stripeEnv: config.value.getStripeEnvValue(),
        });

        const stripeClient = StripeClient.createFromRestrictedKey(config.value.restrictedKey);
        const eventVerifier = this.webhookEventVerifyFactory(stripeClient);

        const event = eventVerifier.verifyEvent({
          rawBody,
          webhookSecret: config.value.webhookSecret,
          signatureHeader,
        });

        if (event.isOk()) {
          // Try to process with the old appId first (transaction might be recorded with it)
          // Pass both appIds so the handler can try fallbacks
          let processingResult = await this.processEvent({
            event: event.value,
            saleorApiUrl: webhookParams.saleorApiUrl,
            appId: webhookParams.appId, // Use old appId - transaction might be recorded with it
            stripeEnv: config.value.getStripeEnvValue(),
            restrictedKey: config.value.restrictedKey,
            fallbackAppIds: [authData.appId], // Provide current appId as fallback
          });

          // If that fails with TransactionMissingError, try with current appId directly
          if (processingResult.isErr() && processingResult.error instanceof TransactionRecorderError.TransactionMissingError) {
            this.logger.debug("Transaction not found with old appId, trying current appId directly");
            processingResult = await this.processEvent({
              event: event.value,
              saleorApiUrl: webhookParams.saleorApiUrl,
              appId: authData.appId, // Try with current appId
              stripeEnv: config.value.getStripeEnvValue(),
              restrictedKey: config.value.restrictedKey,
              fallbackAppIds: [webhookParams.appId], // Provide old appId as fallback
            });
          }

          if (processingResult.isOk()) {
            // Successfully processed - report the event using current auth data
            const transactionEventReporter = this.transactionEventReporterFactory(authData);
            const reportResult = await transactionEventReporter.reportTransactionEvent(
              processingResult.value.resolveEventReportVariables(),
            );

            if (reportResult.isOk() || reportResult.error instanceof TransactionEventReporterErrors.AlreadyReportedError) {
              this.logger.info("Successfully processed legacy webhook event");
              return ok(new StripeWebhookSuccessResponse());
            } else {
              this.logger.warn("Processed event but failed to report it", {
                error: reportResult.error,
              });
              // Still return success to stop retries
              return ok(new StripeWebhookSuccessResponse());
            }
          } else if (processingResult.error instanceof ObjectMetadataMissingError) {
            // Object created outside of Saleor - this is expected for some webhooks
            this.logger.debug("Event object was created outside of Saleor, ignoring");
            return ok(new StripeWebhookSuccessResponse());
          } else {
            this.logger.warn("Failed to process legacy webhook event", {
              error: processingResult.error,
            });
          }
        } else {
          this.logger.warn("Failed to verify legacy webhook event signature", {
            error: event.error,
          });
        }
      }

      // If we couldn't process it, try to remove the webhook
      const cleanupResult = await this.processLegacyWebhook(webhookParams);

      if (cleanupResult.isErr()) {
        this.logger.warn("Received legacy webhook but failed to handle removing it", {
          error: cleanupResult.error,
        });
      }

      // Always return success for legacy webhooks to stop Stripe from retrying
      return ok(new StripeWebhookSuccessResponse());
    }

    const transactionEventReporter = this.transactionEventReporterFactory(authData);

    const config = await this.appConfigRepo.getStripeConfig({
      configId: webhookParams.configurationId,
      appId: authData.appId,
      saleorApiUrl: webhookParams.saleorApiUrl,
    });

    this.logger.debug("Configuration for config resolved");

    if (config.isErr()) {
      this.logger.error("Failed to fetch config from database", {
        error: config.error,
      });

      captureException(config.error);

      return err(new StripeWebhookAppIsNotConfiguredResponse());
    }

    if (!config.value) {
      this.logger.error("Config for given webhook is missing");

      return err(new StripeWebhookAppIsNotConfiguredResponse());
    }

    appContextContainer.set({
      stripeEnv: config.value.getStripeEnvValue(),
    });

    const stripeClient = StripeClient.createFromRestrictedKey(config.value.restrictedKey);
    const eventVerifier = this.webhookEventVerifyFactory(stripeClient);

    const event = eventVerifier.verifyEvent({
      rawBody,
      webhookSecret: config.value.webhookSecret,
      signatureHeader,
    });

    this.logger.debug("Event verified");

    if (event.isErr()) {
      this.logger.error("Failed to verify event", {
        error: event.error,
      });

      return err(new StripeWebhookMalformedRequestResponse());
    }

    const eventObjectId = (event.value.data?.object as { id?: string } | undefined)?.id;
    this.logger.debug(`Resolved event type: ${event.value.type}`, {
      eventType: event.value.type,
      paymentIntentId: eventObjectId,
    });

    const processingResult = await this.processEvent({
      event: event.value,
      saleorApiUrl: webhookParams.saleorApiUrl,
      appId: authData.appId,
      stripeEnv: config.value.getStripeEnvValue(),
      restrictedKey: config.value.restrictedKey,
      // No fallback needed for normal webhooks (appId matches)
    });

    if (processingResult.isErr()) {
      /**
       * This is technically not an error, so we catch it here without the error log.
       */
      if (processingResult.error instanceof ObjectMetadataMissingError) {
        return err(new ObjectCreatedOutsideOfSaleorResponse());
      }

      this.logger.error("Failed to process event", {
        error: processingResult.error,
      });

      if (processingResult.error instanceof TransactionRecorderError.TransactionMissingError) {
        this.logger.error("Transaction not found for webhook event", {
          eventType: event.value.type,
          paymentIntentId: eventObjectId,
          appId: authData.appId,
          saleorApiUrl: webhookParams.saleorApiUrl.toString(),
        });
        return err(new StripeWebhookTransactionMissingResponse());
      }

      return err(new StripeWebhookSeverErrorResponse());
    }

    loggerContext.set(
      ObservabilityAttributes.TRANSACTION_ID,
      processingResult.value.saleorTransactionId,
    );
    loggerContext.set("amount", processingResult.value.saleorMoney.amount);
    loggerContext.set("result", processingResult.value.transactionResult.result);

    const reportResult = await transactionEventReporter.reportTransactionEvent(
      processingResult.value.resolveEventReportVariables(),
    );

    if (reportResult.isErr()) {
      if (reportResult.error instanceof TransactionEventReporterErrors.AlreadyReportedError) {
        this.logger.info("Transaction event already reported");

        return ok(new StripeWebhookSuccessResponse());
      }

      this.logger.error("Failed to report transaction event", {
        error: reportResult.error,
      });

      return err(new StripeWebhookSeverErrorResponse());
    }

    this.logger.info("Transaction event reported");

    return ok(new StripeWebhookSuccessResponse());
  }
}
