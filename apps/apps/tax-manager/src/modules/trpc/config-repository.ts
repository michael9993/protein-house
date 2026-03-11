import { TRPCError } from "@trpc/server";

import { TaxManagerConfigSchema } from "@/modules/tax-engine/schemas";
import { TaxManagerConfig } from "@/modules/tax-engine/types";
import { createLogger } from "@/logger";

const logger = createLogger("config-repository");

const METADATA_KEY = "tax-manager-config";
export const TRANSACTIONS_KEY = "tax-manager-transactions";

function graphqlUrl(saleorApiUrl: string): string {
  return saleorApiUrl.endsWith("/graphql/") ? saleorApiUrl : `${saleorApiUrl}/graphql/`;
}

function headers(appToken: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${appToken}`,
  };
}

/**
 * Fetch the app's tax config from Saleor private metadata.
 * Returns both the Saleor app ID (needed for saves) and the parsed config.
 */
export async function fetchConfig(
  saleorApiUrl: string,
  appToken: string
): Promise<{ appId: string; config: TaxManagerConfig }> {
  const query = `query { app { id privateMetadata { key value } } }`;
  const url = graphqlUrl(saleorApiUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: headers(appToken),
    body: JSON.stringify({ query }),
  });

  const json = await response.json();

  if (json.errors?.length) {
    logger.error("GraphQL errors fetching config", { errors: json.errors });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch config: ${json.errors[0]?.message ?? "Unknown error"}`,
    });
  }

  const appId = json.data?.app?.id;
  if (!appId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not resolve app ID from Saleor",
    });
  }

  const metadata: Array<{ key: string; value: string }> = json.data?.app?.privateMetadata ?? [];
  const entry = metadata.find((m) => m.key === METADATA_KEY);

  let config: TaxManagerConfig;
  try {
    config = entry?.value
      ? TaxManagerConfigSchema.parse(JSON.parse(entry.value))
      : TaxManagerConfigSchema.parse({});
  } catch {
    config = TaxManagerConfigSchema.parse({});
  }

  return { appId, config };
}

/**
 * Save the tax config to Saleor private metadata.
 * Throws a TRPCError on failure.
 */
export async function saveConfig(
  saleorApiUrl: string,
  appToken: string,
  appId: string,
  config: TaxManagerConfig
): Promise<void> {
  const mutation = `mutation UpdateMeta($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      errors { field message }
    }
  }`;
  const url = graphqlUrl(saleorApiUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: headers(appToken),
    body: JSON.stringify({
      query: mutation,
      variables: {
        id: appId,
        input: [{ key: METADATA_KEY, value: JSON.stringify(config) }],
      },
    }),
  });

  const json = await response.json();
  const errors = json.data?.updatePrivateMetadata?.errors;

  if (errors?.length) {
    logger.error("Failed to save config", { errors });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to save config: ${JSON.stringify(errors)}`,
    });
  }
}

/**
 * Fetch raw metadata value by key (used for transaction logs).
 */
export async function fetchMetadataValue(
  saleorApiUrl: string,
  appToken: string,
  key: string
): Promise<{ appId: string; value: unknown }> {
  const query = `query { app { id privateMetadata { key value } } }`;
  const url = graphqlUrl(saleorApiUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: headers(appToken),
    body: JSON.stringify({ query }),
  });

  const json = await response.json();
  const appId = json.data?.app?.id;
  const metadata: Array<{ key: string; value: string }> = json.data?.app?.privateMetadata ?? [];
  const entry = metadata.find((m) => m.key === key);

  return { appId: appId ?? "", value: entry?.value ? JSON.parse(entry.value) : null };
}

/**
 * Fetch Saleor channels list.
 */
export async function fetchSaleorChannels(
  saleorApiUrl: string,
  appToken: string
): Promise<Array<{ slug: string; name: string; currencyCode: string }>> {
  const query = `query { channels { slug name currencyCode } }`;
  const url = graphqlUrl(saleorApiUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: headers(appToken),
    body: JSON.stringify({ query }),
  });

  const json = await response.json();
  return json.data?.channels ?? [];
}

/**
 * Extract tax config from webhook payload metadata (no network call).
 * Used by both checkout and order webhook handlers.
 */
export function loadConfigFromMetadata(
  metadata: Array<{ key: string; value: string }>
): TaxManagerConfig {
  const entry = metadata.find((m) => m.key === METADATA_KEY);

  if (!entry?.value) {
    return TaxManagerConfigSchema.parse({});
  }

  try {
    return TaxManagerConfigSchema.parse(JSON.parse(entry.value));
  } catch {
    logger.warn("Failed to parse tax config from metadata, using defaults");
    return TaxManagerConfigSchema.parse({});
  }
}
