import { NextJsWebhookHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

import { createLogger } from "@/logger";
import { ensureSchedulerStarted } from "@/modules/jobs/scheduler-init";
import { handleOrderPaid, type OrderPaidPayload } from "@/modules/webhooks/order-paid/use-case";
import { saleorApp } from "@/saleor-app";

const logger = createLogger("webhook:order-paid");

// ---------------------------------------------------------------------------
// GraphQL subscription — tells Saleor what fields to include in the payload
// ---------------------------------------------------------------------------

const OrderPaidWebhookPayload = gql`
  fragment OrderPaidWebhookPayload on OrderFullyPaid {
    order {
      id
      number
      userEmail
    }
  }
`;

const OrderPaidGraphqlSubscription = gql`
  ${OrderPaidWebhookPayload}
  subscription OrderPaid {
    event {
      ...OrderPaidWebhookPayload
    }
  }
`;

// ---------------------------------------------------------------------------
// Webhook definition
// ---------------------------------------------------------------------------

interface OrderPaidWebhookFragment {
  order?: {
    id: string;
    number?: string;
    userEmail?: string;
  } | null;
}

export const orderPaidWebhook = new SaleorAsyncWebhook<OrderPaidWebhookFragment>({
  name: "Order Paid — Dropship Orchestrator",
  webhookPath: "api/webhooks/saleor/order-paid",
  event: "ORDER_FULLY_PAID",
  apl: saleorApp.apl,
  query: OrderPaidGraphqlSubscription,
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const handler: NextJsWebhookHandler<OrderPaidWebhookFragment> = async (
  _req,
  res,
  context,
) => {
  const { payload, authData } = context;

  // Ensure background jobs are running (safety net for container restarts)
  void ensureSchedulerStarted();

  logger.info("ORDER_PAID webhook received", {
    orderId: payload.order?.id,
    orderNumber: payload.order?.number,
    saleorApiUrl: authData.saleorApiUrl,
  });

  if (!payload.order?.id) {
    logger.error("Webhook payload missing order data");
    return res.status(200).json({ message: "No order data — skipping" });
  }

  // Create a server-side GraphQL client authenticated with the app token
  const client = createGraphQLClient({
    saleorApiUrl: authData.saleorApiUrl,
    token: authData.token,
  });

  try {
    const result = await handleOrderPaid(client, payload as OrderPaidPayload);

    return result.match(
      (data) => {
        if (data.skipped) {
          logger.info("Order skipped (no dropship lines or blocked by checks)", {
            orderId: payload.order?.id,
          });
          return res.status(200).json({ message: "Order processed — no action needed" });
        }

        logger.info("Order forwarded successfully", {
          orderId: payload.order?.id,
          forwardedCount: data.forwarded.length,
        });

        return res.status(200).json({
          message: "Order forwarded",
          forwarded: data.forwarded.length,
        });
      },
      (error) => {
        logger.error("Order processing failed", {
          orderId: payload.order?.id,
          code: error.code,
          message: error.message,
        });

        // Return 200 to Saleor to prevent retries for application-level errors.
        // The error is already logged and exception records created.
        return res.status(200).json({
          message: "Processing failed",
          error: error.code,
        });
      },
    );
  } catch (e) {
    logger.error("Unhandled error in ORDER_PAID handler", {
      orderId: payload.order?.id,
      error: e instanceof Error ? e.message : String(e),
    });

    // Return 500 only for truly unexpected errors — Saleor will retry
    return res.status(500).json({ message: "Internal error" });
  }
};

export default orderPaidWebhook.createHandler(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
