import { type StoreConfig } from "@/config";

const memoryCache = new Map<string, StoreConfig>();
const staleChannels = new Set<string>();
// Track when channels were marked stale (timestamp) for better client-side detection
const staleTimestamps = new Map<string, number>();

const LOCAL_STORAGE_KEY = "storefront-config-cache";

type CachePayload = {
  version: number | null;
  updatedAt: string | null;
  config: StoreConfig;
};

type LocalCacheStore = Record<string, CachePayload>;

/**
 * Get config from in-memory cache
 */
export function getMemoryConfig(channel: string): StoreConfig | null {
  return memoryCache.get(channel) ?? null;
}

/**
 * Set config in in-memory cache
 */
export function setMemoryConfig(channel: string, config: StoreConfig): void {
  memoryCache.set(channel, config);
}

/**
 * Mark a channel as stale (needs refresh)
 */
export function markChannelStale(channel: string): void {
  staleChannels.add(channel);
  staleTimestamps.set(channel, Date.now());
  console.log(`[cache] 🏷️  Marked channel "${channel}" as stale at ${new Date().toISOString()}`);
}

/**
 * Clear stale flag for a channel
 */
export function clearChannelStale(channel: string): void {
  staleChannels.delete(channel);
  staleTimestamps.delete(channel);
}

/**
 * Check if a channel is marked as stale
 */
export function isChannelStale(channel: string): boolean {
  return staleChannels.has(channel);
}

/**
 * Get the timestamp when a channel was marked stale
 */
export function getStaleTimestamp(channel: string): number | null {
  return staleTimestamps.get(channel) ?? null;
}

/**
 * Read config from localStorage (client-side only)
 */
export function readLocalCache(channel: string): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCacheStore;
    return parsed[channel] ?? null;
  } catch {
    return null;
  }
}

/**
 * Write config to localStorage (client-side only)
 */
export function writeLocalCache(channel: string, payload: CachePayload): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalCacheStore) : {};
    parsed[channel] = payload;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Clear all cache for a channel (both memory and localStorage)
 */
export function clearChannelCache(channel: string): void {
  memoryCache.delete(channel);
  staleChannels.delete(channel);
  
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalCacheStore;
        delete parsed[channel];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Clear all cache (useful for testing or logout)
 */
export function clearAllCache(): void {
  memoryCache.clear();
  staleChannels.clear();
  
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
