import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { gql } from "urql";

import { InvoiceRequestedWebhookPayloadFragment } from "../../../../generated/graphql";
import { saleorApp } from "../../../saleor-app";

const InvoiceRequestedWebhookPayload = gql`
  fragment InvoiceRequestedWebhookPayload on InvoiceRequested {
    invoice {
      id
      number
    }
    order {
      id
      number
      created
      channel {
        slug
      }
      billingAddress {
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
    }
  }
`;

const InvoiceRequestedGraphqlSubscription = gql`
  ${InvoiceRequestedWebhookPayload}
  subscription InvoiceRequested {
    event {
      ...InvoiceRequestedWebhookPayload
    }
  }
`;

export const invoiceRequestedWebhookDefinition = new SaleorAsyncWebhook<InvoiceRequestedWebhookPayloadFragment>({
  name: "Invoice Requested in Saleor",
  webhookPath: "api/webhooks/invoice-requested",
  event: "INVOICE_REQUESTED",
  apl: saleorApp.apl,
  query: InvoiceRequestedGraphqlSubscription,
});

