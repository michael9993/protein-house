import { EncryptedMetadataManager, MetadataEntry } from "@saleor/app-sdk/settings-manager";
import { Client, gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { getRedisConnection } from "@/modules/jobs/queues";

const logger = createLogger("MetadataManager");

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_APP_DETAILS = gql`
  query FetchAppDetailsForSettings {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const UPDATE_APP_METADATA = gql`
  mutation UpdateAppPrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        privateMetadata {
          key
          value
        }
      }
    }
  }
`;

const DELETE_APP_METADATA = gql`
  mutation DeleteAppPrivateMetadata($id: ID!, $keys: [String!]!) {
    deletePrivateMetadata(id: $id, keys: $keys) {
      errors {
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FetchAppPrivateMetadataQuery = {
  app?: {
    id: string;
    privateMetadata: Array<{ key: string; value: string }>;
  } | null;
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const DropshipConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoForward: z.boolean().default(true),
  costCeilingPercent: z.number().min(0).max(100).default(70),
  dailySpendLimit: z.number().min(0).default(1000),
  fraudChecksEnabled: z.boolean().default(true),
});

export type DropshipConfig = z.infer<typeof DropshipConfigSchema>;

export const DEFAULT_DROPSHIP_CONFIG: DropshipConfig = {
  enabled: true,
  autoForward: true,
  costCeilingPercent: 70,
  dailySpendLimit: 1000,
  fraudChecksEnabled: true,
};

export const SupplierCredentialsSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("aliexpress"),
    appKey: z.string().min(1),
    appSecret: z.string().min(1),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    tokenExpiresAt: z.string().optional(),
  }),
  z.object({
    type: z.literal("cj"),
    apiKey: z.string().min(1),
    accessToken: z.string().optional(),
    tokenExpiresAt: z.string().optional(),
  }),
]);

export type SupplierCredentials = z.infer<typeof SupplierCredentialsSchema>;

// ---------------------------------------------------------------------------
// Metadata key constants
// ---------------------------------------------------------------------------

const KEYS = {
  DROPSHIP_CONFIG: "dropship-config",
  SUPPLIER_CREDS_PREFIX: "dropship-creds-",
  DAILY_SPEND: "dropship-daily-spend",
} as const;

// ---------------------------------------------------------------------------
// Settings Manager factory
// ---------------------------------------------------------------------------

/**
 * Create an EncryptedMetadataManager instance for persisting encrypted
 * settings in Saleor app private metadata.
 */
export function createSettingsManager(client: Client, appId: string): EncryptedMetadataManager {
  const encryptionKey = process.env.SECRET_KEY ?? process.env.APP_ENCRYPTION_KEY ?? "";

  if (!encryptionKey) {
    // In production, credentials MUST be encrypted. Fail loudly.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: No SECRET_KEY or APP_ENCRYPTION_KEY env var set. " +
          "Supplier credentials would be stored unencrypted. Aborting.",
      );
    }
    logger.warn(
      "No SECRET_KEY or APP_ENCRYPTION_KEY env var set — metadata will not be encrypted. " +
        "Set one of these env vars before deploying to production.",
    );
  }

  return new EncryptedMetadataManager({
    encryptionKey,
    fetchMetadata: async (): Promise<MetadataEntry[]> => {
      const { data, error } = await client
        .query<FetchAppPrivateMetadataQuery>(FETCH_APP_DETAILS, {})
        .toPromise();

      if (error) {
        logger.error("Failed to fetch metadata", { error: error.message });
        return [];
      }

      return (
        data?.app?.privateMetadata.map((m) => ({ key: m.key, value: m.value })) ?? []
      );
    },
    mutateMetadata: async (entries: MetadataEntry[]): Promise<MetadataEntry[]> => {
      const { data, error } = await client
        .mutation(UPDATE_APP_METADATA, {
          id: appId,
          input: entries,
        })
        .toPromise();

      if (error) {
        logger.error("Failed to mutate metadata", { error: error.message });
        throw new Error(`Metadata mutation failed: ${error.message}`);
      }

      return (
        (data?.updatePrivateMetadata?.item?.privateMetadata as MetadataEntry[])?.map(
          (m: { key: string; value: string }) => ({
            key: m.key,
            value: m.value,
          }),
        ) ?? []
      );
    },
    async deleteMetadata(keys: string[]): Promise<void> {
      await client
        .mutation(DELETE_APP_METADATA, { id: appId, keys })
        .toPromise();
    },
  });
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

/**
 * Fetch stored credentials for a specific supplier.
 */
export async function getSupplierCredentials(
  client: Client,
  appId: string,
  supplierId: string,
): Promise<SupplierCredentials | null> {
  try {
    const manager = createSettingsManager(client, appId);
    const raw = await manager.get(KEYS.SUPPLIER_CREDS_PREFIX + supplierId);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const result = SupplierCredentialsSchema.safeParse(parsed);

    if (!result.success) {
      logger.warn("Invalid stored credentials for supplier", {
        supplierId,
        errors: result.error.flatten().fieldErrors,
      });
      return null;
    }

    return result.data;
  } catch (err) {
    logger.warn("Failed to read stored credentials", {
      supplierId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Store (overwrite) credentials for a specific supplier.
 */
export async function setSupplierCredentials(
  client: Client,
  appId: string,
  supplierId: string,
  creds: SupplierCredentials,
): Promise<void> {
  const manager = createSettingsManager(client, appId);
  await manager.set({
    key: KEYS.SUPPLIER_CREDS_PREFIX + supplierId,
    value: JSON.stringify(creds),
  });

  logger.info("Supplier credentials saved", { supplierId });
}

/**
 * Fetch the global dropship configuration.
 *
 * Reads directly from plain private metadata (NOT encrypted) because the
 * config is non-sensitive and may have been stored outside the
 * EncryptedMetadataManager.
 */
export async function getDropshipConfig(
  client: Client,
  _appId: string,
): Promise<DropshipConfig> {
  const { data, error } = await client
    .query<FetchAppPrivateMetadataQuery>(FETCH_APP_DETAILS, {})
    .toPromise();

  if (error || !data?.app) {
    return DEFAULT_DROPSHIP_CONFIG;
  }

  const raw = data.app.privateMetadata.find((m) => m.key === KEYS.DROPSHIP_CONFIG)?.value;

  if (!raw) {
    return DEFAULT_DROPSHIP_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw);
    const result = DropshipConfigSchema.safeParse(parsed);

    if (!result.success) {
      logger.warn("Invalid stored dropship config — using defaults");
      return DEFAULT_DROPSHIP_CONFIG;
    }

    return result.data;
  } catch {
    return DEFAULT_DROPSHIP_CONFIG;
  }
}

/**
 * Store the global dropship configuration.
 *
 * Stores as plain private metadata (NOT encrypted) — config is non-sensitive.
 */
export async function setDropshipConfig(
  client: Client,
  appId: string,
  config: DropshipConfig,
): Promise<void> {
  await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key: KEYS.DROPSHIP_CONFIG, value: JSON.stringify(config) }],
    })
    .toPromise();

  logger.info("Dropship config saved");
}

/**
 * Fetch today's running spend total. Used by the cost ceiling / daily spend
 * limit checks in the order-paid use case.
 *
 * Reads directly from plain private metadata (NOT encrypted).
 */
export async function getDailySpend(
  client: Client,
  _appId: string,
): Promise<{ date: string; total: number }> {
  const { data } = await client
    .query<FetchAppPrivateMetadataQuery>(FETCH_APP_DETAILS, {})
    .toPromise();

  const today = new Date().toISOString().slice(0, 10);
  const raw = data?.app?.privateMetadata.find((m) => m.key === KEYS.DAILY_SPEND)?.value;

  if (!raw) {
    return { date: today, total: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as { date: string; total: number };

    // Reset if stored date is not today
    if (parsed.date !== today) {
      return { date: today, total: 0 };
    }

    return parsed;
  } catch {
    return { date: today, total: 0 };
  }
}

/**
 * Increment today's running spend total.
 *
 * Stores as plain private metadata (NOT encrypted).
 */
export async function incrementDailySpend(
  client: Client,
  appId: string,
  amount: number,
): Promise<void> {
  const current = await getDailySpend(client, appId);
  const today = new Date().toISOString().slice(0, 10);

  const updated = {
    date: today,
    total: (current.date === today ? current.total : 0) + amount,
  };

  await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key: KEYS.DAILY_SPEND, value: JSON.stringify(updated) }],
    })
    .toPromise();
}

/**
 * Get the Saleor app ID from the GraphQL API.
 * Used when the appId is not yet known.
 */
export async function fetchAppId(client: Client): Promise<string | null> {
  const { data, error } = await client
    .query<FetchAppPrivateMetadataQuery>(FETCH_APP_DETAILS, {})
    .toPromise();

  if (error || !data?.app) {
    logger.error("Failed to fetch app ID", { error: error?.message });
    return null;
  }

  return data.app.id;
}

// ---------------------------------------------------------------------------
// Atomic daily spend (Redis-backed)
// ---------------------------------------------------------------------------

const REDIS_DAILY_SPEND_PREFIX = "dropship:daily-spend:";

/**
 * Atomically check whether spending `amount` would exceed `limit`, and if not,
 * increment the running total. Uses Redis INCRBYFLOAT for race-condition safety.
 */
export async function atomicCheckAndIncrementDailySpend(
  amount: number,
  limit: number,
): Promise<{ allowed: boolean; newTotal: number }> {
  const redis = getRedisConnection();
  const today = new Date().toISOString().slice(0, 10);
  const key = REDIS_DAILY_SPEND_PREFIX + today;

  // Atomic increment
  const newTotal = await redis.incrbyfloat(key, amount);

  // Set expiry if this is a new key (25 hours buffer)
  if (newTotal === amount) {
    await redis.expire(key, 90000);
  }

  if (newTotal > limit) {
    // Rollback the increment
    await redis.incrbyfloat(key, -amount);
    return { allowed: false, newTotal: newTotal - amount };
  }

  return { allowed: true, newTotal };
}

/**
 * Read today's atomic daily spend total from Redis (read-only).
 */
export async function getAtomicDailySpend(): Promise<{ date: string; total: number }> {
  const redis = getRedisConnection();
  const today = new Date().toISOString().slice(0, 10);
  const key = REDIS_DAILY_SPEND_PREFIX + today;
  const raw = await redis.get(key);
  return { date: today, total: raw ? parseFloat(raw) : 0 };
}
