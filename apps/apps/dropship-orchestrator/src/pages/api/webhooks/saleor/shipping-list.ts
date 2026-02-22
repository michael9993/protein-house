import { type NextJsSyncWebhookHandler, SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

import { createLogger } from "@/logger";
import {
  handleShippingList,
  type ExternalShippingMethod,
} from "@/modules/webhooks/shipping/shipping-list-use-case";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:shipping-list");

// ---------------------------------------------------------------------------
// GraphQL subscription — tells Saleor what fields to include in the payload
// ---------------------------------------------------------------------------

const ShippingListPayload = gql`
  fragment ShippingListPayload on ShippingListMethodsForCheckout {
    checkout {
      id
      channel {
        slug
        currencyCode
      }
      shippingAddress {
        postalCode
        country {
          code
        }
      }
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
  }
`;

const ShippingListSubscription = gql`
  ${ShippingListPayload}
  subscription ShippingListMethodsForCheckout {
    event {
      ...ShippingListPayload
    }
  }
`;

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

interface ShippingListWebhookPayload {
  checkout?: {
    id: string;
    channel: {
      slug: string;
      currencyCode: string;
    };
    shippingAddress?: {
      postalCode: string;
      country: {
        code: string;
      };
    } | null;
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
}

// ---------------------------------------------------------------------------
// Webhook definition
// ---------------------------------------------------------------------------

export const shippingListWebhook = new SaleorSyncWebhook<ShippingListWebhookPayload>({
  name: "Shipping List — Dropship Orchestrator",
  webhookPath: "api/webhooks/saleor/shipping-list",
  event: "SHIPPING_LIST_METHODS_FOR_CHECKOUT",
  apl: saleorApp.apl,
  query: ShippingListSubscription,
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const handler: NextJsSyncWebhookHandler<ShippingListWebhookPayload> = async (
  _req,
  res,
  context,
) => {
  const { payload, authData } = context;
  const checkout = payload.checkout;

  if (!checkout) {
    return res.status(200).json([]);
  }

  if (!checkout.shippingAddress) {
    return res.status(200).json([]);
  }

  const client = createGraphQLClient({
    saleorApiUrl: authData.saleorApiUrl,
    token: authData.token,
  });

  try {
    const methods: ExternalShippingMethod[] = await handleShippingList(
      client,
      checkout.lines,
      checkout.shippingAddress.country.code,
      checkout.channel.currencyCode,
      checkout.shippingAddress.postalCode || undefined,
    );

    logger.info("Shipping list response", {
      checkoutId: checkout.id,
      methodCount: methods.length,
    });

    return res.status(200).json(methods);
  } catch (e) {
    logger.error("Unhandled error in shipping list handler", {
      checkoutId: checkout.id,
      error: e instanceof Error ? e.message : String(e),
    });

    // Return empty array — graceful fallback to built-in methods
    return res.status(200).json([]);
  }
};

export default shippingListWebhook.createHandler(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
