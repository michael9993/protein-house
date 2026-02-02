"use client";

import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useStoreConfig } from "./StoreConfigProvider";

// ============================================
// TYPES
// ============================================
export type Direction = "ltr" | "rtl";
export type DrawerSide = "left" | "right";

export interface DirectionContextValue {
  /** Current text direction */
  direction: Direction;
  /** Convenience boolean for RTL checks */
  isRTL: boolean;
  /** Computed drawer side: follows direction by default, or uses override */
  drawerSide: DrawerSide;
  /** Returns the logical CSS property value */
  logicalStart: "left" | "right";
  /** Returns the logical CSS property value */
  logicalEnd: "left" | "right";
}

// ============================================
// DEFAULT RTL LOCALES
// ============================================
const DEFAULT_RTL_LOCALES = ["he", "ar", "fa", "ur", "yi", "ps"];

// ============================================
// CONTEXT
// ============================================
const DirectionContext = createContext<DirectionContextValue | null>(null);

// ============================================
// HELPER: Detect RTL from locale
// ============================================
function isRtlLocale(locale: string | undefined, rtlLocales: string[] = DEFAULT_RTL_LOCALES): boolean {
  if (!locale || !rtlLocales || rtlLocales.length === 0) return false;
  const langCode = locale.split("-")[0].toLowerCase();
  return rtlLocales.some(
    (rtl) => rtl.toLowerCase() === langCode || locale.toLowerCase().startsWith(rtl.toLowerCase())
  );
}

// ============================================
// PROVIDER
// ============================================
interface DirectionProviderProps {
  children: React.ReactNode;
}

export function DirectionProvider({ children }: DirectionProviderProps) {
  const config = useStoreConfig();

  // Compute direction from config
  const direction = useMemo((): Direction => {
    const localization = config.localization;
    const configDirection = localization?.direction || "auto";

    if (configDirection === "auto") {
      const rtlLocales = localization?.rtlLocales || DEFAULT_RTL_LOCALES;
      const defaultLocale = localization?.defaultLocale || "en-US";
      return isRtlLocale(defaultLocale, rtlLocales) ? "rtl" : "ltr";
    }

    return configDirection as Direction;
  }, [config.localization]);

  const isRTL = direction === "rtl";

  // Compute drawer side: follows direction by default, or uses override
  const drawerSide = useMemo((): DrawerSide => {
    // Check localization override first
    const localizationOverride = config.localization?.drawerSideOverride;
    
    // If explicitly set to left or right, use that
    if (localizationOverride === "left" || localizationOverride === "right") {
      return localizationOverride;
    }
    
    // Fallback to ui.cart.drawerSide for backwards compatibility
    const uiOverride = config.ui?.cart?.drawerSide;
    if (uiOverride === "left" || uiOverride === "right") {
      return uiOverride;
    }
    
    // Auto: RTL opens from left (logical start), LTR opens from right (logical end)
    // This matches common UX patterns where side panels open from the logical end
    return isRTL ? "left" : "right";
  }, [config.localization?.drawerSideOverride, config.ui?.cart?.drawerSide, isRTL]);

  // Logical CSS helpers
  const logicalStart: "left" | "right" = isRTL ? "right" : "left";
  const logicalEnd: "left" | "right" = isRTL ? "left" : "right";

  // Sync direction to HTML element (single source of truth)
  useEffect(() => {
    const root = document.documentElement;
    if (root.dir !== direction) {
      root.dir = direction;
    }
  }, [direction]);

  const value = useMemo(
    (): DirectionContextValue => ({
      direction,
      isRTL,
      drawerSide,
      logicalStart,
      logicalEnd,
    }),
    [direction, isRTL, drawerSide, logicalStart, logicalEnd]
  );

  return (
    <DirectionContext.Provider value={value}>
      {children}
    </DirectionContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useDirection(): DirectionContextValue {
  const context = useContext(DirectionContext);
  if (!context) {
    // Fallback for components outside provider (e.g., during SSR or tests)
    return {
      direction: "ltr",
      isRTL: false,
      drawerSide: "right",
      logicalStart: "left",
      logicalEnd: "right",
    };
  }
  return context;
}

// ============================================
// EXPORT UTILITIES
// ============================================
export { DEFAULT_RTL_LOCALES };
