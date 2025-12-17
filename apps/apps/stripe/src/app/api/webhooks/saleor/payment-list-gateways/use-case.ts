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
  }): Promise<
    Result<
      PaymentListGatewaysUseCaseResponsesType,
      AppIsNotConfiguredResponse | BrokenAppResponse
    >
  > {
    const { channelId, appId, saleorApiUrl } = params;

    const stripeConfigForThisChannel = await this.appConfigRepo.getStripeConfig({
      channelId,
      appId,
      saleorApiUrl,
    });

    if (stripeConfigForThisChannel.isOk()) {
      const config = stripeConfigForThisChannel.value;

      if (!config) {
        this.logger.debug("No config for channel, returning empty gateways list", {
          channelId,
        });

        // Return empty list if no config - this is valid, means gateway shouldn't appear
        return ok(
          new PaymentListGatewaysUseCaseResponses.Success({
            gateways: [],
            appContext: appContextContainer.getContextValue(),
          }),
        );
      }

      // Return Stripe gateway with publishable key in config
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
  }): Promise<
    Result<
      PaymentListGatewaysUseCaseResponsesType,
      AppIsNotConfiguredResponse | BrokenAppResponse
    >
  > {
    const { appId, saleorApiUrl } = params;

    this.logger.debug("Checking if any channel has Stripe configured");

    // For queries without checkout context, try to get config from any channel
    // to include the publishable key. If no config found, return gateway without key
    // (the initialize webhook will provide it when checkout is created)
    const anyChannelConfig = await this.appConfigRepo.getStripeConfig({
      channelId: "default-channel", // Try default channel as fallback
      appId,
      saleorApiUrl,
    });

    const publishableKey = anyChannelConfig.isOk() && anyChannelConfig.value
      ? anyChannelConfig.value.publishableKey
      : null;

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
