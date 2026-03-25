import { NextJsWebhookHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { wrapWithLoggerContext } from "@saleor/apps-logger/node";
import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { withSpanAttributes } from "@saleor/apps-otel/src/with-span-attributes";
import { captureException } from "@sentry/nextjs";
import { gql } from "urql";

import {
  OrderDetailsFragmentDoc,
  OrderRefundedWebhookPayloadFragment,
} from "../../../../generated/graphql";
import { createLogger } from "../../../logger";
import { loggerContext } from "../../../logger-context";
import { SendEventMessagesUseCase } from "../../../modules/event-handlers/use-case/send-event-messages.use-case";
import { SendEventMessagesUseCaseFactory } from "../../../modules/event-handlers/use-case/send-event-messages.use-case.factory";
import { verifyWebhookSignature } from "../../../modules/webhook-verification/verify-webhook-signature";
import { saleorApp } from "../../../saleor-app";

const OrderRefundedWebhookPayload = gql`
  ${OrderDetailsFragmentDoc}
  fragment OrderRefundedWebhookPayload on OrderRefunded {
    order {
      ...OrderDetails
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

export const orderRefundedWebhook = new SaleorAsyncWebhook<OrderRefundedWebhookPayloadFragment>({
  name: "Order Refunded in Saleor",
  webhookPath: "api/webhooks/order-refunded",
  event: "ORDER_REFUNDED",
  apl: saleorApp.apl,
  query: OrderRefundedGraphqlSubscription,
  verifySignatureFn: (jwks, signature, rawBody) => verifyWebhookSignature(jwks, signature, rawBody),
});

const logger = createLogger(orderRefundedWebhook.webhookPath);

const useCaseFactory = new SendEventMessagesUseCaseFactory();

const handler: NextJsWebhookHandler<OrderRefundedWebhookPayloadFragment> = async (
  _req,
  res,
  context,
) => {
  logger.info("Webhook received");

  const { payload, authData } = context;
  const { order } = payload;

  if (!order) {
    logger.error("No order data payload");

    return res.status(200).end();
  }

  const recipientEmail = order.userEmail || order.user?.email;

  if (!recipientEmail?.length) {
    logger.error(`The order ${order.number} had no email recipient set. Aborting.`);

    return res
      .status(200)
      .json({ error: "Email recipient has not been specified in the event payload." });
  }

  const channel = order.channel.slug;

  loggerContext.set(ObservabilityAttributes.CHANNEL_SLUG, channel);

  // Compute refund summary for the email template
  // Uses max(grantedRefunds, actualRefunded) to handle both Dashboard and external refunds
  const grantedRefunds = order.grantedRefunds ?? [];
  const latestRefund = grantedRefunds[grantedRefunds.length - 1];
  const orderTotal = order.total.gross.amount;
  const currency = order.total.gross.currency;

  const totalGranted = grantedRefunds.reduce((sum, r) => sum + r.amount.amount, 0);
  // totalCharged is NET (charged - refunded by Saleor). Actual refunded = orderTotal - totalCharged.
  const totalCharged = (order as any).totalCharged?.amount ?? (order as any).totalCaptured?.amount ?? orderTotal;
  const actualRefunded = Math.max(0, orderTotal - totalCharged);
  // Use whichever is higher — covers both grant-based and external refunds
  const totalRefunded = Math.max(totalGranted, actualRefunded);
  const outstandingBalance = Math.max(0, orderTotal - totalRefunded);

  // Determine this refund amount: from latest grant, or calculate from the difference
  const thisRefundAmount = latestRefund?.amount.amount
    ?? (actualRefunded > 0 ? Math.round(actualRefunded * 100) / 100 : 0);

  const refundSummary = {
    thisRefundAmount,
    thisRefundCurrency: latestRefund?.amount.currency ?? currency,
    thisRefundReason: latestRefund?.reason ?? "",
    totalRefunded: Math.round(totalRefunded * 100) / 100,
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    currency,
    refundCount: grantedRefunds.length || (actualRefunded > 0 ? 1 : 0),
    isFullRefund: outstandingBalance === 0,
    isPartialRefund: outstandingBalance > 0,
  };

  const useCase = useCaseFactory.createFromAuthData(authData);

  try {
    return useCase
      .sendEventMessages({
        channelSlug: channel,
        event: "ORDER_REFUNDED",
        payload: { order: payload.order, refundSummary },
        recipientEmail,
        saleorApiUrl: authData.saleorApiUrl,
      })
      .then((result) =>
        result.match(
          (_r) => {
            logger.info("Successfully sent email(s)");

            return res.status(200).json({ message: "The event has been handled" });
          },
          (err) => {
            const errorInstance = err[0];

            if (errorInstance instanceof SendEventMessagesUseCase.ServerError) {
              logger.info("Failed to send email(s) [server error]", { error: err });

              return res.status(400).json({ message: "Failed to send email" });
            } else if (errorInstance instanceof SendEventMessagesUseCase.ClientError) {
              logger.info("Failed to send email(s) [client error]", { error: err });

              return res.status(400).json({ message: "Failed to send email" });
            } else if (errorInstance instanceof SendEventMessagesUseCase.NoOpError) {
              logger.info("Sending emails aborted [no op]", { error: err });

              return res.status(200).json({ message: "The event has been handled [no op]" });
            }

            logger.error("Failed to send email(s) [unhandled error]", { error: err });
            captureException(new Error("Unhandled useCase error", { cause: err }));

            return res.status(500).json({ message: "Failed to send email [unhandled]" });
          },
        ),
      );
  } catch (e) {
    logger.error("Unhandled error from useCase", {
      error: e,
    });

    captureException(e);

    return res.status(500).json({ message: "Failed to execute webhook" });
  }
};

export default wrapWithLoggerContext(
  withSpanAttributes(orderRefundedWebhook.createHandler(handler)),
  loggerContext,
);

export const config = {
  api: {
    bodyParser: false,
  },
};
