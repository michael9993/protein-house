"use client";

import { useEffect } from "react";
import { useConfigSync } from "@/hooks/useConfigSync";

/**
 * Client component that syncs storefront config in real-time.
 * 
 * This component:
 * - Polls for config updates every 30 seconds
 * - Listens for webhook-triggered config refresh events
 * - Automatically updates the StoreConfigProvider when config changes
 * 
 * It's rendered in the root layout and runs silently in the background.
 */
export function ConfigSync({ channel }: { channel: string }) {
  useConfigSync({
    channel,
    pollInterval: 10000, // Poll every 10 seconds (reduced from 30s for faster updates)
    listenToEvents: true, // Listen for webhook events
    onConfigUpdate: (newConfig) => {
      // Config will be automatically updated via the event system
      console.log(`[ConfigSync] ✅ Config updated for channel "${channel}"`);
      console.log(`[ConfigSync]    Store name: ${newConfig.store.name}`);
      console.log(`[ConfigSync]    Primary color: ${newConfig.branding.colors.primary}`);
    },
  });

  // This component doesn't render anything
  return null;
}
