import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "@/saleor-app";
import { createLogger } from "@/logger";
import { calculateTaxes } from "@/modules/tax-engine/calculate";
import { TaxBasePayload } from "@/modules/tax-engine/types";
import { TaxManagerConfigSchema } from "@/modules/tax-engine/schemas";

const logger = createLogger("order-calculate-taxes");

const CalculateTaxesSubscription = `
  subscription OrderCalculateTaxes {
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
              ... on OrderLine {
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

export const orderCalculateTaxesWebhook = new SaleorSyncWebhook<TaxBasePayload>({
  name: "Order Calculate Taxes",
  webhookPath: "api/webhooks/order-calculate-taxes",
  event: "ORDER_CALCULATE_TAXES",
  apl: saleorApp.apl,
  query: CalculateTaxesSubscription,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default orderCalculateTaxesWebhook.createHandler(
  async (req: NextApiRequest, res: NextApiResponse, ctx) => {
    const { payload } = ctx;

    logger.debug("Order tax calculation request", {
      channel: payload.taxBase.channel.slug,
      country: payload.taxBase.address?.country?.code,
      linesCount: payload.taxBase.lines.length,
    });

    try {
      const config = loadConfigFromMetadata(payload.recipient?.privateMetadata ?? []);

      if (!config.enabled) {
        const fallback = calculateTaxes({
          payload,
          config: { ...config, channels: [] },
        });
        return res.status(200).json(fallback.response);
      }

      const result = calculateTaxes({ payload, config });

      logger.info("Order tax calculated", {
        channel: payload.taxBase.channel.slug,
        country: payload.taxBase.address?.country?.code,
        rate: result.matchedRule.taxRate,
        source: result.matchedRule.source,
      });

      return res.status(200).json(result.response);
    } catch (error) {
      logger.error("Order tax calculation failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      const fallback = calculateTaxes({
        payload,
        config: { enabled: false, rules: [], channels: [], logTransactions: false },
      });

      return res.status(200).json(fallback.response);
    }
  }
);

function loadConfigFromMetadata(metadata: Array<{ key: string; value: string }>) {
  const entry = metadata.find((m) => m.key === "tax-manager-config");

  if (!entry?.value) {
    return TaxManagerConfigSchema.parse({});
  }

  try {
    return TaxManagerConfigSchema.parse(JSON.parse(entry.value));
  } catch {
    return TaxManagerConfigSchema.parse({});
  }
}
