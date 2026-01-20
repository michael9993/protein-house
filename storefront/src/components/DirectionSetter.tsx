"use client";

import { useLayoutEffect } from "react";
import type { StoreConfig } from "@/config/store.config";
import { resolveDirection } from "@/lib/direction";

interface DirectionSetterProps {
  config: StoreConfig;
}

/**
 * Client component that sets direction immediately on mount.
 * 
 * Strategy:
 * 1. Sets direction synchronously during render (before React commits)
 * 2. Also uses useLayoutEffect as backup (runs before paint)
 * 
 * This prevents FOUC (Flash of Unstyled Content) for RTL/LTR.
 */
export function DirectionSetter({ config }: DirectionSetterProps) {
  // Set direction immediately during render (synchronous, before React commits)
  if (typeof window !== 'undefined') {
    const direction = resolveDirection(config);
    const locale = config.localization?.defaultLocale || 'en-US';
    const html = document.documentElement;
    
    // Set immediately - this runs synchronously during render
    html.setAttribute('dir', direction);
    html.setAttribute('lang', locale);
  }

  // Also use useLayoutEffect as backup (runs synchronously before paint)
  useLayoutEffect(() => {
    const direction = resolveDirection(config);
    const locale = config.localization?.defaultLocale || 'en-US';
    
    const html = document.documentElement;
    html.setAttribute('dir', direction);
    html.setAttribute('lang', locale);
  }, [config]);

  // This component doesn't render anything
  return null;
}
