import { createLogger } from "@/logger";

const logger = createLogger("security:idempotency");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maximum number of processed keys to keep in memory.
 * When this limit is reached, the oldest keys are evicted.
 */
const MAX_PROCESSED_KEYS = 10_000;

/**
 * Maximum number of processed webhook message IDs to keep.
 * Same eviction policy as processed keys.
 */
const MAX_WEBHOOK_IDS = 10_000;

// ---------------------------------------------------------------------------
// Idempotency key generation
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic idempotency key from an order ID and supplier ID.
 *
 * Uses a simple but effective hash: we concatenate the two identifiers with
 * a separator that cannot appear in either ID, then produce a hex digest
 * using the Web Crypto-compatible approach (djb2 hash for synchronous use).
 *
 * The key is deterministic: the same orderId + supplierId always produces
 * the same key, which is essential for idempotent retries.
 */
export function generateIdempotencyKey(orderId: string, supplierId: string): string {
  const input = `${orderId}::${supplierId}`;

  // djb2 hash — fast, deterministic, good distribution for short strings
  let hash = 5381;

  for (let i = 0; i < input.length; i++) {
    // hash * 33 + char
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }

  // Return as a prefixed hex string for readability in logs
  return `idem_${hash.toString(16).padStart(8, "0")}`;
}

// ---------------------------------------------------------------------------
// Processed keys tracking (Set-based)
// ---------------------------------------------------------------------------

/**
 * Check whether a key has already been processed.
 */
export function isProcessed(key: string, processedKeys: Set<string>): boolean {
  return processedKeys.has(key);
}

/**
 * Mark a key as processed. Returns a new Set if eviction was needed,
 * or the same Set (mutated) if within capacity.
 *
 * Eviction strategy: when the set exceeds {@link MAX_PROCESSED_KEYS},
 * we remove the oldest entries. Since `Set` preserves insertion order,
 * we delete from the beginning of the iterator.
 */
export function markProcessed(key: string, processedKeys: Set<string>): Set<string> {
  processedKeys.add(key);

  if (processedKeys.size > MAX_PROCESSED_KEYS) {
    const toEvict = processedKeys.size - MAX_PROCESSED_KEYS;
    let evicted = 0;

    for (const oldKey of processedKeys) {
      if (evicted >= toEvict) break;

      processedKeys.delete(oldKey);
      evicted++;
    }

    logger.info("Idempotency key eviction", {
      evictedCount: evicted,
      remainingCount: processedKeys.size,
    });
  }

  return processedKeys;
}

// ---------------------------------------------------------------------------
// Webhook deduplication (array-based)
// ---------------------------------------------------------------------------

/**
 * Check whether a webhook message has already been processed.
 *
 * @param messageId - The unique message/delivery ID from the webhook payload
 * @param processed - The list of previously processed message IDs
 */
export function isWebhookProcessed(messageId: string, processed: string[]): boolean {
  return processed.includes(messageId);
}

/**
 * Record a webhook message ID as processed and enforce the retention limit.
 * Returns a new array (does not mutate the input).
 *
 * When the array exceeds {@link MAX_WEBHOOK_IDS}, the oldest entries
 * (beginning of the array) are dropped.
 */
export function markWebhookProcessed(messageId: string, processed: string[]): string[] {
  // Avoid duplicates
  if (processed.includes(messageId)) {
    return processed;
  }

  const updated = [...processed, messageId];

  if (updated.length > MAX_WEBHOOK_IDS) {
    const excess = updated.length - MAX_WEBHOOK_IDS;
    const trimmed = updated.slice(excess);

    logger.info("Webhook ID eviction", {
      evictedCount: excess,
      remainingCount: trimmed.length,
    });

    return trimmed;
  }

  return updated;
}
