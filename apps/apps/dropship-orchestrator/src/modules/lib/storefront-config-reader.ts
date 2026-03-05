import { decrypt } from "@saleor/app-sdk/settings-manager";
import { Client, gql } from "urql";

import { createLogger } from "@/logger";

const logger = createLogger("StorefrontConfigReader");

// ---------------------------------------------------------------------------
// GraphQL — find storefront-control app by identifier
// ---------------------------------------------------------------------------

const FIND_STOREFRONT_CONTROL_APP = gql`
  query FindStorefrontControlApp {
    apps(first: 100) {
      edges {
        node {
          id
          identifier
          privateMetadata {
            key
            value
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Shipping config types (mirrors storefront-config schema shapes)
// ---------------------------------------------------------------------------

export interface DropshipShippingConfig {
  marginProtectionEnabled: boolean;
  marginThreshold: number;
  trackOriginalPrices: boolean;
}

export interface ShippingRuleConfig {
  enabled: boolean;
  cartMinimum: number;
  maxMethodPrice: number;
  methodNameFilter?: string;
}

export interface ShippingDiscountRuleConfig extends ShippingRuleConfig {
  type: "flat" | "percentage";
  value: number;
  minPrice: number;
}

export interface ShippingPriceAdjustmentConfig {
  enabled: boolean;
  type: "round_down" | "round_up" | "flat_discount" | "flat_markup" | "percentage_discount" | "percentage_markup";
  value: number;
  minPrice: number;
}

export interface ShippingConfig {
  freeShippingThreshold: number | null;
  freeShippingRule?: ShippingRuleConfig | null;
  discountRule?: ShippingDiscountRuleConfig | null;
  priceAdjustment?: ShippingPriceAdjustmentConfig | null;
  showOriginalPrice?: boolean;
  dropship?: DropshipShippingConfig | null;
}

// ---------------------------------------------------------------------------
// In-memory cache — channelSlug → { config, expiresAt }
// ---------------------------------------------------------------------------

const cache = new Map<string, { config: ShippingConfig | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Internal: read and decrypt storefront config for a channel
// ---------------------------------------------------------------------------

async function readChannelConfig(
  client: Client,
  channelSlug: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client
    .query<{
      apps: {
        edges: Array<{
          node: {
            id: string;
            identifier: string | null;
            privateMetadata: Array<{ key: string; value: string }>;
          };
        }>;
      };
    }>(FIND_STOREFRONT_CONTROL_APP, {})
    .toPromise();

  if (error || !data?.apps?.edges) {
    console.warn("[ConfigReader] Failed to query storefront-control app", error?.message);
    return null;
  }

  const app = data.apps.edges.find(
    (e) => e.node.identifier === "saleor.app.storefront-control",
  )?.node;

  if (!app) {
    console.warn("[ConfigReader] Storefront Control app not found");
    return null;
  }

  // Key format: storefront-config-v1-{channelSlug}
  const configKey = `storefront-config-v1-${channelSlug}`;
  const meta = app.privateMetadata.find((m) => m.key === configKey);

  if (!meta) {
    console.warn("[ConfigReader] No config for channel", {
      channelSlug,
      configKey,
      availableKeys: app.privateMetadata.map((m) => m.key),
    });
    return null;
  }

  // Decrypt with shared SECRET_KEY
  const secretKey = process.env.SECRET_KEY ?? "";
  let configJson: string;

  try {
    configJson = decrypt(meta.value, secretKey);
  } catch (decryptErr) {
    console.warn("[ConfigReader] Decrypt failed:", (decryptErr as Error).message);
    // Fallback: try plain JSON (unencrypted dev mode)
    try {
      JSON.parse(meta.value);
      configJson = meta.value;
    } catch {
      console.warn("[ConfigReader] Cannot decrypt — SECRET_KEY mismatch", { channelSlug });
      return null;
    }
  }

  return JSON.parse(configJson) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the full shipping config from Storefront Control app's metadata.
 *
 * Cached in-memory for 5 minutes to avoid re-querying on every checkout.
 * Returns null if not configured, app not found, or decryption fails.
 */
export async function getShippingConfig(
  client: Client,
  channelSlug: string,
): Promise<ShippingConfig | null> {
  // Check cache first
  const cached = cache.get(channelSlug);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.config;
  }

  try {
    const config = await readChannelConfig(client, channelSlug);
    const shipping = (config?.ecommerce as Record<string, unknown>)?.shipping as ShippingConfig | undefined;
    const result = shipping ?? null;

    cache.set(channelSlug, { config: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.error("[ConfigReader] Error reading storefront config:", err instanceof Error ? err.message : String(err));
    cache.set(channelSlug, { config: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }
}

/**
 * Read the free shipping threshold from Storefront Control app's metadata.
 *
 * Backward-compatible wrapper around getShippingConfig().
 * Returns null if not configured.
 */
export async function getFreeShippingThreshold(
  client: Client,
  channelSlug: string,
): Promise<number | null> {
  const config = await getShippingConfig(client, channelSlug);
  const threshold = config?.freeShippingThreshold ?? null;
  return typeof threshold === "number" ? threshold : null;
}
