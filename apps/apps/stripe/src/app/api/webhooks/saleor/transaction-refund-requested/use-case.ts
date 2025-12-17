import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { err, ok, Result } from "neverthrow";

import {
  AppIsNotConfiguredResponse,
  BrokenAppResponse,
  MalformedRequestResponse,
} from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { TransactionRefundRequestedEventFragment } from "@/generated/graphql";
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { loggerContext } from "@/lib/logger-context";
import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { StripeConfig } from "@/modules/app-config/domain/stripe-config";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { SaleorMoney } from "@/modules/saleor/saleor-money";
import { createSaleorTransactionId } from "@/modules/saleor/saleor-transaction-id";
import {
  getChannelIdFromRequestedEventPayload,
  getTransactionFromRequestedEventPayload,
} from "@/modules/saleor/transaction-requested-event-helpers";
import { mapStripeErrorToApiError } from "@/modules/stripe/stripe-api-error";
import { StripeMoney } from "@/modules/stripe/stripe-money";
import { createStripePaymentIntentId } from "@/modules/stripe/stripe-payment-intent-id";
import { createStripeRefundId } from "@/modules/stripe/stripe-refund-id";
import { IStripeRefundsApiFactory } from "@/modules/stripe/types";
import { RefundFailureResult } from "@/modules/transaction-result/refund-result";

import {
  TransactionRefundRequestedUseCaseResponses,
  TransactionRefundRequestedUseCaseResponsesType,
} from "./use-case-response";

type UseCaseExecuteResult = Result<
  TransactionRefundRequestedUseCaseResponsesType,
  AppIsNotConfiguredResponse | BrokenAppResponse | MalformedRequestResponse
>;

export class TransactionRefundRequestedUseCase {
  private logger = createLogger("TransactionRefundRequestedUseCase");
  private appConfigRepo: AppConfigRepo;
  private stripeRefundsApiFactory: IStripeRefundsApiFactory;

  constructor(deps: {
    appConfigRepo: AppConfigRepo;
    stripeRefundsApiFactory: IStripeRefundsApiFactory;
  }) {
    this.appConfigRepo = deps.appConfigRepo;
    this.stripeRefundsApiFactory = deps.stripeRefundsApiFactory;
  }

  async execute(args: {
    appId: string;
    saleorApiUrl: SaleorApiUrl;
    event: TransactionRefundRequestedEventFragment;
  }): Promise<UseCaseExecuteResult> {
    const { appId, saleorApiUrl, event } = args;

    const transaction = getTransactionFromRequestedEventPayload(event);
    const channelId = getChannelIdFromRequestedEventPayload(event);

    loggerContext.set(ObservabilityAttributes.PSP_REFERENCE, transaction.pspReference);

    let stripeConfig = await this.appConfigRepo.getStripeConfig({
      channelId,
      appId,
      saleorApiUrl,
    });

    if (stripeConfig.isErr()) {
      this.logger.error("Failed to get configuration", {
        error: stripeConfig.error,
      });

      return err(
        new BrokenAppResponse(
          appContextContainer.getContextValue(),
          stripeConfig.error,
        ),
      );
    }

    // Fallback: If no config for this specific channel, try to find any available config
    // Same fallback logic as TRANSACTION_CHARGE_REQUESTED to handle URL mismatches and app reinstallations
    if (!stripeConfig.value) {
      this.logger.warn("Config for channel not found, trying to find any available config", {
        channelId,
      });

      let rootConfigResult = await this.appConfigRepo.getRootConfig({
        appId,
        saleorApiUrl,
      });

      // If root config is empty and URL is localhost, try with tunnel URL pattern
      // (configs might be stored under tunnel URL)
      if (rootConfigResult.isOk() && rootConfigResult.value.getAllConfigsAsList().length === 0) {
        const saleorApiUrlStr = saleorApiUrl.toString();
        if (saleorApiUrlStr.includes("localhost:8000")) {
          this.logger.debug("Root config empty for localhost, checking if configs exist under tunnel URL");
          // Try to find any configs with tunnel URL pattern
          const { getPostgresClient } = await import("@/modules/postgres/postgres-client");
          const sql = getPostgresClient();
          const tunnelConfigs = await sql<Array<{ saleor_api_url: string }>>`
            SELECT DISTINCT saleor_api_url
            FROM stripe_configs
            WHERE saleor_api_url LIKE '%trycloudflare.com%'
              AND app_id = ${appId}
            LIMIT 1
          `;
          
          if (tunnelConfigs.length > 0) {
            const { createSaleorApiUrl } = await import("@/modules/saleor/saleor-api-url");
            const tunnelUrlResult = createSaleorApiUrl(tunnelConfigs[0].saleor_api_url);
            if (tunnelUrlResult.isOk()) {
              this.logger.info("Found configs under tunnel URL, retrying getRootConfig", {
                tunnelUrl: tunnelConfigs[0].saleor_api_url,
              });
              rootConfigResult = await this.appConfigRepo.getRootConfig({
                appId,
                saleorApiUrl: tunnelUrlResult.value,
              });
            }
          }
        }
      }

      if (rootConfigResult.isErr()) {
        this.logger.error("Failed to get root config for fallback", {
          error: rootConfigResult.error,
        });

        return err(
          new AppIsNotConfiguredResponse(
            appContextContainer.getContextValue(),
            new BaseError("Config for channel not found and failed to get root config"),
          ),
        );
      }

      const rootConfig = rootConfigResult.value;
      let allConfigs = rootConfig.getAllConfigsAsList();

      // If getAllConfigsAsList() is empty, try accessing stripeConfigsById directly
      if (allConfigs.length === 0) {
        allConfigs = Object.values(rootConfig.stripeConfigsById);
      }

      // If still empty, query ALL configs from database (handles app reinstallations and URL mismatches)
      if (allConfigs.length === 0) {
        this.logger.warn("getRootConfig() returned empty, trying to find config by querying all configs", {
          channelId,
        });

        const { getPostgresClient } = await import("@/modules/postgres/postgres-client");
        const { Encryptor } = await import("@saleor/apps-shared/encryptor");
        const { env } = await import("@/lib/env");
        const { createStripePublishableKey } = await import("@/modules/stripe/stripe-publishable-key");
        const { createStripeRestrictedKey } = await import("@/modules/stripe/stripe-restricted-key");
        const { createStripeWebhookSecret } = await import("@/modules/stripe/stripe-webhook-secret");
        
        const sql = getPostgresClient();
        const encryptor = new Encryptor(env.SECRET_KEY);

        try {
          // Query ALL configs regardless of appId and saleorApiUrl
          const allConfigRows = await sql<Array<{
            app_id: string;
            config_id: string;
            config_name: string;
            stripe_pk: string;
            stripe_rk: string;
            stripe_wh_secret: string;
            stripe_wh_id: string;
          }>>`
            SELECT app_id, config_id, config_name, stripe_pk, stripe_rk, stripe_wh_secret, stripe_wh_id
            FROM stripe_configs
            ORDER BY created_at DESC
            LIMIT 20
          `;

          this.logger.info("Querying all configs across appIds and URLs", {
            configsFound: allConfigRows.length,
            channelId,
          });

          // Use the first valid config found
          for (const row of allConfigRows) {
            try {
              const restrictedKey = encryptor.decrypt(row.stripe_rk);
              const webhookSecret = encryptor.decrypt(row.stripe_wh_secret);

              const publishableKeyResult = createStripePublishableKey(row.stripe_pk);
              const restrictedKeyResult = createStripeRestrictedKey(restrictedKey);
              const webhookSecretResult = createStripeWebhookSecret(webhookSecret);

              if (publishableKeyResult.isErr() || restrictedKeyResult.isErr() || webhookSecretResult.isErr()) {
                continue;
              }

              const configResult = StripeConfig.create({
                name: row.config_name,
                id: row.config_id,
                publishableKey: publishableKeyResult.value,
                restrictedKey: restrictedKeyResult.value,
                webhookId: row.stripe_wh_id,
                webhookSecret: webhookSecretResult.value,
              });

              if (configResult.isOk()) {
                this.logger.info("Found valid config from fallback query", {
                  configId: configResult.value.id,
                  appId: row.app_id,
                });
                allConfigs.push(configResult.value);
                break; // Use the first valid config found
              }
            } catch (error) {
              // Continue to next config
            }
          }
        } catch (error) {
          this.logger.error("Failed to query all configs for fallback", {
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }

      }

      // If still no configs found, return error
      if (allConfigs.length === 0) {
        this.logger.error("Cannot find Stripe configs", {
          channelId,
          currentAppId: appId,
        });

        return err(
          new AppIsNotConfiguredResponse(
            appContextContainer.getContextValue(),
            new BaseError("No Stripe configuration found."),
          ),
        );
      }

      // Use the first available config
      stripeConfig = ok(allConfigs[0]);
      this.logger.info("Using fallback config for channel", {
        channelId,
        configId: allConfigs[0].id,
      });
    }

    appContextContainer.set({
      stripeEnv: stripeConfig.value.getStripeEnvValue(),
    });

    const restrictedKey = stripeConfig.value.restrictedKey;

    const stripeRefundsApi = this.stripeRefundsApiFactory.create({
      key: restrictedKey,
    });

    this.logger.debug("Refunding Stripe payment intent with id", {
      id: transaction.pspReference,
      action: event.action,
    });

    const stripePaymentIntentId = createStripePaymentIntentId(transaction.pspReference);

    const stripeMoneyResult = StripeMoney.createFromSaleorAmount({
      amount: event.action.amount,
      currency: event.action.currency,
    });

    if (stripeMoneyResult.isErr()) {
      this.logger.error("Failed to create Stripe money", {
        error: stripeMoneyResult.error,
      });

      return err(
        new MalformedRequestResponse(
          appContextContainer.getContextValue(),
          stripeMoneyResult.error,
        ),
      );
    }

    const createRefundResult = await stripeRefundsApi.createRefund({
      paymentIntentId: stripePaymentIntentId,
      stripeMoney: stripeMoneyResult.value,
      metadata: {
        saleor_source_id: transaction.checkout?.id
          ? transaction.checkout.id
          : transaction.order?.id,
        saleor_source_type: transaction.checkout ? "Checkout" : "Order",
        saleor_transaction_id: createSaleorTransactionId(transaction.id),
      },
    });

    if (createRefundResult.isErr()) {
      const error = mapStripeErrorToApiError(createRefundResult.error);

      this.logger.error("Failed to create refund", {
        error,
      });

      return ok(
        new TransactionRefundRequestedUseCaseResponses.Failure({
          transactionResult: new RefundFailureResult(),
          stripePaymentIntentId,
          error,
          appContext: appContextContainer.getContextValue(),
        }),
      );
    }

    const refund = createRefundResult.value;

    this.logger.debug("Refund created", {
      refund,
    });

    const saleorMoneyResult = SaleorMoney.createFromStripe({
      amount: refund.amount,
      currency: refund.currency,
    });

    if (saleorMoneyResult.isErr()) {
      this.logger.error("Failed to create Saleor money", {
        error: saleorMoneyResult.error,
      });

      return err(
        new BrokenAppResponse(appContextContainer.getContextValue(), saleorMoneyResult.error),
      );
    }

    return ok(
      new TransactionRefundRequestedUseCaseResponses.Success({
        stripeRefundId: createStripeRefundId(refund.id),
        appContext: appContextContainer.getContextValue(),
      }),
    );
  }
}
