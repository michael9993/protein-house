import { NextJsWebhookHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

import { createLogger } from "@/logger";
import {
  handleOrderCancelled,
  type OrderCancelledPayload,
} from "@/modules/webhooks/order-cancelled/use-case";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:order-cancelled");

// ---------------------------------------------------------------------------
// GraphQL subscription
// ---------------------------------------------------------------------------

const OrderCancelledWebhookPayload = gql`
  fragment OrderCancelledWebhookPayload on OrderCancelled {
    order {
      id
      number
      userEmail
    }
  }
`;

const OrderCancelledGraphqlSubscription = gql`
  ${OrderCancelledWebhookPayload}
  subscription OrderCancelled {
    event {
      ...OrderCancelledWebhookPayload
    }
  }
`;

// ---------------------------------------------------------------------------
// Webhook definition
// ---------------------------------------------------------------------------

interface OrderCancelledWebhookFragment {
  order?: {
    id: string;
    number?: string;
    userEmail?: string;
  } | null;
}

export const orderCancelledWebhook = new SaleorAsyncWebhook<OrderCancelledWebhookFragment>({
  name: "Order Cancelled — Dropship Orchestrator",
  webhookPath: "api/webhooks/saleor/order-cancelled",
  event: "ORDER_CANCELLED",
  apl: saleorApp.apl,
  query: OrderCancelledGraphqlSubscription,
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const handler: NextJsWebhookHandler<OrderCancelledWebhookFragment> = async (
  _req,
  res,
  context,
) => {
  const { payload, authData } = context;

  logger.info("ORDER_CANCELLED webhook received", {
    orderId: payload.order?.id,
    orderNumber: payload.order?.number,
    saleorApiUrl: authData.saleorApiUrl,
  });

  if (!payload.order?.id) {
    logger.error("Webhook payload missing order data");
    return res.status(200).json({ message: "No order data — skipping" });
  }

  const client = createGraphQLClient({
    saleorApiUrl: authData.saleorApiUrl,
    token: authData.token,
  });

  try {
    const result = await handleOrderCancelled(client, payload as OrderCancelledPayload);

    return result.match(
      (data) => {
        logger.info("Order cancellation processed", {
          orderId: payload.order?.id,
          cancelledCount: data.cancelledCount,
        });

        return res.status(200).json({
          message: "Cancellation processed",
          cancelledCount: data.cancelledCount,
        });
      },
      (error) => {
        logger.error("Order cancellation failed", {
          orderId: payload.order?.id,
          code: error.code,
          message: error.message,
        });

        return res.status(200).json({
          message: "Cancellation processing failed",
          error: error.code,
        });
      },
    );
  } catch (e) {
    logger.error("Unhandled error in ORDER_CANCELLED handler", {
      orderId: payload.order?.id,
      error: e instanceof Error ? e.message : String(e),
    });

    return res.status(500).json({ message: "Internal error" });
  }
};

export default orderCancelledWebhook.createHandler(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
