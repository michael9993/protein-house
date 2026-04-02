import { gql } from "urql";
import { createInstrumentedGraphqlClient } from "./create-instrumented-graphql-client";
import * as fs from "fs";
import * as path from "path";

const InvoiceUpdateMutation = gql`
  mutation InvoiceUpdate($id: ID!, $input: UpdateInvoiceInput!) {
    invoiceUpdate(id: $id, input: $input) {
      errors {
        code
        field
        message
      }
      invoice {
        id
        url
        number
      }
    }
  }
`;

// Invoice storage directory - persists between restarts
const INVOICE_STORAGE_DIR = process.env.INVOICE_STORAGE_DIR || "/tmp/invoices";

// Ensure storage directory exists
const ensureStorageDir = () => {
  if (!fs.existsSync(INVOICE_STORAGE_DIR)) {
    fs.mkdirSync(INVOICE_STORAGE_DIR, { recursive: true });
    console.log("Created invoice storage directory:", INVOICE_STORAGE_DIR);
  }
};

// Store PDF to file system
export const storePdfToFile = (invoiceId: string, pdfBuffer: Buffer): string => {
  ensureStorageDir();
  const filePath = path.join(INVOICE_STORAGE_DIR, `${invoiceId}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);
  console.log("Stored PDF to file:", filePath);
  return filePath;
};

// Retrieve PDF from file system
export const getPdfFromFile = (invoiceId: string): Buffer | null => {
  const filePath = path.join(INVOICE_STORAGE_DIR, `${invoiceId}.pdf`);
  if (fs.existsSync(filePath)) {
    console.log("Reading PDF from file:", filePath);
    return fs.readFileSync(filePath);
  }
  console.log("PDF file not found:", filePath);
  return null;
};

interface UploadInvoiceParams {
  pdfBuffer: Buffer;
  invoiceId: string;
  invoiceNumber: string;
  authData: {
    token: string;
    saleorApiUrl: string;
  };
}

export const uploadInvoiceToSaleor = async (
  params: UploadInvoiceParams,
): Promise<string> => {
  const { pdfBuffer, invoiceId, invoiceNumber, authData } = params;

  try {
    // Get the app base URL from environment variables (tunnel URL in development)
    const baseUrl = process.env.INVOICE_APP_URL ||
                    process.env.NEXT_PUBLIC_SALEOR_APP_URL ||
                    process.env.APP_API_BASE_URL ||
                    process.env.APP_IFRAME_BASE_URL ||
                    "http://localhost:3003";

    console.log("Invoice app base URL:", {
      INVOICE_APP_URL: process.env.INVOICE_APP_URL,
      NEXT_PUBLIC_SALEOR_APP_URL: process.env.NEXT_PUBLIC_SALEOR_APP_URL,
      APP_API_BASE_URL: process.env.APP_API_BASE_URL,
      selectedBaseUrl: baseUrl,
    });

    // Create invoice download endpoint URL
    const invoiceUrl = `${baseUrl}/api/invoices/${invoiceId}/download`;

    console.log("Creating GraphQL client with:", {
      url: authData.saleorApiUrl,
      hasToken: !!authData.token,
    });

    const client = createInstrumentedGraphqlClient({
      saleorApiUrl: authData.saleorApiUrl,
      token: authData.token,
    });

    console.log("Updating invoice with:", {
      invoiceId,
      invoiceUrl,
      invoiceNumber,
    });

    // Update invoice with URL
    const result = await client
      .mutation(InvoiceUpdateMutation, {
        id: invoiceId,
        input: {
          url: invoiceUrl,
          number: invoiceNumber,
        },
      })
      .toPromise();

    console.log("Invoice update result:", {
      hasError: !!result.error,
      error: result.error,
      hasData: !!result.data,
      errors: result.data?.invoiceUpdate?.errors,
    });

    if (result.error) {
      console.error("URQL error:", result.error);
      throw new Error(`Failed to update invoice: ${result.error.message}`);
    }

    if (result.data?.invoiceUpdate?.errors?.length > 0) {
      const errorMessages = result.data.invoiceUpdate.errors
        .map((e: any) => `${e.field}: ${e.message} (${e.code})`)
        .join(", ");
      console.error("GraphQL mutation errors:", result.data.invoiceUpdate.errors);
      throw new Error(`Invoice update errors: ${errorMessages}`);
    }

    // Store PDF to file system (persists between restarts)
    storePdfToFile(invoiceId, pdfBuffer);

    // Also keep in memory for faster access
    if (typeof global !== "undefined") {
      (global as any).invoicePdfs = (global as any).invoicePdfs || new Map();
      (global as any).invoicePdfs.set(invoiceId, pdfBuffer);
      console.log("Stored PDF in memory for invoice:", invoiceId);
    }

    return invoiceUrl;
  } catch (error) {
    console.error("Error in uploadInvoiceToSaleor:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
