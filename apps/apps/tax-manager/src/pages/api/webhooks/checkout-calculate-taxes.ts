import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "@/saleor-app";
import { createLogger } from "@/logger";
import { calculateTaxes } from "@/modules/tax-engine/calculate";
import { TaxBasePayload } from "@/modules/tax-engine/types";
import { TaxManagerConfigSchema } from "@/modules/tax-engine/schemas";

const logger = createLogger("checkout-calculate-taxes");

const CalculateTaxesSubscription = `
  subscription CheckoutCalculateTaxes {
    event {
      ... on CalculateTaxes {
        taxBase {
          pricesEnteredWithTax
          currency
          channel {
            slug
          }
          discounts {
            name
            amount {
              amount
            }
          }
          address {
            streetAddress1
            streetAddress2
            city
            countryArea
            postalCode
            country {
              code
            }
          }
          shippingPrice {
            amount
          }
          lines {
            sourceLine {
              __typename
              ... on CheckoutLine {
                id
              }
            }
            quantity
            chargeTaxes
            unitPrice {
              amount
            }
            totalPrice {
              amount
            }
          }
        }
        recipient {
          privateMetadata {
            key
            value
          }
        }
      }
    }
  }
`;

export const checkoutCalculateTaxesWebhook = new SaleorSyncWebhook<TaxBasePayload>({
  name: "Checkout Calculate Taxes",
  webhookPath: "api/webhooks/checkout-calculate-taxes",
  event: "CHECKOUT_CALCULATE_TAXES",
  apl: saleorApp.apl,
  query: CalculateTaxesSubscription,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default checkoutCalculateTaxesWebhook.createHandler(
  async (req: NextApiRequest, res: NextApiResponse, ctx) => {
    const { payload } = ctx;

    logger.debug("Checkout tax calculation request", {
      channel: payload.taxBase.channel.slug,
      country: payload.taxBase.address?.country?.code,
      linesCount: payload.taxBase.lines.length,
    });

    // 12-second timeout race (Saleor sync webhooks timeout at ~18s)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Tax calculation timeout")), 12000)
    );

    try {
      const result = await Promise.race([
        (async () => {
          // Load config from app's private metadata
          const config = loadConfigFromMetadata(payload.recipient?.privateMetadata ?? []);

          if (!config.enabled) {
            logger.debug("Tax manager globally disabled, returning zero tax");
            return calculateTaxes({
              payload,
              config: { ...config, channels: [] },
            });
          }

          return calculateTaxes({ payload, config });
        })(),
        timeoutPromise,
      ]);

      logger.info("Checkout tax calculated", {
        channel: payload.taxBase.channel.slug,
        country: payload.taxBase.address?.country?.code,
        rate: result.matchedRule.taxRate,
        source: result.matchedRule.source,
        total: result.response.total_gross_amount,
      });

      return res.status(200).json(result.response);
    } catch (error) {
      logger.error("Checkout tax calculation failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      // On any error, return zero tax rather than blocking checkout
      const fallback = calculateTaxes({
        payload,
        config: { enabled: false, rules: [], channels: [], logTransactions: false },
      });

      return res.status(200).json(fallback.response);
    }
  }
);

function loadConfigFromMetadata(
  metadata: Array<{ key: string; value: string }>
): TaxBasePayload extends { recipient: infer R } ? any : never {
  const entry = metadata.find((m) => m.key === "tax-manager-config");

  if (!entry?.value) {
    return TaxManagerConfigSchema.parse({});
  }

  try {
    const parsed = JSON.parse(entry.value);
    return TaxManagerConfigSchema.parse(parsed);
  } catch (e) {
    logger.warn("Failed to parse tax config from metadata, using defaults", { error: e });
    return TaxManagerConfigSchema.parse({});
  }
}
