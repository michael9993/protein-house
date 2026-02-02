import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { err, ok, Result } from "neverthrow";

import {
  AppIsNotConfiguredResponse,
  BrokenAppResponse,
  MalformedRequestResponse,
} from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { TransactionChargeRequestedEventFragment } from "@/generated/graphql";
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { loggerContext } from "@/lib/logger-context";
import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { StripeConfig } from "@/modules/app-config/domain/stripe-config";
import { resolveSaleorMoneyFromStripePaymentIntent } from "@/modules/saleor/resolve-saleor-money-from-stripe-payment-intent";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import {
  getChannelIdFromRequestedEventPayload,
  getTransactionFromRequestedEventPayload,
} from "@/modules/saleor/transaction-requested-event-helpers";
import { mapStripeErrorToApiError } from "@/modules/stripe/stripe-api-error";
import { createStripePaymentIntentId } from "@/modules/stripe/stripe-payment-intent-id";
import { IStripePaymentIntentsApiFactory } from "@/modules/stripe/types";
import { ChargeFailureResult } from "@/modules/transaction-result/failure-result";
import { ChargeSuccessResult } from "@/modules/transaction-result/success-result";

import {
  TransactionChargeRequestedUseCaseResponses,
  TransactionChargeRequestedUseCaseResponsesType,
} from "./use-case-response";

type UseCaseExecuteResult = Result<
  TransactionChargeRequestedUseCaseResponsesType,
  AppIsNotConfiguredResponse | BrokenAppResponse | MalformedRequestResponse
>;

export class TransactionChargeRequestedUseCase {
  private logger = createLogger("TransactionChargeRequestedUseCase");
  private appConfigRepo: AppConfigRepo;
  private stripePaymentIntentsApiFactory: IStripePaymentIntentsApiFactory;

  constructor(deps: {
    appConfigRepo: AppConfigRepo;
    stripePaymentIntentsApiFactory: IStripePaymentIntentsApiFactory;
  }) {
    this.appConfigRepo = deps.appConfigRepo;
    this.stripePaymentIntentsApiFactory = deps.stripePaymentIntentsApiFactory;
  }

  async execute(args: {
    appId: string;
    saleorApiUrl: SaleorApiUrl;
    event: TransactionChargeRequestedEventFragment;
  }): Promise<UseCaseExecuteResult> {
    const { appId, saleorApiUrl, event } = args;

    const transaction = getTransactionFromRequestedEventPayload(event);
    const channelId = getChannelIdFromRequestedEventPayload(event);

    loggerContext.set(ObservabilityAttributes.PSP_REFERENCE, transaction.pspReference);

    const paymentIntentIdResult = createStripePaymentIntentId(transaction.pspReference);

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
      
      this.logger.warn("Got root config, starting config discovery", {
        hasRootConfig: !!rootConfig,
      });
      
      // Try multiple approaches to get configs
      let allConfigs = rootConfig.getAllConfigsAsList();
      
      this.logger.warn("Root config state", {
        configsFromGetAllConfigsAsList: allConfigs.length,
        stripeConfigsByIdKeys: Object.keys(rootConfig.stripeConfigsById),
        channelMappingsCount: Object.keys(rootConfig.chanelConfigMapping).length,
        channelMappings: rootConfig.chanelConfigMapping,
      });
      
      // If getAllConfigsAsList() is empty, try accessing stripeConfigsById directly
      if (allConfigs.length === 0) {
        this.logger.warn("getAllConfigsAsList() returned empty, trying stripeConfigsById directly");
        allConfigs = Object.values(rootConfig.stripeConfigsById);
        this.logger.warn("Configs from stripeConfigsById", {
          count: allConfigs.length,
          configIds: allConfigs.map((c: StripeConfig) => c.id),
        });
      }
      
      // If still empty, try to get configs from channel mappings
      if (allConfigs.length === 0) {
        this.logger.warn("stripeConfigsById is also empty, trying to get configs from channel mappings");
        
        const channelMappings = rootConfig.chanelConfigMapping;
        const configIds = new Set<string>(Object.values(channelMappings).filter((id): id is string => typeof id === "string"));
        
        this.logger.warn("Found config IDs from channel mappings", {
          configIds: Array.from(configIds),
          channelMappings,
        });
        
        // Try to get configs by configId first
        for (const configId of configIds) {
          const configResult = await this.appConfigRepo.getStripeConfig({
            configId,
            appId,
            saleorApiUrl,
          });
          
          if (configResult.isOk() && configResult.value) {
            allConfigs.push(configResult.value);
            this.logger.warn("Found config via channel mapping (by configId)", {
              configId,
              channelIds: Object.entries(channelMappings)
                .filter(([_, id]) => id === configId)
                .map(([channelId]) => channelId),
            });
          } else {
            this.logger.warn("Failed to get config by configId", {
              configId,
              error: configResult.isErr() ? configResult.error.message : "Config not found",
            });
          }
        }
        
        // If still empty, try to get configs by trying each channel ID from mappings
        if (allConfigs.length === 0) {
          this.logger.warn("Still no configs found, trying to get configs by channel IDs from mappings");
          const channelIds = Object.keys(channelMappings);
          
          for (const mappedChannelId of channelIds) {
            const configResult = await this.appConfigRepo.getStripeConfig({
              channelId: mappedChannelId,
              appId,
              saleorApiUrl,
            });
            
            if (configResult.isOk() && configResult.value) {
              // Avoid duplicates
              if (!allConfigs.find((c: StripeConfig) => c.id === configResult.value!.id)) {
                allConfigs.push(configResult.value);
                this.logger.warn("Found config via channel ID from mapping", {
                  channelId: mappedChannelId,
                  configId: configResult.value.id,
                });
              }
            }
          }
        }
      }
      
      this.logger.warn("Final configs found", {
        configsCount: allConfigs.length,
        configIds: allConfigs.map((c: StripeConfig) => c.id),
      });

      // If getRootConfig() returned empty, try a different approach:
      // Query all configs for this saleorApiUrl regardless of appId, then use the first one found
      // This handles app reinstallations where configs exist under a different appId
      // Similar to how PAYMENT_LIST_GATEWAYS works - it just needs ANY config
      if (allConfigs.length === 0) {
        this.logger.warn("getRootConfig() returned empty, trying to find config by querying all appIds", {
          paymentIntentId: paymentIntentIdResult,
        });

        const { getPostgresClient } = await import("@/modules/postgres/postgres-client");
        const { Encryptor } = await import("@saleor/apps-shared/encryptor");
        const { env } = await import("@/lib/env");
        const { createStripePublishableKey } = await import("@/modules/stripe/stripe-publishable-key");
        const { createStripeRestrictedKey } = await import("@/modules/stripe/stripe-restricted-key");
        const { createStripeWebhookSecret } = await import("@/modules/stripe/stripe-webhook-secret");
        
        const sql = getPostgresClient();
        const saleorApiUrlStr = saleorApiUrl.toString();
        const encryptor = new Encryptor(env.SECRET_KEY);

        try {
          // Query ALL configs regardless of appId and saleorApiUrl
          // This handles both app reinstallations and URL mismatches (localhost vs tunnel)
          // We'll prioritize configs that match the requested URL, but use any if needed
          const allConfigRows = await sql<Array<{
            app_id: string;
            config_id: string;
            config_name: string;
            stripe_pk: string;
            stripe_rk: string;
            stripe_wh_secret: string;
            stripe_wh_id: string;
            saleor_api_url: string;
          }>>`
            SELECT app_id, config_id, config_name, stripe_pk, stripe_rk, stripe_wh_secret, stripe_wh_id, saleor_api_url
            FROM stripe_configs
            ORDER BY created_at DESC
            LIMIT 20
          `;

          this.logger.info("Querying all configs across appIds and URLs", {
            configsFound: allConfigRows.length,
            paymentIntentId: paymentIntentIdResult,
            requestedSaleorApiUrl: saleorApiUrlStr,
            foundUrls: allConfigRows.length > 0 ? [...new Set(allConfigRows.map((r: { saleor_api_url: string }) => r.saleor_api_url))] : [],
          });

          // Try to create StripeConfig objects from the first few configs found
          // Use the first valid one (similar to original behavior - just need ANY config)
          for (const row of allConfigRows) {
            try {
              const restrictedKey = encryptor.decrypt(row.stripe_rk);
              const webhookSecret = encryptor.decrypt(row.stripe_wh_secret);

              const publishableKeyResult = createStripePublishableKey(row.stripe_pk);
              const restrictedKeyResult = createStripeRestrictedKey(restrictedKey);
              const webhookSecretResult = createStripeWebhookSecret(webhookSecret);

              if (publishableKeyResult.isErr() || restrictedKeyResult.isErr() || webhookSecretResult.isErr()) {
                this.logger.debug("Failed to create key objects, skipping config", {
                  configId: row.config_id,
                  appId: row.app_id,
                });
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
                  paymentIntentId: paymentIntentIdResult,
                });
                allConfigs.push(configResult.value);
                break; // Use the first valid config found
              } else {
                this.logger.debug("Failed to create StripeConfig, skipping", {
                  configId: row.config_id,
                  appId: row.app_id,
                  error: configResult.error,
                });
              }
            } catch (error) {
              this.logger.debug("Failed to process config row", {
                configId: row.config_id,
                appId: row.app_id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          if (allConfigs.length === 0 && allConfigRows.length > 0) {
            this.logger.warn("Found config rows but failed to create StripeConfig objects", {
              configsCount: allConfigRows.length,
              paymentIntentId: paymentIntentIdResult,
            });
          }
        } catch (error) {
          this.logger.error("Failed to query all configs for fallback", {
            paymentIntentId: paymentIntentIdResult,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }

        // If still no configs found, return error
        if (allConfigs.length === 0) {
          this.logger.error("Cannot find Stripe configs - getRootConfig() returned empty and no fallback available", {
            channelId,
            paymentIntentId: paymentIntentIdResult,
            currentAppId: appId,
            suggestion: "Configs may exist but getRootConfig() query failed. Consider storing configId when creating payment intent, or ensure configs are migrated to the current appId.",
          });

          return err(
            new AppIsNotConfiguredResponse(
              appContextContainer.getContextValue(),
              new BaseError("No Stripe configuration found. getRootConfig() returned empty results from PostgreSQL."),
            ),
          );
        }
      }

      // Try to find the correct config by attempting to retrieve the payment intent
      // This helps when the channel ID from the event doesn't match the stored configs
      let foundConfig: typeof allConfigs[0] | null = null;

      for (const config of allConfigs) {
        try {
          const testApi = this.stripePaymentIntentsApiFactory.create({
            key: config.restrictedKey,
          });

          const testResult = await testApi.getPaymentIntent({
            id: paymentIntentIdResult,
          });

          if (testResult.isOk()) {
            foundConfig = config;
            this.logger.info("Found matching config by payment intent lookup", {
              channelId,
              configId: config.id,
              paymentIntentId: paymentIntentIdResult,
            });
            break;
          }
        } catch (error) {
          // Continue to next config if this one fails
          this.logger.debug("Config test failed, trying next", {
            configId: config.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // If we found a matching config, use it; otherwise use the first available
      const selectedConfig = foundConfig || allConfigs[0];
      stripeConfig = ok(selectedConfig);
      this.logger.info("Using fallback config for channel", {
        channelId,
        configId: selectedConfig.id,
        foundByPaymentIntent: foundConfig !== null,
      });
    }

    const stripeConfigValue = stripeConfig.value;
    if (!stripeConfigValue) {
      return err(
        new AppIsNotConfiguredResponse(
          appContextContainer.getContextValue(),
          new BaseError("Stripe config is null"),
        ),
      );
    }
    appContextContainer.set({
      stripeEnv: stripeConfigValue.getStripeEnvValue(),
    });

    const restrictedKey = stripeConfigValue.restrictedKey;

    const stripePaymentIntentsApi = this.stripePaymentIntentsApiFactory.create({
      key: restrictedKey,
    });

    this.logger.debug("Capturing Stripe payment intent with id", {
      id: transaction.pspReference,
    });

    const capturePaymentIntentResult = await stripePaymentIntentsApi.capturePaymentIntent({
      id: paymentIntentIdResult,
    });

    if (capturePaymentIntentResult.isErr()) {
      const error = mapStripeErrorToApiError(capturePaymentIntentResult.error);

      this.logger.error("Failed to capture payment intent", {
        error,
      });

      return ok(
        new TransactionChargeRequestedUseCaseResponses.Failure({
          transactionResult: new ChargeFailureResult(),
          stripePaymentIntentId: paymentIntentIdResult,
          error,
          appContext: appContextContainer.getContextValue(),
        }),
      );
    }

    const saleorMoneyResult = resolveSaleorMoneyFromStripePaymentIntent(
      capturePaymentIntentResult.value,
    );

    if (saleorMoneyResult.isErr()) {
      this.logger.error("Failed to create Saleor money", {
        error: saleorMoneyResult.error,
      });

      return err(
        new BrokenAppResponse(appContextContainer.getContextValue(), saleorMoneyResult.error),
      );
    }

    const saleorMoney = saleorMoneyResult.value;

    return ok(
      new TransactionChargeRequestedUseCaseResponses.Success({
        transactionResult: new ChargeSuccessResult(),
        stripePaymentIntentId: paymentIntentIdResult,
        saleorMoney,
        appContext: appContextContainer.getContextValue(),
      }),
    );
  }
}
