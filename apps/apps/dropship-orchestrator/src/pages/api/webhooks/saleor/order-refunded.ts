import { NextJsWebhookHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

import { createLogger } from "@/logger";
import {
  handleOrderRefunded,
  type OrderRefundedPayload,
} from "@/modules/webhooks/order-refunded/use-case";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:order-refunded");

// ---------------------------------------------------------------------------
// GraphQL subscription
// ---------------------------------------------------------------------------

const OrderRefundedWebhookPayload = gql`
  fragment OrderRefundedWebhookPayload on OrderRefunded {
    order {
      id
      number
      userEmail
    }
  }
`;

const OrderRefundedGraphqlSubscription = gql`
  ${OrderRefundedWebhookPayload}
  subscription OrderRefunded {
    event {
      ...OrderRefundedWebhookPayload
    }
  }
`;

// ---------------------------------------------------------------------------
// Webhook definition
// ---------------------------------------------------------------------------

interface OrderRefundedWebhookFragment {
  order?: {
    id: string;
    number?: string;
    userEmail?: string;
  } | null;
}

export const orderRefundedWebhook = new SaleorAsyncWebhook<OrderRefundedWebhookFragment>({
  name: "Order Refunded — Dropship Orchestrator",
  webhookPath: "api/webhooks/saleor/order-refunded",
  event: "ORDER_REFUNDED",
  apl: saleorApp.apl,
  query: OrderRefundedGraphqlSubscription,
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const handler: NextJsWebhookHandler<OrderRefundedWebhookFragment> = async (
  _req,
  res,
  context,
) => {
  const { payload, authData } = context;

  logger.info("ORDER_REFUNDED webhook received", {
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
    const result = await handleOrderRefunded(client, payload as OrderRefundedPayload);

    return result.match(
      (data) => {
        logger.info("Order refund processed", {
          orderId: payload.order?.id,
          cancelledCount: data.cancelledCount,
        });

        return res.status(200).json({
          message: "Refund processed",
          cancelledCount: data.cancelledCount,
        });
      },
      (error) => {
        logger.error("Order refund processing failed", {
          orderId: payload.order?.id,
          code: error.code,
          message: error.message,
        });

        return res.status(200).json({
          message: "Refund processing failed",
          error: error.code,
        });
      },
    );
  } catch (e) {
    logger.error("Unhandled error in ORDER_REFUNDED handler", {
      orderId: payload.order?.id,
      error: e instanceof Error ? e.message : String(e),
    });

    return res.status(500).json({ message: "Internal error" });
  }
};

export default orderRefundedWebhook.createHandler(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
