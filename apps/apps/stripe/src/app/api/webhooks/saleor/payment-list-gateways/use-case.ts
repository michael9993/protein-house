import { err, ok, Result } from "neverthrow";

import {
  AppIsNotConfiguredResponse,
  BrokenAppResponse,
} from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";

import {
  PaymentListGatewaysUseCaseResponses,
  PaymentListGatewaysUseCaseResponsesType,
} from "./use-case-response";

export class PaymentListGatewaysUseCase {
  private appConfigRepo: AppConfigRepo;
  private logger = createLogger("PaymentListGatewaysUseCase");

  static UseCaseError = BaseError.subclass("PaymentListGatewaysUseCaseError", {
    props: {
      _internalName: "PaymentListGatewaysUseCaseError" as const,
    },
  });

  constructor(deps: { appConfigRepo: AppConfigRepo }) {
    this.appConfigRepo = deps.appConfigRepo;
  }

  async execute(params: {
    channelId: string;
    appId: string;
    saleorApiUrl: SaleorApiUrl;
    token?: string; // Optional token for GraphQL client (for channel fetching fallback)
  }): Promise<
    Result<
      PaymentListGatewaysUseCaseResponsesType,
      AppIsNotConfiguredResponse | BrokenAppResponse
    >
  > {
    const { channelId, appId, saleorApiUrl, token } = params;

    this.logger.debug("Executing payment list gateways for channel", {
      channelId,
      appId,
      saleorApiUrl: saleorApiUrl.toString(),
    });

    // Get root config to see what channel mappings exist
    const rootConfigResult = await this.appConfigRepo.getRootConfig({
      appId,
      saleorApiUrl,
    });

    if (rootConfigResult.isOk()) {
      const rootConfig = rootConfigResult.value;
      const mappedChannels = Object.keys(rootConfig.chanelConfigMapping);
      this.logger.debug("Available channel mappings in config", {
        channelId,
        mappedChannels,
        mappingCount: mappedChannels.length,
        isChannelMapped: mappedChannels.includes(channelId),
      });
    }

    const stripeConfigForThisChannel = await this.appConfigRepo.getStripeConfig({
      channelId,
      appId,
      saleorApiUrl,
    });

    if (stripeConfigForThisChannel.isOk()) {
      const config = stripeConfigForThisChannel.value;

      if (!config) {
        this.logger.warn("No config found for channel, returning empty gateways list", {
          channelId,
          appId,
          saleorApiUrl: saleorApiUrl.toString(),
        });

        // Return empty list if no config - this is valid, means gateway shouldn't appear
        return ok(
          new PaymentListGatewaysUseCaseResponses.Success({
            gateways: [],
            appContext: appContextContainer.getContextValue(),
          }),
        );
      }

      this.logger.info("Found Stripe config for channel", {
        channelId,
        configId: config.id,
        hasPublishableKey: !!config.publishableKey,
      });

      // Return Stripe gateway with publishable key in config
      // Saleor will transform the ID to "app:{app.identifier}:stripe"
      // The frontend filter supports "app:stripe:*" pattern, so "stripe" is correct
      return ok(
        new PaymentListGatewaysUseCaseResponses.Success({
          gateways: [
            {
              id: "stripe",
              name: "Stripe",
              currencies: ["USD", "EUR", "GBP", "PLN"], // Add more as needed
              config: [
                {
                  field: "stripePublishableKey",
                  value: config.publishableKey,
                },
              ],
            },
          ],
          appContext: appContextContainer.getContextValue(),
        }),
      );
    }

    if (stripeConfigForThisChannel.isErr()) {
      this.logger.error("Failed to get configuration", {
        error: stripeConfigForThisChannel.error,
      });

      return err(
        new BrokenAppResponse(
          appContextContainer.getContextValue(),
          stripeConfigForThisChannel.error,
        ),
      );
    }

    throw new PaymentListGatewaysUseCase.UseCaseError("Leaky logic, should not happen");
  }

  /**
   * Execute for queries without checkout context (e.g., shop.availablePaymentGateways).
   * Returns the gateway if ANY channel has Stripe configured.
   */
  async executeForAnyChannel(params: {
    appId: string;
    saleorApiUrl: SaleorApiUrl;
    token?: string; // Optional token for GraphQL client
  }): Promise<
    Result<
      PaymentListGatewaysUseCaseResponsesType,
      AppIsNotConfiguredResponse | BrokenAppResponse
    >
  > {
    const { appId, saleorApiUrl, token } = params;

    this.logger.debug("Checking if any channel has Stripe configured");

    // For queries without checkout context, try to get config from any channel
    // to include the publishable key. If no config found, return gateway without key
    // (the initialize webhook will provide it when checkout is created)
    // Try to get root config to find any channel with Stripe configured
    const rootConfigResult = await this.appConfigRepo.getRootConfig({
      appId,
      saleorApiUrl,
    });

    let publishableKey: string | null = null;

    if (rootConfigResult.isOk()) {
      const rootConfig = rootConfigResult.value;
      // Get all channel IDs that have configs assigned
      const allConfigIds = new Set(Object.values(rootConfig.chanelConfigMapping));
      
      // Try each channel that has a config assigned
      for (const [channelId] of Object.entries(rootConfig.chanelConfigMapping)) {
        const channelConfig = await this.appConfigRepo.getStripeConfig({
          channelId,
          appId,
          saleorApiUrl,
        });
        
        if (channelConfig.isOk() && channelConfig.value) {
          publishableKey = channelConfig.value.publishableKey;
          this.logger.debug("Found Stripe config for channel", { channelId });
          break;
        }
      }
      
      // If no config found in mappings, try to fetch channels from API and check each one
      if (!publishableKey) {
        try {
          const { ChannelsFetcher } = await import("@/modules/saleor/channel-fetcher");
          const { createInstrumentedGraphqlClient } = await import("@/lib/graphql-client");
          
          const client = createInstrumentedGraphqlClient({
            saleorApiUrl,
            token: token || undefined, // Use provided token if available
          });
          
          const channelsFetcher = new ChannelsFetcher(client);
          const channelsResult = await channelsFetcher.fetchChannels();
          
          if (channelsResult.isOk()) {
            const channels = channelsResult.value;
            if (channels && channels.length > 0) {
              this.logger.debug("Fetched channels from API for fallback", { channelCount: channels.length });
              
              // Try each active channel
              for (const channel of channels) {
                if (!channel.isActive) continue;
                
                // Try with channel ID first
                const channelConfigById = await this.appConfigRepo.getStripeConfig({
                  channelId: channel.id,
                  appId,
                  saleorApiUrl,
                });
                
                if (channelConfigById.isOk() && channelConfigById.value?.publishableKey) {
                  publishableKey = channelConfigById.value.publishableKey;
                  this.logger.debug("Found Stripe config for channel from API (by ID)", { 
                    channelId: channel.id, 
                    channelSlug: channel.slug 
                  });
                  break;
                }
                
                // Try with channel slug as fallback
                const channelConfigBySlug = await this.appConfigRepo.getStripeConfig({
                  channelId: channel.slug,
                  appId,
                  saleorApiUrl,
                });
                
                if (channelConfigBySlug.isOk() && channelConfigBySlug.value?.publishableKey) {
                  publishableKey = channelConfigBySlug.value.publishableKey;
                  this.logger.debug("Found Stripe config for channel from API (by slug)", { 
                    channelId: channel.id, 
                    channelSlug: channel.slug 
                  });
                  break;
                }
              }
            }
          }
        } catch (error) {
          this.logger.warn("Failed to fetch channels from API for fallback", {
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue without fallback - will return gateway without publishable key
        }
      }
    } else {
      // If root config fetch failed, try to fetch channels from API
      try {
        const { ChannelsFetcher } = await import("@/modules/saleor/channel-fetcher");
        const { createInstrumentedGraphqlClient } = await import("@/lib/graphql-client");
        
        const client = createInstrumentedGraphqlClient({
          saleorApiUrl,
          token: token || undefined, // Use provided token if available
        });
        
        const channelsFetcher = new ChannelsFetcher(client);
        const channelsResult = await channelsFetcher.fetchChannels();
        
        if (channelsResult.isOk()) {
          const channels = channelsResult.value;
          if (channels && channels.length > 0) {
            this.logger.debug("Fetched channels from API (root config failed)", { channelCount: channels.length });
            
            // Try each active channel
            for (const channel of channels) {
              if (!channel.isActive) continue;
              
              // Try with channel ID first
              const channelConfigById = await this.appConfigRepo.getStripeConfig({
                channelId: channel.id,
                appId,
                saleorApiUrl,
              });
              
              if (channelConfigById.isOk() && channelConfigById.value?.publishableKey) {
                publishableKey = channelConfigById.value.publishableKey;
                this.logger.debug("Found Stripe config for channel from API (by ID)", { 
                  channelId: channel.id, 
                  channelSlug: channel.slug 
                });
                break;
              }
              
              // Try with channel slug as fallback
              const channelConfigBySlug = await this.appConfigRepo.getStripeConfig({
                channelId: channel.slug,
                appId,
                saleorApiUrl,
              });
              
              if (channelConfigBySlug.isOk() && channelConfigBySlug.value?.publishableKey) {
                publishableKey = channelConfigBySlug.value.publishableKey;
                this.logger.debug("Found Stripe config for channel from API (by slug)", { 
                  channelId: channel.id, 
                  channelSlug: channel.slug 
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn("Failed to fetch channels from API", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue without fallback - will return gateway without publishable key
      }
    }

    return ok(
      new PaymentListGatewaysUseCaseResponses.Success({
        gateways: [
          {
            id: "stripe",
            name: "Stripe",
            currencies: ["USD", "EUR", "GBP", "PLN"],
            config: publishableKey
              ? [
                  {
                    field: "stripePublishableKey",
                    value: publishableKey,
                  },
                ]
              : [],
          },
        ],
        appContext: appContextContainer.getContextValue(),
      }),
    );
  }
}
