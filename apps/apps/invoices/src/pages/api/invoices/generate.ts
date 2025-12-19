import { NextApiRequest, NextApiResponse } from "next";
import { generateInvoicePdf } from "../../../lib/generate-invoice-pdf";
import { storePdfToFile } from "../../../lib/upload-invoice";

// GraphQL query to fetch order details
const FetchOrderDetailsQuery = `
  query FetchOrderDetails($orderId: ID!) {
    order(id: $orderId) {
      id
      number
      created
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
      invoices {
        id
        number
        url
        status
      }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS for storefront requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { orderId, download } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://saleor-api:8000/graphql/";
    
    console.log("Generating invoice for order:", orderId);
    console.log("Saleor API URL:", saleorApiUrl);

    // Fetch order details using native fetch
    const response = await fetch(saleorApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use service token if available
        ...(process.env.SALEOR_SERVICE_TOKEN && {
          Authorization: `Bearer ${process.env.SALEOR_SERVICE_TOKEN}`,
        }),
      },
      body: JSON.stringify({
        query: FetchOrderDetailsQuery,
        variables: { orderId },
      }),
    });

    const result = await response.json();
    const data = result.data;
    const error = result.errors?.[0];

    if (error) {
      console.error("Failed to fetch order:", error);
      return res.status(500).json({ message: "Failed to fetch order details" });
    }

    if (!data?.order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = data.order;
    
    // Check if there's already a generated invoice
    const existingInvoice = order.invoices?.find((inv: any) => inv.status === "SUCCESS" && inv.url);
    
    // Create invoice object
    const invoiceId = existingInvoice?.id || `generated-${orderId}`;
    const invoiceNumber = existingInvoice?.number || `INV-${order.number}`;

    const invoice = {
      id: invoiceId,
      number: invoiceNumber,
    };

    // Generate PDF
    console.log("Generating PDF for invoice:", invoice);
    
    const pdfBuffer = await generateInvoicePdf({
      invoice,
      order: {
        ...order,
        tax: order.total?.tax || null,
      },
    });

    // Store for future downloads
    storePdfToFile(invoiceId, pdfBuffer);

    // Also cache in memory
    (global as any).invoicePdfs = (global as any).invoicePdfs || new Map();
    (global as any).invoicePdfs.set(invoiceId, pdfBuffer);

    console.log("Invoice generated successfully, size:", pdfBuffer.length, "bytes");

    // If download=true, return the PDF directly
    if (download === true) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceNumber}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.send(pdfBuffer);
    }

    // Otherwise return the download URL
    const baseUrl = process.env.INVOICE_APP_URL || 
                    process.env.NEXT_PUBLIC_SALEOR_APP_URL || 
                    "http://localhost:3003";
    
    const downloadUrl = `${baseUrl}/api/invoices/${invoiceId}/download`;

    return res.status(200).json({
      success: true,
      invoice: {
        id: invoiceId,
        number: invoiceNumber,
        url: downloadUrl,
      },
    });

  } catch (error) {
    console.error("Invoice generation error:", error);
    return res.status(500).json({
      message: "Failed to generate invoice",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

