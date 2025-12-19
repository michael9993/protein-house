"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { StoreConfig, getThemeCSSVariables, storeConfig } from "@/config";

// ============================================
// CONTEXT
// ============================================
const StoreConfigContext = createContext<StoreConfig | null>(null);

// ============================================
// PROVIDER
// ============================================
interface StoreConfigProviderProps {
  children: React.ReactNode;
  config?: StoreConfig;
}

export function StoreConfigProvider({
  children,
  config = storeConfig,
}: StoreConfigProviderProps) {
  // Generate CSS variables from config
  const cssVariables = useMemo(() => getThemeCSSVariables(config), [config]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup on unmount
    return () => {
      Object.keys(cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [cssVariables]);

  return (
    <StoreConfigContext.Provider value={config}>
      {children}
    </StoreConfigContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useStoreConfig(): StoreConfig {
  const config = useContext(StoreConfigContext);
  if (!config) {
    throw new Error("useStoreConfig must be used within StoreConfigProvider");
  }
  return config;
}

// ============================================
// FEATURE FLAG HOOKS
// ============================================

/**
 * Check if a specific feature is enabled
 */
export function useFeature(
  featureName: keyof StoreConfig["features"]
): boolean {
  const config = useStoreConfig();
  return config.features[featureName];
}

/**
 * Get branding configuration
 */
export function useBranding(): StoreConfig["branding"] {
  const config = useStoreConfig();
  return config.branding;
}

/**
 * Get store information
 */
export function useStoreInfo(): StoreConfig["store"] {
  const config = useStoreConfig();
  return config.store;
}

/**
 * Get e-commerce settings
 */
export function useEcommerceSettings(): StoreConfig["ecommerce"] {
  const config = useStoreConfig();
  return config.ecommerce;
}

/**
 * Get homepage configuration
 */
export function useHomepageConfig(): StoreConfig["homepage"] {
  const config = useStoreConfig();
  return config.homepage;
}

/**
 * Get SEO configuration
 */
export function useSeoConfig(): StoreConfig["seo"] {
  const config = useStoreConfig();
  return config.seo;
}

/**
 * Get social links
 */
export function useSocialLinks(): StoreConfig["integrations"]["social"] {
  const config = useStoreConfig();
  return config.integrations.social;
}

/**
 * Check if a page is enabled
 */
export function usePageEnabled(pageName: keyof StoreConfig["pages"]): boolean {
  const config = useStoreConfig();
  return config.pages[pageName];
}

// ============================================
// UTILITY COMPONENTS
// ============================================

/**
 * Conditionally render children based on feature flag
 */
interface FeatureGateProps {
  feature: keyof StoreConfig["features"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const isEnabled = useFeature(feature);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Conditionally render children based on page flag
 */
interface PageGateProps {
  page: keyof StoreConfig["pages"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PageGate({ page, children, fallback = null }: PageGateProps) {
  const isEnabled = usePageEnabled(page);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Export context for advanced use cases
export { StoreConfigContext };

