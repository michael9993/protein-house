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

// NOTE: Do NOT include subtotalPrice, totalPrice, or shippingPrice here.
// These fields trigger @prevent_sync_event_circular_query in Saleor,
// causing CircularSubscriptionSyncEvent and a null payload.
// We fetch subtotalPrice separately via a GraphQL query inside the handler.
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
// Separate query to fetch checkout subtotal (can't include in subscription
// payload because subtotalPrice resolution triggers circular sync events)
// ---------------------------------------------------------------------------

const FETCH_CHECKOUT_SUBTOTAL = gql`
  query FetchCheckoutSubtotal($id: ID!) {
    checkout(id: $id) {
      subtotalPrice {
        gross {
          amount
          currency
        }
      }
    }
  }
`;

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

  // Fetch checkout subtotal via separate query (not in subscription payload
  // because subtotalPrice triggers CircularSubscriptionSyncEvent)
  let subtotalAmount: number | undefined;
  try {
    const { data: subtotalData } = await client
      .query(FETCH_CHECKOUT_SUBTOTAL, { id: checkout.id })
      .toPromise();
    subtotalAmount = subtotalData?.checkout?.subtotalPrice?.gross?.amount;
  } catch {
    logger.warn("Failed to fetch checkout subtotal", { checkoutId: checkout.id });
  }

  // Saleor sync webhooks timeout at ~18s. Use 12s budget so we respond in time.
  const TIMEOUT_MS = 12_000;

  try {
    const methods: ExternalShippingMethod[] = await Promise.race([
      handleShippingList(
        client,
        checkout.lines,
        checkout.shippingAddress.country.code,
        checkout.channel.currencyCode,
        checkout.shippingAddress.postalCode || undefined,
        subtotalAmount,
        checkout.channel.slug,
      ),
      new Promise<ExternalShippingMethod[]>((resolve) =>
        setTimeout(() => {
          logger.warn("Shipping list timed out — returning empty to keep checkout functional", {
            checkoutId: checkout.id,
            timeoutMs: TIMEOUT_MS,
          });
          resolve([]);
        }, TIMEOUT_MS),
      ),
    ]);

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
