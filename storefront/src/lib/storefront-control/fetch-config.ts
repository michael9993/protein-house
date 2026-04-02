import { defaultStoreConfig, DEFAULT_ERROR_TEXT, DEFAULT_NOT_FOUND_TEXT, DEFAULT_FILTERS_TEXT } from "@/config/store.config";
import type { StoreConfig } from "@/config/store.config";
import { getControlAppUrl } from "./discover-app";
import type { StorefrontControlConfig } from "./types";
import {
  getMemoryConfig,
  setMemoryConfig,
  readLocalCache,
  writeLocalCache,
  clearChannelStale,
} from "./cache";
import { readFallbackConfig } from "./fallback";

/**
 * Response format from Storefront Control API
 */
type StorefrontControlResponse = {
  config: StorefrontControlConfig;
  version?: number;
  updatedAt?: string;
};

/**
 * Load config using cache-first strategy (no network call if cache exists).
 * Priority: memory → localStorage → fallback JSON → defaults
 * 
 * This is synchronous and fast - perfect for initial render.
 */
export function loadConfig(channel: string): StoreConfig {
  // 1. Check in-memory cache (fastest)
  const memory = getMemoryConfig(channel);
  if (memory) {
    console.log(`[loadConfig] ✅ Using in-memory cache for channel "${channel}"`);
    return normalizeFeatures(memory);
  }

  // 2. Check localStorage (client-side only)
  const local = readLocalCache(channel);
  if (local?.config) {
    // Populate memory cache for next time
    const normalized = normalizeFeatures(local.config);
    setMemoryConfig(channel, normalized);
    console.log(`[loadConfig] ✅ Loaded from localStorage for channel "${channel}"`);
    return normalized;
  }

  // 3. Check fallback JSON (bundled at build time)
  // Note: Fallback config is in StorefrontControlConfig format, needs mapping
  console.log(`[loadConfig] 🔍 Checking fallback config for channel "${channel}"...`);
  const fallbackRaw = readFallbackConfig(channel);
  if (fallbackRaw) {
    // Map from StorefrontControlConfig to StoreConfig format
    const fallback = mapToStoreConfig(fallbackRaw);
    setMemoryConfig(channel, fallback);
    // Always log when fallback is loaded (important for debugging)
    console.log(`[loadConfig] ✅ Loaded and mapped fallback config for channel "${channel}"`);
    console.log(`[loadConfig]    Store name: ${fallback.store.name}`);
    console.log(`[loadConfig]    Primary color: ${fallback.branding.colors.primary}`);
    console.log(`[loadConfig]    Tagline: ${fallback.store.tagline}`);
    return fallback;
  }

  // 4. Return defaults (always available)
  // Always log when using defaults (important for debugging)
  console.warn(`[loadConfig] ⚠️  No fallback config found for channel "${channel}", using defaults`);
  console.warn(`[loadConfig]    This means storefront-cms-config.json was not found or doesn't contain config for this channel`);
  console.warn(`[loadConfig]    Default store name: ${defaultStoreConfig.store.name}`);
  console.warn(`[loadConfig]    Default primary color: ${defaultStoreConfig.branding.colors.primary}`);
  return defaultStoreConfig as unknown as StoreConfig;
}

/**
 * Refresh config from API (non-blocking, updates cache).
 * Returns null if fetch fails or config hasn't changed.
 * 
 * This is async and should be called in the background.
 */
export async function refreshConfig(channel: string): Promise<StoreConfig | null> {
  try {
    // Get the control app URL
    const isServerSide = typeof window === "undefined";

    let appUrl: string | null = null;

    if (isServerSide) {
      // Server-side: Use internal Docker service URL if available
      const internalUrl = process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL || "http://saleor-storefront-control-app:3000";
      appUrl = internalUrl;
      console.log(`[refreshConfig] 🔍 Attempting to fetch config for channel "${channel}" from storefront-control app`);
      console.log(`[refreshConfig]    Server-side, using internal URL: ${internalUrl}`);
    } else {
      // Client-side: Use public/tunnel URL
      appUrl = await getControlAppUrl();
      console.log(`[refreshConfig] 🔍 Attempting to fetch config for channel "${channel}" from storefront-control app`);
      console.log(`[refreshConfig]    Client-side, using app URL: ${appUrl || "not found"}`);
    }

    if (!appUrl) {
      // App not installed or configured
      console.warn(`[refreshConfig] ⚠️  Control app not found, cannot fetch config for channel "${channel}"`);
      return null;
    }

    // Get current ETag from local cache if available
    const localCache = readLocalCache(channel);
    const currentETag = localCache?.version && localCache?.updatedAt
      ? `"${localCache.version}-${localCache.updatedAt}"`
      : undefined;

    // Fetch config from the app
    const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || process.env.SALEOR_API_URL;
    const configUrl = `${appUrl}/api/config/${channel}${saleorApiUrl ? `?saleorApiUrl=${encodeURIComponent(saleorApiUrl)}` : ""}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(saleorApiUrl && { "x-saleor-api-url": saleorApiUrl }),
      ...(currentETag && { "If-None-Match": currentETag }),
    };

    console.log(`[refreshConfig]    Fetching from: ${configUrl.replace(saleorApiUrl || "", "[REDACTED]")}`);

    const response = await fetch(configUrl, {
      headers,
      // Don't use Next.js ISR here - we're managing our own cache
      cache: "no-store",
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      console.log(`[refreshConfig] ✅ Config not modified (304) for channel "${channel}"`);
      clearChannelStale(channel);
      return null;
    }

    if (!response.ok) {
      console.error(`[refreshConfig] ❌ Failed to fetch config for channel "${channel}": HTTP ${response.status} ${response.statusText}`);
      return null;
    }

    const payload = (await response.json()) as StorefrontControlResponse;

    if (!payload?.config) {
      console.error(`[refreshConfig] ❌ Invalid response format for channel "${channel}"`);
      return null;
    }

    // Convert StorefrontControlConfig to StoreConfig format
    const storeConfig = mapToStoreConfig(payload.config);

    // Add version and updatedAt to the config object for version tracking
    (storeConfig as any).version = payload.version ?? 1;
    (storeConfig as any).updatedAt = payload.updatedAt ?? new Date().toISOString();

    // Update caches
    setMemoryConfig(channel, storeConfig);

    if (typeof window !== "undefined") {
      writeLocalCache(channel, {
        version: payload.version ?? null,
        updatedAt: payload.updatedAt ?? null,
        config: storeConfig,
      });
    }

    // Don't clear stale flag immediately - let client-side clear it after it fetches
    // This ensures client-side knows there's a new config available
    // clearChannelStale(channel); // Commented out - let client clear it

    console.log(`[refreshConfig] ✅ Successfully fetched and cached config for channel "${channel}"`);
    console.log(`[refreshConfig]    Version: ${payload.version ?? 'N/A'}`);
    console.log(`[refreshConfig]    Updated at: ${payload.updatedAt ?? 'N/A'}`);
    console.log(`[refreshConfig]    Store name: ${storeConfig.store.name}`);
    console.log(`[refreshConfig]    Primary color: ${storeConfig.branding.colors.primary}`);
    console.log(`[refreshConfig]    ⚠️  Stale flag still set - client will clear it after fetching`);
    return storeConfig;
  } catch (error) {
    console.error(`[refreshConfig] ❌ Error refreshing config for channel "${channel}":`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(`[refreshConfig]    Stack: ${error.stack}`);
    }
    return null;
  }
}

/**
 * Fetch storefront configuration with cache-first strategy.
 *
 * This is the main entry point that:
 * 1. When Saleor API URL is set (server): tries to fetch from storefront-control API first so
 *    dynamic data (e.g. banner items from promotions/vouchers) is included in the initial response.
 * 2. Falls back to cached/fallback config if API is unavailable or fails.
 * 3. Always tries to refresh in the background so the next load has fresh config.
 * 4. Always returns valid config (never throws).
 *
 * @param channel - Channel slug
 * @returns StoreConfig (always returns valid config)
 */
export async function fetchStorefrontConfig(channel: string): Promise<StoreConfig> {
  const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || process.env.SALEOR_API_URL;

  // When we have Saleor API URL (server-side), try to get config from the control app first
  // so dynamic banner items (promotions/vouchers) are included in the initial render
  if (typeof window === "undefined" && saleorApiUrl) {
    try {
      const refreshed = await refreshConfig(channel);
      if (refreshed) {
        return normalizeFeatures(refreshed);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[fetchStorefrontConfig] API refresh failed for channel "${channel}", using cache/fallback:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  // Load from cache (memory → localStorage → fallback → defaults)
  const baseConfig = loadConfig(channel);

  // Trigger background refresh so next load has fresh config (and client-side can update via event)
  refreshConfig(channel).catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[fetchStorefrontConfig] Background refresh failed for channel "${channel}":`, error instanceof Error ? error.message : String(error));
    }
  });

  return baseConfig;
}

/**
 * Ensure features object has all keys (defaults for missing, e.g. scrollToTop added later).
 */
function normalizeFeatures(config: StoreConfig): StoreConfig {
  return {
    ...config,
    features: {
      ...defaultStoreConfig.features,
      ...config.features,
    },
  };
}

/**
 * Map StorefrontControlConfig (from app) to StoreConfig (storefront format).
 * Merges with defaults to ensure all fields are present.
 */
function mapToStoreConfig(remote: StorefrontControlConfig): StoreConfig {
  return {
    version: (remote as any).version ?? 2,
    channelSlug: (remote as any).channelSlug ?? "",
    relatedProducts: (remote as any).relatedProducts ?? {
      enabled: true,
      strategy: "category",
      maxItems: 8,
      showOnMobile: true,
      title: "You May Also Like",
      subtitle: null,
    },
    design: (remote as any).design ?? {
      animations: { pageTransition: "fade", hoverScale: 1.02, duration: "normal" },
      spacing: { sectionGap: "md", containerMaxWidth: "7xl" },
    },
    store: {
      name: remote.store.name,
      tagline: remote.store.tagline,
      type: remote.store.type,
      description: remote.store.description,
      email: remote.store.email,
      phone: remote.store.phone,
      address: remote.store.address,
    },

    branding: {
      logo: remote.branding.logo,
      logoAlt: remote.branding.logoAlt,
      favicon: remote.branding.favicon,
      colors: {
        primary: remote.branding.colors.primary,
        secondary: remote.branding.colors.secondary,
        accent: remote.branding.colors.accent,
        background: remote.branding.colors.background,
        surface: remote.branding.colors.surface,
        text: remote.branding.colors.text,
        textMuted: remote.branding.colors.textMuted,
        success: remote.branding.colors.success,
        warning: remote.branding.colors.warning,
        error: remote.branding.colors.error,
      },
      typography: {
        fontHeading: remote.branding.typography.fontHeading,
        fontBody: remote.branding.typography.fontBody,
        fontMono: remote.branding.typography.fontMono,
      },
      style: {
        borderRadius: remote.branding.style.borderRadius,
        buttonStyle: remote.branding.style.buttonStyle,
        cardShadow: remote.branding.style.cardShadow,
      },
    },

    features: {
      wishlist: remote.features.wishlist,
      compareProducts: remote.features.compareProducts,
      productReviews: remote.features.productReviews,
      recentlyViewed: remote.features.recentlyViewed,
      scrollToTop: remote.features?.scrollToTop ?? true,
      guestCheckout: remote.features.guestCheckout,
      expressCheckout: remote.features.expressCheckout,
      savePaymentMethods: remote.features.savePaymentMethods,
      digitalDownloads: remote.features.digitalDownloads,
      subscriptions: remote.features.subscriptions,
      giftCards: remote.features.giftCards,
      productBundles: remote.features.productBundles,
      newsletter: remote.features.newsletter,
      promotionalBanners: remote.features.promotionalBanners,
      abandonedCartEmails: remote.features.abandonedCartEmails,
      socialLogin: remote.features.socialLogin,
      shareButtons: remote.features.shareButtons,
      instagramFeed: remote.features.instagramFeed,
      relatedProducts: (remote.features as any).relatedProducts ?? true,
      stockAlerts: (remote.features as any).stockAlerts ?? false,
    },

    ecommerce: {
      currency: remote.ecommerce.currency,
      shipping: remote.ecommerce.shipping,
      tax: remote.ecommerce.tax,
      inventory: remote.ecommerce.inventory,
      checkout: remote.ecommerce.checkout,
    },

    // Header configuration (banner, logo position, etc.)
    header: {
      banner: {
        enabled: remote.header.banner.enabled,
        text: remote.header.banner.text,
        backgroundColor: remote.header.banner.backgroundColor,
        textColor: remote.header.banner.textColor,
        useSaleorPromotions: remote.header.banner.useSaleorPromotions,
        useSaleorVouchers: remote.header.banner.useSaleorVouchers ?? false,
        items: remote.header.banner.items ?? [],
        manualItems: remote.header.banner.manualItems ?? [],
        autoScrollIntervalSeconds: remote.header.banner.autoScrollIntervalSeconds ?? 6,
        useGradient: remote.header.banner.useGradient ?? false,
        gradientFrom: remote.header.banner.gradientFrom ?? null,
        gradientTo: remote.header.banner.gradientTo ?? null,
        gradientStops: (remote.header.banner as any).gradientStops ?? [],
        gradientAngle: (remote.header.banner as any).gradientAngle ?? 90,
        dismissible: remote.header.banner.dismissible ?? false,
      },
      showStoreName: remote.header.showStoreName,
      logoPosition: remote.header.logoPosition,
    },

    // Footer configuration
    footer: {
      showBrand: remote.footer.showBrand,
      showMenu: remote.footer.showMenu,
      showContactInfo: remote.footer.showContactInfo,
      showFooterEmail: remote.footer.showFooterEmail,
      showFooterPhone: remote.footer.showFooterPhone,
      showFooterAddress: remote.footer.showFooterAddress,
      showFooterContactButton: remote.footer.showFooterContactButton,
      showNewsletter: remote.footer.showNewsletter,
      showSocialLinks: remote.footer.showSocialLinks,
      copyrightText: remote.footer.copyrightText,
      legalLinks: remote.footer.legalLinks,
      returnPolicyPageTitle: remote.footer.returnPolicyPageTitle,
      returnPolicyHeader: remote.footer.returnPolicyHeader,
      returnPolicyContent: remote.footer.returnPolicyContent,
      returnPolicyDefaultContent: remote.footer.returnPolicyDefaultContent,
      returnPolicyFooter: remote.footer.returnPolicyFooter,
      shippingPolicyPageTitle: remote.footer.shippingPolicyPageTitle,
      shippingPolicyHeader: remote.footer.shippingPolicyHeader,
      shippingPolicyContent: remote.footer.shippingPolicyContent,
      shippingPolicyDefaultContent: remote.footer.shippingPolicyDefaultContent,
      shippingPolicyFooter: remote.footer.shippingPolicyFooter,
      privacyPolicyPageTitle: remote.footer.privacyPolicyPageTitle,
      privacyPolicyHeader: remote.footer.privacyPolicyHeader,
      privacyPolicyContent: remote.footer.privacyPolicyContent,
      privacyPolicyDefaultContent: remote.footer.privacyPolicyDefaultContent,
      privacyPolicyFooter: remote.footer.privacyPolicyFooter,
      termsOfServicePageTitle: remote.footer.termsOfServicePageTitle,
      termsOfServiceHeader: remote.footer.termsOfServiceHeader,
      termsOfServiceContent: remote.footer.termsOfServiceContent,
      termsOfServiceDefaultContent: remote.footer.termsOfServiceDefaultContent,
      termsOfServiceFooter: remote.footer.termsOfServiceFooter,
      policyPageEmptyMessage: remote.footer.policyPageEmptyMessage,
      accessibilityPageTitle: remote.footer.accessibilityPageTitle,
      accessibilityHeader: remote.footer.accessibilityHeader,
      accessibilityContent: remote.footer.accessibilityContent,
      accessibilityDefaultContent: remote.footer.accessibilityDefaultContent,
      accessibilityFooter: remote.footer.accessibilityFooter,
      vatStatement: remote.footer.vatStatement,
      showVatStatement: remote.footer.showVatStatement,
      showBusinessInfo: remote.footer.showBusinessInfo,
    },

    homepage: {
      sections: remote.homepage.sections,
      sectionOrder: remote.homepage.sectionOrder,
    },

    pages: remote.pages,

    integrations: remote.integrations,

    seo: remote.seo,

    localization: {
      ...remote.localization,
      direction: remote.localization.direction || "auto",
      rtlLocales: remote.localization.rtlLocales || ["he", "ar", "fa", "ur", "yi", "ps"],
    },

    // New fields from remote (for filters/quickFilters)
    filters: remote.filters,
    quickFilters: remote.quickFilters,

    // Promo popup configuration
    promoPopup: remote.promoPopup,

    // Hero content (extracted from homepage sections for easier access)
    heroContent: remote.homepage?.sections?.hero ? {
      title: remote.homepage.sections.hero.title || "Welcome to Our Store",
      subtitle: remote.homepage.sections.hero.subtitle || "",
      ctaText: remote.homepage.sections.hero.ctaText || "Shop Now",
      ctaLink: remote.homepage.sections.hero.ctaLink || "/products",
      imageUrl: remote.homepage.sections.hero.imageUrl || null,
      videoUrl: remote.homepage.sections.hero.videoUrl || null,
      overlayOpacity: remote.homepage.sections.hero.overlayOpacity || 40,
      textAlignment: remote.homepage.sections.hero.textAlignment || "center",
      slides: remote.homepage.sections.hero.slides || [],
    } : undefined,

    // UI components configuration
    ui: remote.ui,

    // Content/text configuration - merge with defaults to ensure all fields are present
    content: remote.content ? {
      ...remote.content,
      filters: { ...DEFAULT_FILTERS_TEXT, ...(remote.content.filters || {}) },
      error: (remote.content as any).error || DEFAULT_ERROR_TEXT,
      notFound: (remote.content as any).notFound || DEFAULT_NOT_FOUND_TEXT,
    } : {
      ...defaultStoreConfig.content,
      filters: DEFAULT_FILTERS_TEXT,
      error: DEFAULT_ERROR_TEXT,
      notFound: DEFAULT_NOT_FOUND_TEXT,
    },

    // Dark mode configuration
    darkMode: remote.darkMode,

    // Storefront UX configuration (cart display mode, etc.)
    storefront: remote.storefront,

    // Component Designer overrides (generates --cd-{key}-{prop} CSS vars)
    componentOverrides: (remote as any).componentOverrides,

    // Card overrides (legacy)
    cardOverrides: (remote as any).cardOverrides,
  } as unknown as StoreConfig;
}
