import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "@/saleor-app";
import { createLogger } from "@/logger";
import { calculateTaxes } from "@/modules/tax-engine/calculate";
import { TaxBasePayload } from "@/modules/tax-engine/types";
import { loadConfigFromMetadata } from "@/modules/trpc/config-repository";

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

    // 12-second timeout race (Saleor sync webhooks timeout at ~18s)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Tax calculation timeout")), 12000)
    );

    try {
      const result = await Promise.race([
        (async () => {
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

      logger.info("Order tax calculated", {
        channel: payload.taxBase.channel.slug,
        country: payload.taxBase.address?.country?.code,
        rate: result.matchedRule.taxRate,
        source: result.matchedRule.source,
        total: result.response.total_gross_amount,
      });

      return res.status(200).json(result.response);
    } catch (error) {
      logger.error("Order tax calculation failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      // On any error, return zero tax rather than blocking the order
      const fallback = calculateTaxes({
        payload,
        config: { enabled: false, rules: [], channels: [], logTransactions: false },
      });

      return res.status(200).json(fallback.response);
    }
  }
);
