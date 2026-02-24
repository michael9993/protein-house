import { Client, gql } from "urql";

import { createLogger } from "@/logger";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { getFreeShippingThreshold } from "@/modules/lib/storefront-config-reader";
import { convertCurrency, DEFAULT_RATES } from "@/modules/pricing/currency-converter";
import type { ExchangeRate } from "@/modules/pricing/currency-converter";
import { CJAdapter } from "@/modules/suppliers/cj/adapter";
import type { AuthToken } from "@/modules/suppliers/types";

import { classifyCheckout, type CheckoutLine } from "./checkout-classifier";

const logger = createLogger("ShippingListUseCase");

// ---------------------------------------------------------------------------
// GraphQL — fetch variant private metadata for CJ vid
// ---------------------------------------------------------------------------

const FETCH_VARIANT_PRIVATE_METADATA = gql`
  query FetchVariantPrivateMetadata($ids: [ID!]!) {
    productVariants(ids: $ids, first: 100) {
      edges {
        node {
          id
          privateMetadata {
            key
            value
          }
        }
      }
    }
  }
`;

const FETCH_APP_EXCHANGE_RATES = gql`
  query FetchAppExchangeRates {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Saleor's expected response shape for SHIPPING_LIST_METHODS_FOR_CHECKOUT */
export interface ExternalShippingMethod {
  id: string;
  name: string;
  amount: number;
  currency: string;
  maximum_delivery_days?: number;
  minimum_delivery_days?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseExchangeRates(meta: Array<{ key: string; value: string }>): ExchangeRate[] {
  const entry = meta.find((m) => m.key === "dropship-exchange-rates");
  if (!entry) return DEFAULT_RATES;
  try {
    const parsed = JSON.parse(entry.value);
    return Array.isArray(parsed) ? parsed : DEFAULT_RATES;
  } catch {
    return DEFAULT_RATES;
  }
}

// ---------------------------------------------------------------------------
// CJ Auth Token Cache — avoids re-authenticating on every checkout query
// ---------------------------------------------------------------------------

let cachedAuthToken: AuthToken | null = null;
let cachedAuthExpiry = 0;

function getCachedAuth(): AuthToken | null {
  // Return cached token if it's valid for at least 60 more seconds
  if (cachedAuthToken && Date.now() < cachedAuthExpiry - 60_000) {
    return cachedAuthToken;
  }
  return null;
}

function setCachedAuth(token: AuthToken): void {
  cachedAuthToken = token;
  cachedAuthExpiry = token.expiresAt.getTime();
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

/**
 * Handle SHIPPING_LIST_METHODS_FOR_CHECKOUT:
 * - Classify checkout lines
 * - If not all-dropship, return [] (let built-in methods handle)
 * - Query CJ freight API with all dropship items
 * - Convert prices to checkout currency
 * - Return Saleor-formatted shipping methods
 */
export async function handleShippingList(
  client: Client,
  lines: CheckoutLine[],
  shippingCountryCode: string,
  checkoutCurrency: string,
  shippingPostalCode?: string,
  subtotalAmount?: number,
  channelSlug?: string,
): Promise<ExternalShippingMethod[]> {
  // 1. Classify
  const classification = classifyCheckout(lines);

  if (classification.type !== "all_dropship") {
    return [];
  }

  // 2. Get app ID + CJ credentials
  const appId = await fetchAppId(client);
  if (!appId) {
    return [];
  }

  // Fetch credentials from encrypted metadata with timeout protection
  let creds: Awaited<ReturnType<typeof getSupplierCredentials>> = null;
  try {
    creds = await Promise.race([
      getSupplierCredentials(client, appId, "cj"),
      new Promise<null>((resolve) =>
        setTimeout(() => {
          logger.warn("getSupplierCredentials timed out after 5s");
          resolve(null);
        }, 5_000),
      ),
    ]);
  } catch (credErr) {
    logger.warn("getSupplierCredentials threw", {
      error: credErr instanceof Error ? credErr.message : String(credErr),
    });
    creds = null;
  }

  // Fallback to env var if no metadata credentials (dev mode)
  if (!creds || creds.type !== "cj") {
    const envApiKey = process.env.CJ_API_KEY;
    if (envApiKey) {
      creds = { type: "cj", apiKey: envApiKey };
    } else {
      logger.warn("No CJ credentials found (metadata or env)");
      return [];
    }
  }

  // Authenticate with CJ to get a valid access token (cached in-memory)
  const adapter = new CJAdapter();
  let authToken: AuthToken;

  const cached = getCachedAuth();
  if (cached) {
    authToken = cached;
  } else if (creds.accessToken) {
    authToken = {
      accessToken: creds.accessToken,
      expiresAt: creds.tokenExpiresAt
        ? new Date(creds.tokenExpiresAt)
        : new Date(Date.now() + 86400_000),
    };
    setCachedAuth(authToken);
  } else {
    // No stored access token — authenticate using API key
    const authResult = await adapter.authenticate(creds);
    if (authResult.isErr()) {
      logger.error("CJ authentication failed", { error: authResult.error.message });
      return [];
    }
    authToken = authResult.value;
    setCachedAuth(authToken);
  }

  // 3. Fetch exchange rates from app metadata
  const { data: appData } = await client.query(FETCH_APP_EXCHANGE_RATES, {}).toPromise();
  const rates = parseExchangeRates(appData?.app?.privateMetadata ?? []);

  // 4. Get CJ variant IDs (vid) from variant private metadata
  const { data: varData, error: varError } = await client
    .query(FETCH_VARIANT_PRIVATE_METADATA, {
      ids: classification.dropshipVariantIds,
    })
    .toPromise();

  if (varError) {
    logger.error("Variant private metadata query failed", { error: varError.message });
  }

  const variantEdges: Array<{
    node: { id: string; privateMetadata: Array<{ key: string; value: string }> };
  }> = varData?.productVariants?.edges ?? [];

  // Build items array for CJ API — need vid (supplierSku) + quantity
  const linesByVariantId = new Map<string, number>();
  for (const line of lines) {
    if (line.variant) {
      linesByVariantId.set(
        line.variant.id,
        (linesByVariantId.get(line.variant.id) ?? 0) + line.quantity,
      );
    }
  }

  const items: Array<{ vid: string; quantity: number }> = [];
  for (const edge of variantEdges) {
    const vid =
      edge.node.privateMetadata.find((m) => m.key === "dropship.supplierSku")?.value ??
      edge.node.privateMetadata.find((m) => m.key === "dropship.cjVid")?.value;

    if (!vid) {
      // Try legacy JSON format
      const dropshipEntry = edge.node.privateMetadata.find((m) => m.key === "dropship");
      if (dropshipEntry) {
        try {
          const parsed = JSON.parse(dropshipEntry.value);
          if (parsed.supplierSku) {
            items.push({
              vid: parsed.supplierSku,
              quantity: linesByVariantId.get(edge.node.id) ?? 1,
            });
            continue;
          }
        } catch {
          // ignore parse errors
        }
      }
      logger.warn("Variant missing CJ vid — skipping", { variantId: edge.node.id });
      continue;
    }

    items.push({
      vid,
      quantity: linesByVariantId.get(edge.node.id) ?? 1,
    });
  }

  if (items.length === 0) {
    logger.warn("No CJ variant IDs found in variant metadata");
    return [];
  }

  // 5. Call CJ freight API with all items in one request
  const freightResult = await adapter.getShippingOptionsMulti(
    items,
    shippingCountryCode,
    authToken,
    shippingPostalCode,
  );

  if (freightResult.isErr()) {
    logger.error("CJ freight API failed", {
      error: freightResult.error.message,
      code: freightResult.error.code,
    });
    return [];
  }

  const options = freightResult.value;

  if (options.length === 0) {
    logger.info("CJ returned 0 shipping options", { country: shippingCountryCode });
    return [];
  }

  // 6. Convert prices + format for Saleor
  const methods: ExternalShippingMethod[] = [];

  for (const opt of options) {
    const fromCurrency = opt.cost.currency;
    let amount = opt.cost.amount;

    if (fromCurrency !== checkoutCurrency) {
      const converted = convertCurrency(amount, fromCurrency, checkoutCurrency, rates);
      if (converted == null) {
        logger.warn("Cannot convert shipping price — skipping method", {
          method: opt.name,
          from: fromCurrency,
          to: checkoutCurrency,
        });
        continue;
      }
      amount = converted;
    }

    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;

    methods.push({
      id: slugify(opt.name),
      name: opt.name,
      amount,
      currency: checkoutCurrency,
      minimum_delivery_days: opt.estimatedDays.min,
      maximum_delivery_days: opt.estimatedDays.max,
    });
  }

  // Sort by price ascending
  methods.sort((a, b) => a.amount - b.amount);

  // 7. Apply free shipping threshold — cheapest method becomes free
  if (subtotalAmount != null && channelSlug && methods.length > 0) {
    const threshold = await getFreeShippingThreshold(client, channelSlug);

    if (threshold != null && subtotalAmount >= threshold) {
      methods[0].amount = 0;
      methods[0].name = methods[0].name + " (Free)";
    }
  }

  return methods;
}
