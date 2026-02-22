import { type NextJsSyncWebhookHandler, SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { gql } from "urql";

import { createLogger } from "@/logger";
import { handleShippingFilter } from "@/modules/webhooks/shipping/filter-use-case";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:shipping-filter");

// ---------------------------------------------------------------------------
// GraphQL subscription
// ---------------------------------------------------------------------------

const ShippingFilterPayload = gql`
  fragment ShippingFilterPayload on CheckoutFilterShippingMethods {
    checkout {
      lines {
        quantity
        variant {
          id
          product {
            metadata {
              key
              value
            }
          }
        }
      }
    }
    shippingMethods {
      id
      name
    }
  }
`;

const ShippingFilterSubscription = gql`
  ${ShippingFilterPayload}
  subscription CheckoutFilterShippingMethods {
    event {
      ...ShippingFilterPayload
    }
  }
`;

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

interface ShippingFilterWebhookPayload {
  checkout?: {
    lines: Array<{
      quantity: number;
      variant: {
        id: string;
        product: {
          metadata: Array<{ key: string; value: string }>;
        };
      } | null;
    }>;
  } | null;
  shippingMethods?: Array<{
    id: string;
    name?: string;
  }> | null;
}

// ---------------------------------------------------------------------------
// Webhook definition
// ---------------------------------------------------------------------------

export const shippingFilterWebhook = new SaleorSyncWebhook<ShippingFilterWebhookPayload>({
  name: "Shipping Filter — Dropship Orchestrator",
  webhookPath: "api/webhooks/saleor/shipping-filter",
  event: "CHECKOUT_FILTER_SHIPPING_METHODS",
  apl: saleorApp.apl,
  query: ShippingFilterSubscription,
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const handler: NextJsSyncWebhookHandler<ShippingFilterWebhookPayload> = async (
  _req,
  res,
  context,
) => {
  const { payload } = context;

  const checkout = payload.checkout;
  const methods = payload.shippingMethods ?? [];

  if (!checkout) {
    logger.warn("No checkout in filter payload");
    return res.status(200).json({ excluded_methods: [] });
  }

  try {
    const result = handleShippingFilter(checkout.lines, methods);

    logger.info("Shipping filter response", {
      excludedCount: result.excluded_methods.length,
    });

    return res.status(200).json(result);
  } catch (e) {
    logger.error("Unhandled error in shipping filter handler", {
      error: e instanceof Error ? e.message : String(e),
    });

    return res.status(200).json({ excluded_methods: [] });
  }
};

export default shippingFilterWebhook.createHandler(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
