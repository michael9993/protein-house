"use client";

import { useEffect, useRef, useState } from "react";
import type { StoreConfig } from "@/config/store.config";

interface UseConfigSyncOptions {
  channel: string;
  /** Polling interval in milliseconds. Set to 0 to disable polling. Default: 30000 (30s) */
  pollInterval?: number;
  /** Enable listening for custom 'config-updated' events. Default: true */
  listenToEvents?: boolean;
  /** Callback when config is updated */
  onConfigUpdate?: (config: StoreConfig) => void;
}

/**
 * Hook to sync storefront config in real-time without page refresh.
 * 
 * Features:
 * - Polls for config updates at a configurable interval
 * - Listens for 'config-updated' custom events (triggered by webhooks)
 * - Automatically updates when config changes
 * 
 * Usage:
 * ```tsx
 * const { config, isUpdating } = useConfigSync({
 *   channel: 'usd',
 *   pollInterval: 30000, // 30 seconds
 *   onConfigUpdate: (newConfig) => {
 *     console.log('Config updated!', newConfig);
 *   }
 * });
 * ```
 */
export function useConfigSync({
  channel,
  pollInterval = 30000, // 30 seconds default
  listenToEvents = true,
  onConfigUpdate,
}: UseConfigSyncOptions) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastVersionRef = useRef<string | null>(null);

  // Check if config is stale (webhook was received)
  const checkStale = async (): Promise<{ stale: boolean; staleSince?: number }> => {
    try {
      const response = await fetch(`/api/config/check?channel=${encodeURIComponent(channel)}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = (await response.json()) as { stale?: boolean; staleSince?: string | number };
        const staleSince = data.staleSince;
        return {
          stale: data.stale === true,
          staleSince: staleSince != null ? (typeof staleSince === "number" ? staleSince : Date.parse(String(staleSince)) || undefined) : undefined,
        };
      }
    } catch (err) {
      console.error('[useConfigSync] Error checking stale status:', err);
    }
    return { stale: false };
  };

  // Fetch config from API
  const fetchConfig = async (force = false) => {
    if (!isMountedRef.current) return;

    try {
      setIsUpdating(true);
      setError(null);

      // If not forcing, check if config is stale first
      // But we still want to fetch to check version changes (webhook might have failed)
      if (!force) {
        const staleInfo = await checkStale();
        if (staleInfo.stale) {
          // Config is stale, force refresh
          force = true;
          console.log(`[useConfigSync] 🔄 Config is stale for channel "${channel}", forcing refresh`);
        }
        // Even if not stale, we still fetch to check for version changes
        // This ensures we catch updates even if webhook failed
      }

      const url = `/api/config/${channel}${force ? '?force=true' : ''}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        ok?: boolean;
        config?: StoreConfig;
        version?: string;
        updatedAt?: string;
      };

      if (data.ok && data.config) {
        const newConfig = data.config;
        const newVersion = `${data.version ?? Date.now()}-${data.updatedAt ?? ""}`;

        // Always update when force=true, or when version changed, or on first load
        const shouldUpdate = force || !lastVersionRef.current || lastVersionRef.current !== newVersion;

        if (shouldUpdate) {
          const oldVersion = lastVersionRef.current;
          const wasUpdated = oldVersion !== newVersion;
          const isFirstLoad = !oldVersion;
          lastVersionRef.current = newVersion;
          setConfig(newConfig);

          if (onConfigUpdate) {
            onConfigUpdate(newConfig);
          }

          // Always dispatch event when config is fetched (even if version same, content might have changed)
          window.dispatchEvent(new CustomEvent('storefront-config-updated', {
            detail: { channel, config: newConfig },
          }));

          // Clear stale flag on client-side after successfully fetching
          if (force) {
            // Call API to clear stale flag
            fetch(`/api/config/clear-stale?channel=${encodeURIComponent(channel)}`, {
              method: 'POST',
              cache: 'no-store',
            }).catch(() => {
              // Ignore errors - this is best effort
            });
          }

          if (isFirstLoad) {
            console.log(`[useConfigSync] ✅ Initial config loaded for channel "${channel}"`);
          } else if (wasUpdated) {
            const oldVersionNum = oldVersion ? oldVersion.split('-')[0] : 'unknown';
            const newVersionNum = newVersion.split('-')[0];
            console.log(`[useConfigSync] ✅ Config updated for channel "${channel}" (version changed: ${oldVersionNum} → ${newVersionNum})`);
          } else {
            console.log(`[useConfigSync] 🔄 Config refreshed for channel "${channel}" (forced update)`);
          }
          console.log(`[useConfigSync]    Store name: ${newConfig.store.name}`);
          console.log(`[useConfigSync]    Primary color: ${newConfig.branding.colors.primary}`);
        } else {
          console.log(`[useConfigSync] ⏭️  Config unchanged for channel "${channel}" (version: ${newVersion})`);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('[useConfigSync] Error fetching config:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchConfig();

    return () => {
      isMountedRef.current = false;
    };
  }, [channel]);

  // Set up polling with adaptive interval (faster when stale)
  useEffect(() => {
    if (pollInterval <= 0) {
      return;
    }

    // Don't poll if page is hidden
    const shouldPoll = () => !document.hidden;

    let intervalId: NodeJS.Timeout | null = null;
    let isStale = false;

    const poll = async () => {
      if (!shouldPoll() || !isMountedRef.current) return;

      // Check if stale - if so, poll more frequently (every 2 seconds)
      const staleInfo = await checkStale();

      if (staleInfo.stale) {
        // Config is stale - fetch immediately with force
        if (!isStale) {
          // Just became stale - switch to aggressive polling
          isStale = true;
          if (intervalId) {
            clearInterval(intervalId);
          }
          // Poll every 2 seconds when stale
          intervalId = setInterval(() => {
            if (shouldPoll() && isMountedRef.current) {
              fetchConfig(true); // Force fetch when stale
            }
          }, 2000);
        }
        // Immediate fetch
        fetchConfig(true);
      } else {
        // Config is fresh
        if (isStale) {
          // No longer stale - switch back to normal polling
          isStale = false;
          if (intervalId) {
            clearInterval(intervalId);
          }
          // Poll at normal interval
          intervalId = setInterval(() => {
            if (shouldPoll() && isMountedRef.current) {
              poll();
            }
          }, pollInterval);
        }
        // Normal fetch
        fetchConfig();
      }
    };

    // Initial check
    poll();

    // Set up initial interval (will be replaced if stale)
    intervalId = setInterval(() => {
      if (shouldPoll() && isMountedRef.current) {
        poll();
      }
    }, pollInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [channel, pollInterval]);

  // Listen for custom events (triggered by webhooks)
  useEffect(() => {
    if (!listenToEvents) return;

    const handleConfigUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ channel: string; config: StoreConfig }>;

      // Only update if it's for our channel
      if (customEvent.detail?.channel === channel && isMountedRef.current) {
        const newConfig = customEvent.detail.config;
        const newVersion = `${(newConfig as StoreConfig & { version?: string }).version ?? Date.now()}-${(newConfig as StoreConfig & { updatedAt?: string }).updatedAt ?? ''}`;

        if (lastVersionRef.current !== newVersion) {
          lastVersionRef.current = newVersion;
          setConfig(newConfig);

          if (onConfigUpdate) {
            onConfigUpdate(newConfig);
          }
        }
      }
    };

    // Listen for webhook-triggered updates
    const handleWebhookUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ channelSlug: string }>;

      if (customEvent.detail?.channelSlug === channel && isMountedRef.current) {
        // Webhook received - fetch fresh config immediately
        console.log(`[useConfigSync] 🔔 Webhook event received for channel "${channel}", fetching immediately`);
        fetchConfig(true);
      }
    };

    window.addEventListener('storefront-config-updated', handleConfigUpdate);
    window.addEventListener('config-refresh', handleWebhookUpdate);

    return () => {
      window.removeEventListener('storefront-config-updated', handleConfigUpdate);
      window.removeEventListener('config-refresh', handleWebhookUpdate);
    };
  }, [channel, listenToEvents, onConfigUpdate]);

  // Listen for visibility changes to resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current && pollInterval > 0) {
        // Page became visible - fetch fresh config
        fetchConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [channel, pollInterval]);

  return {
    config,
    isUpdating,
    error,
    refresh: () => fetchConfig(true),
  };
}
