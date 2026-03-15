import { NextJsWebhookHandler } from "@saleor/app-sdk/handlers/next";
import { wrapWithLoggerContext } from "@saleor/apps-logger/node";
import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { withSpanAttributes } from "@saleor/apps-otel/src/with-span-attributes";
import { captureException } from "@sentry/nextjs";
import { gql } from "urql";

import { InvoiceRequestedWebhookPayloadFragment } from "../../../../generated/graphql";
import { createLogger } from "../../../logger";
import { loggerContext } from "../../../logger-context";
import { generateInvoicePdf } from "../../../lib/generate-invoice-pdf";
import { uploadInvoiceToSaleor } from "../../../lib/upload-invoice";
import { fetchInvoiceBranding } from "../../../lib/branding-service";
import { createInstrumentedGraphqlClient } from "../../../lib/create-instrumented-graphql-client";
import { invoiceRequestedWebhookDefinition } from "./invoice-requested-definition";

const FetchOrderDetailsQuery = gql`
  query FetchOrderDetails($orderId: ID!) {
    order(id: $orderId) {
      id
      number
      created
      channel {
        slug
      }
      billingAddress {
        firstName
        lastName
        companyName
        streetAddress1
        streetAddress2
        city
        postalCode
        country {
          code
          country
        }
      }
      shippingAddress {
        firstName
        lastName
        companyName
        streetAddress1
        streetAddress2
        city
        postalCode
        country {
          code
          country
        }
      }
      lines {
        id
        productName
        variantName
        quantity
        unitPrice {
          gross {
            amount
            currency
          }
        }
        totalPrice {
          gross {
            amount
            currency
          }
        }
      }
      subtotal {
        gross {
          amount
          currency
        }
      }
      shippingPrice {
        gross {
          amount
          currency
        }
      }
      total {
        gross {
          amount
          currency
        }
        tax {
          amount
          currency
        }
      }
      discounts {
        amount {
          amount
          currency
        }
      }
    }
  }
`;

// Assign the definition to the webhook constant
export const invoiceRequestedWebhook = invoiceRequestedWebhookDefinition;

const logger = createLogger(invoiceRequestedWebhook.webhookPath);

const handler: NextJsWebhookHandler<InvoiceRequestedWebhookPayloadFragment> = async (
  req,
  res,
  context,
) => {
  logger.info("Invoice requested webhook received");

  const { payload, authData } = context;
  
  // The payload is an array, get the first element
  const eventData = Array.isArray(payload) ? payload[0] : payload;
  
  if (!eventData) {
    logger.error("No event data in payload");
    return res.status(200).end();
  }
  
  // Extract invoice and order from the event data
  const invoice = {
    id: eventData.id,
    number: eventData.number,
  };
  
  const order = eventData.order;

  if (!invoice?.id || !order) {
    logger.error("Missing invoice or order data in payload", {
      hasInvoiceId: !!invoice?.id,
      hasOrder: !!order,
    });
    return res.status(200).end();
  }

  try {
    // Fetch complete order details from Saleor
    logger.info("Fetching complete order details", { orderId: order.id });
    
    const client = createInstrumentedGraphqlClient({
      saleorApiUrl: authData.saleorApiUrl,
      token: authData.token,
    });
    
    const { data: orderData, error: orderError } = await client
      .query(FetchOrderDetailsQuery, { orderId: order.id })
      .toPromise();
    
    if (orderError || !orderData?.order) {
      logger.error("Failed to fetch order details", { error: orderError });
      throw new Error("Could not fetch order details");
    }
    
    const completeOrder = orderData.order;
    
    const channelSlug = completeOrder.channel?.slug || "default";
    loggerContext.set(ObservabilityAttributes.CHANNEL_SLUG, channelSlug);

    // Fetch branding from Storefront Control (single source of truth)
    const branding = await fetchInvoiceBranding(authData.saleorApiUrl, channelSlug);
    logger.info("Fetched invoice branding", {
      companyName: branding.companyName,
      primaryColor: branding.primaryColor,
      hasLogo: !!branding.logo,
    });

    // Generate PDF invoice
    logger.info("Generating PDF invoice", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      orderNumber: completeOrder.number,
    });

    // Sum all discounts into a single amount for the invoice
    const totalDiscount = (completeOrder.discounts || []).reduce(
      (sum: number, d: { amount: { amount: number } }) => sum + (d.amount?.amount || 0),
      0,
    );
    const discountCurrency =
      completeOrder.discounts?.[0]?.amount?.currency || completeOrder.total.gross.currency;

    const pdfBuffer = await generateInvoicePdf({
      invoice,
      order: {
        ...completeOrder,
        discount: totalDiscount > 0 ? { amount: totalDiscount, currency: discountCurrency } : undefined,
      },
      branding,
    });

    // Upload PDF to Saleor and update invoice
    logger.info("Uploading PDF to Saleor");
    const invoiceUrl = await uploadInvoiceToSaleor({
      pdfBuffer,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number || `INV-${completeOrder.number}`,
      authData,
    });

    logger.info("Invoice PDF generated and uploaded successfully", {
      invoiceId: invoice.id,
      invoiceUrl,
    });

    return res.status(200).json({
      message: "Invoice generated successfully",
      invoiceUrl,
    });
  } catch (error) {
    logger.error("Failed to generate invoice", {
      error,
      invoiceId: invoice.id,
    });

    captureException(error);

    return res.status(500).json({
      message: "Failed to generate invoice",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default wrapWithLoggerContext(
  withSpanAttributes(invoiceRequestedWebhook.createHandler(handler)),
  loggerContext,
);

export const config = {
  api: {
    bodyParser: false,
  },
};

