import { NextJsWebhookHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { wrapWithLoggerContext } from "@saleor/apps-logger/node";
import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { withSpanAttributes } from "@saleor/apps-otel/src/with-span-attributes";
import { captureException } from "@sentry/nextjs";
import { gql } from "urql";

import {
  InvoiceSentWebhookPayloadFragment,
  OrderDetailsFragmentDoc,
} from "../../../../generated/graphql";
import { createLogger } from "../../../logger";
import { loggerContext } from "../../../logger-context";
import { SendEventMessagesUseCase } from "../../../modules/event-handlers/use-case/send-event-messages.use-case";
import { SendEventMessagesUseCaseFactory } from "../../../modules/event-handlers/use-case/send-event-messages.use-case.factory";
import { verifyWebhookSignature } from "../../../modules/webhook-verification/verify-webhook-signature";
import { saleorApp } from "../../../saleor-app";

const InvoiceSentWebhookPayload = gql`
  ${OrderDetailsFragmentDoc}
  fragment InvoiceSentWebhookPayload on InvoiceSent {
    invoice {
      id
      metadata {
        key
        value
      }
      privateMetadata {
        key
        value
      }
      message
      externalUrl
      url
      order {
        id
      }
    }
    order {
      ...OrderDetails
    }
  }
`;

const InvoiceSentGraphqlSubscription = gql`
  ${InvoiceSentWebhookPayload}
  subscription InvoiceSent {
    event {
      ...InvoiceSentWebhookPayload
    }
  }
`;

export const invoiceSentWebhook = new SaleorAsyncWebhook<InvoiceSentWebhookPayloadFragment>({
  name: "Invoice sent in Saleor",
  webhookPath: "api/webhooks/invoice-sent",
  event: "INVOICE_SENT",
  apl: saleorApp.apl,
  query: InvoiceSentGraphqlSubscription,
  verifySignatureFn: (jwks, signature, rawBody) => verifyWebhookSignature(jwks, signature, rawBody),
});

const logger = createLogger(invoiceSentWebhook.name);

const useCaseFactory = new SendEventMessagesUseCaseFactory();

const handler: NextJsWebhookHandler<InvoiceSentWebhookPayloadFragment> = async (
  _req,
  res,
  context,
) => {
  logger.info("Webhook received");

  const { payload, authData } = context;
  const { order, invoice } = payload;

  if (!order) {
    logger.error("No order data payload");

    return res.status(200).end();
  }

  const recipientEmail = order.userEmail || order.user?.email;

  if (!recipientEmail?.length) {
    logger.error(`The order had no email recipient set. Aborting.`, { orderNumber: order.number });

    return res
      .status(200)
      .json({ error: "Email recipient has not been specified in the event payload." });
  }

  const channel = order.channel.slug;

  loggerContext.set(ObservabilityAttributes.CHANNEL_SLUG, channel);

  // Download invoice PDF if URL is provided
  let pdfAttachment: { filename: string; content: Buffer; contentType: string } | undefined;
  
  if (invoice?.url) {
    try {
      logger.info("Attempting to download invoice PDF", { 
        invoiceUrl: invoice.url,
        invoiceId: invoice.id 
      });
      
      const pdfResponse = await fetch(invoice.url);
      
      if (pdfResponse.ok) {
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const invoiceFilename = `invoice-${order.number || invoice.id}.pdf`;
        
        pdfAttachment = {
          filename: invoiceFilename,
          content: pdfBuffer,
          contentType: "application/pdf",
        };
        
        logger.info("Invoice PDF downloaded successfully", { 
          filename: invoiceFilename,
          sizeKB: (pdfBuffer.length / 1024).toFixed(2),
          orderNumber: order.number 
        });
      } else {
        logger.warn("Failed to download invoice PDF", {
          status: pdfResponse.status,
          statusText: pdfResponse.statusText,
          invoiceUrl: invoice.url,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error("Error downloading invoice PDF", { message: errorMessage });
      // Continue without attachment rather than failing the whole email
    }
  } else {
    logger.warn("No invoice URL provided in webhook payload", {
      hasInvoice: !!invoice,
      invoiceId: invoice?.id,
    });
  }

  const useCase = useCaseFactory.createFromAuthData(authData);

  try {
    return useCase
      .sendEventMessages({
        channelSlug: channel,
        event: "INVOICE_SENT",
        payload: { order: payload.order, invoice: payload.invoice },
        recipientEmail,
        attachments: pdfAttachment ? [pdfAttachment] : undefined,
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
  withSpanAttributes(invoiceSentWebhook.createHandler(handler)),
  loggerContext,
);

export const config = {
  api: {
    bodyParser: false,
  },
};
