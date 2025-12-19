/**
 * STORE CONFIGURATION
 * ====================
 * This is the central configuration file for your store.
 * Customize these values to adapt the template for any client/store type.
 * 
 * Store Types Supported:
 * - physical: Traditional retail (clothing, electronics, sports gear)
 * - digital: Downloadable products (software, ebooks, music)
 * - food: Food & grocery (restaurants, grocery stores)
 * - services: Service-based (consulting, appointments)
 * - mixed: Combination of above
 */

export type StoreType = 'physical' | 'digital' | 'food' | 'services' | 'mixed';

export interface StoreConfig {
  // ============================================
  // BASIC STORE INFORMATION
  // ============================================
  store: {
    name: string;
    tagline: string;
    type: StoreType;
    description: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };

  // ============================================
  // BRANDING & THEME
  // ============================================
  branding: {
    logo: string;           // Path to logo image
    logoAlt: string;        // Alt text for logo
    favicon: string;        // Path to favicon
    
    colors: {
      primary: string;      // Main brand color (buttons, links)
      secondary: string;    // Secondary color (headers, accents)
      accent: string;       // Accent color (highlights, badges)
      background: string;   // Page background
      surface: string;      // Card/component background
      text: string;         // Primary text color
      textMuted: string;    // Secondary text color
      success: string;      // Success states
      warning: string;      // Warning states
      error: string;        // Error states
    };
    
    typography: {
      fontHeading: string;  // Font for headings
      fontBody: string;     // Font for body text
      fontMono: string;     // Font for code/prices
    };
    
    style: {
      borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
      buttonStyle: 'solid' | 'outline' | 'ghost';
      cardShadow: 'none' | 'sm' | 'md' | 'lg';
    };
  };

  // ============================================
  // FEATURE TOGGLES
  // ============================================
  features: {
    // Customer Features
    wishlist: boolean;
    compareProducts: boolean;
    productReviews: boolean;
    recentlyViewed: boolean;
    
    // Checkout Features
    guestCheckout: boolean;
    expressCheckout: boolean;
    savePaymentMethods: boolean;
    
    // Product Features
    digitalDownloads: boolean;
    subscriptions: boolean;
    giftCards: boolean;
    productBundles: boolean;
    
    // Marketing Features
    newsletter: boolean;
    promotionalBanners: boolean;
    abandonedCartEmails: boolean;
    
    // Social Features
    socialLogin: boolean;
    shareButtons: boolean;
    instagramFeed: boolean;
  };

  // ============================================
  // E-COMMERCE SETTINGS
  // ============================================
  ecommerce: {
    currency: {
      default: string;      // Default currency code (USD, EUR, etc.)
      supported: string[];  // List of supported currencies
    };
    
    shipping: {
      enabled: boolean;
      freeShippingThreshold: number | null;  // null = no free shipping
      showEstimatedDelivery: boolean;
      deliverySlots: boolean;  // For food/grocery stores
    };
    
    tax: {
      showPricesWithTax: boolean;
      taxIncludedInPrice: boolean;
    };
    
    inventory: {
      showStockLevel: boolean;
      lowStockThreshold: number;
      allowBackorders: boolean;
    };
    
    checkout: {
      minOrderAmount: number | null;
      maxOrderAmount: number | null;
      termsRequired: boolean;
    };
  };

  // ============================================
  // HOMEPAGE SECTIONS
  // ============================================
  homepage: {
    sections: {
      hero: {
        enabled: boolean;
        type: 'image' | 'video' | 'slider';
      };
      featuredCategories: {
        enabled: boolean;
        limit: number;
      };
      newArrivals: {
        enabled: boolean;
        limit: number;
      };
      bestSellers: {
        enabled: boolean;
        limit: number;
      };
      onSale: {
        enabled: boolean;
        limit: number;
      };
      featuredBrands: {
        enabled: boolean;
      };
      testimonials: {
        enabled: boolean;
      };
      newsletter: {
        enabled: boolean;
      };
      instagramFeed: {
        enabled: boolean;
        username: string | null;
      };
    };
  };

  // ============================================
  // PAGES
  // ============================================
  pages: {
    aboutUs: boolean;
    contact: boolean;
    faq: boolean;
    blog: boolean;
    privacyPolicy: boolean;
    termsOfService: boolean;
    shippingPolicy: boolean;
    returnPolicy: boolean;
  };

  // ============================================
  // INTEGRATIONS
  // ============================================
  integrations: {
    analytics: {
      googleAnalyticsId: string | null;
      googleTagManagerId: string | null;
      facebookPixelId: string | null;
      hotjarId: string | null;
    };
    
    marketing: {
      mailchimpListId: string | null;
      klaviyoApiKey: string | null;
    };
    
    support: {
      intercomAppId: string | null;
      zendeskKey: string | null;
      crispWebsiteId: string | null;
    };
    
    social: {
      facebook: string | null;
      instagram: string | null;
      twitter: string | null;
      youtube: string | null;
      tiktok: string | null;
      pinterest: string | null;
    };
  };

  // ============================================
  // SEO DEFAULTS
  // ============================================
  seo: {
    titleTemplate: string;  // e.g., "%s | Store Name"
    defaultTitle: string;
    defaultDescription: string;
    defaultImage: string;   // OG image
    twitterHandle: string | null;
  };

  // ============================================
  // LOCALIZATION
  // ============================================
  localization: {
    defaultLocale: string;
    supportedLocales: string[];
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================
// This is the template default - customize for each client
export const defaultStoreConfig: StoreConfig = {
  store: {
    name: "Your Store Name",
    tagline: "Your Store Tagline",
    type: "physical",
    description: "Welcome to our online store",
    email: "support@yourstore.com",
    phone: "+1 (555) 123-4567",
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
    },
  },

  branding: {
    logo: "/logo.svg",
    logoAlt: "Store Logo",
    favicon: "/favicon.ico",
    
    colors: {
      primary: "#2563EB",      // Blue
      secondary: "#1F2937",    // Dark gray
      accent: "#F59E0B",       // Amber
      background: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      textMuted: "#6B7280",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
    },
    
    typography: {
      fontHeading: "Inter",
      fontBody: "Inter",
      fontMono: "JetBrains Mono",
    },
    
    style: {
      borderRadius: "md",
      buttonStyle: "solid",
      cardShadow: "sm",
    },
  },

  features: {
    wishlist: true,
    compareProducts: false,
    productReviews: true,
    recentlyViewed: true,
    guestCheckout: true,
    expressCheckout: false,
    savePaymentMethods: true,
    digitalDownloads: false,
    subscriptions: false,
    giftCards: true,
    productBundles: false,
    newsletter: true,
    promotionalBanners: true,
    abandonedCartEmails: false,
    socialLogin: false,
    shareButtons: true,
    instagramFeed: false,
  },

  ecommerce: {
    currency: {
      default: "USD",
      supported: ["USD", "EUR", "GBP"],
    },
    shipping: {
      enabled: true,
      freeShippingThreshold: 50,
      showEstimatedDelivery: true,
      deliverySlots: false,
    },
    tax: {
      showPricesWithTax: false,
      taxIncludedInPrice: false,
    },
    inventory: {
      showStockLevel: true,
      lowStockThreshold: 5,
      allowBackorders: false,
    },
    checkout: {
      minOrderAmount: null,
      maxOrderAmount: null,
      termsRequired: true,
    },
  },

  homepage: {
    sections: {
      hero: { enabled: true, type: "image" },
      featuredCategories: { enabled: true, limit: 6 },
      newArrivals: { enabled: true, limit: 8 },
      bestSellers: { enabled: true, limit: 8 },
      onSale: { enabled: true, limit: 4 },
      featuredBrands: { enabled: false },
      testimonials: { enabled: true },
      newsletter: { enabled: true },
      instagramFeed: { enabled: false, username: null },
    },
  },

  pages: {
    aboutUs: true,
    contact: true,
    faq: true,
    blog: false,
    privacyPolicy: true,
    termsOfService: true,
    shippingPolicy: true,
    returnPolicy: true,
  },

  integrations: {
    analytics: {
      googleAnalyticsId: null,
      googleTagManagerId: null,
      facebookPixelId: null,
      hotjarId: null,
    },
    marketing: {
      mailchimpListId: null,
      klaviyoApiKey: null,
    },
    support: {
      intercomAppId: null,
      zendeskKey: null,
      crispWebsiteId: null,
    },
    social: {
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null,
      tiktok: null,
      pinterest: null,
    },
  },

  seo: {
    titleTemplate: "%s | Your Store Name",
    defaultTitle: "Your Store Name - Online Shopping",
    defaultDescription: "Shop the best products at Your Store Name. Free shipping on orders over $50.",
    defaultImage: "/og-image.jpg",
    twitterHandle: null,
  },

  localization: {
    defaultLocale: "en-US",
    supportedLocales: ["en-US"],
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
};

// ============================================
// STORE TYPE PRESETS
// ============================================
// Quick configurations for different store types

export const storeTypePresets: Record<StoreType, Partial<StoreConfig>> = {
  physical: {
    // Standard retail - default config works
  },
  
  digital: {
    features: {
      wishlist: true,
      compareProducts: false,
      productReviews: true,
      recentlyViewed: true,
      guestCheckout: true,
      expressCheckout: true,
      savePaymentMethods: true,
      digitalDownloads: true,
      subscriptions: true,
      giftCards: true,
      productBundles: true,
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: true,
      instagramFeed: false,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD", "EUR", "GBP"] },
      shipping: {
        enabled: false,  // No shipping for digital
        freeShippingThreshold: null,
        showEstimatedDelivery: false,
        deliverySlots: false,
      },
      tax: { showPricesWithTax: true, taxIncludedInPrice: true },
      inventory: { showStockLevel: false, lowStockThreshold: 0, allowBackorders: true },
      checkout: { minOrderAmount: null, maxOrderAmount: null, termsRequired: true },
    },
  },
  
  food: {
    features: {
      wishlist: false,
      compareProducts: false,
      productReviews: true,
      recentlyViewed: true,
      guestCheckout: true,
      expressCheckout: true,
      savePaymentMethods: true,
      digitalDownloads: false,
      subscriptions: true,  // Meal subscriptions
      giftCards: true,
      productBundles: true,  // Meal combos
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: false,
      instagramFeed: true,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD"] },
      shipping: {
        enabled: true,
        freeShippingThreshold: 30,
        showEstimatedDelivery: true,
        deliverySlots: true,  // Time slot delivery
      },
      tax: { showPricesWithTax: true, taxIncludedInPrice: true },
      inventory: { showStockLevel: true, lowStockThreshold: 10, allowBackorders: false },
      checkout: { minOrderAmount: 15, maxOrderAmount: 500, termsRequired: true },
    },
  },
  
  services: {
    features: {
      wishlist: false,
      compareProducts: false,
      productReviews: true,
      recentlyViewed: false,
      guestCheckout: false,  // Require account for services
      expressCheckout: false,
      savePaymentMethods: true,
      digitalDownloads: false,
      subscriptions: true,
      giftCards: true,
      productBundles: true,  // Service packages
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: true,
      instagramFeed: false,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD", "EUR"] },
      shipping: {
        enabled: false,
        freeShippingThreshold: null,
        showEstimatedDelivery: false,
        deliverySlots: true,  // Appointment slots
      },
      tax: { showPricesWithTax: true, taxIncludedInPrice: true },
      inventory: { showStockLevel: false, lowStockThreshold: 0, allowBackorders: true },
      checkout: { minOrderAmount: null, maxOrderAmount: null, termsRequired: true },
    },
  },
  
  mixed: {
    // Enable everything for mixed stores
    features: {
      wishlist: true,
      compareProducts: true,
      productReviews: true,
      recentlyViewed: true,
      guestCheckout: true,
      expressCheckout: true,
      savePaymentMethods: true,
      digitalDownloads: true,
      subscriptions: true,
      giftCards: true,
      productBundles: true,
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: true,
      instagramFeed: true,
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Merge default config with store type preset and custom overrides
 */
export function createStoreConfig(
  storeType: StoreType,
  customConfig: Partial<StoreConfig> = {}
): StoreConfig {
  const preset = storeTypePresets[storeType];
  
  return {
    ...defaultStoreConfig,
    ...preset,
    ...customConfig,
    store: {
      ...defaultStoreConfig.store,
      ...(preset as any)?.store,
      ...customConfig.store,
      type: storeType,
    },
    branding: {
      ...defaultStoreConfig.branding,
      ...(preset as any)?.branding,
      ...customConfig.branding,
      colors: {
        ...defaultStoreConfig.branding.colors,
        ...(preset as any)?.branding?.colors,
        ...customConfig.branding?.colors,
      },
    },
    features: {
      ...defaultStoreConfig.features,
      ...(preset as any)?.features,
      ...customConfig.features,
    },
    ecommerce: {
      ...defaultStoreConfig.ecommerce,
      ...(preset as any)?.ecommerce,
      ...customConfig.ecommerce,
      shipping: {
        ...defaultStoreConfig.ecommerce.shipping,
        ...(preset as any)?.ecommerce?.shipping,
        ...customConfig.ecommerce?.shipping,
      },
    },
  } as StoreConfig;
}

/**
 * Get CSS variables from store config
 */
export function getThemeCSSVariables(config: StoreConfig): Record<string, string> {
  const { colors, typography, style } = config.branding;
  
  const radiusMap = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  };
  
  return {
    '--store-primary': colors.primary,
    '--store-secondary': colors.secondary,
    '--store-accent': colors.accent,
    '--store-bg': colors.background,
    '--store-surface': colors.surface,
    '--store-text': colors.text,
    '--store-text-muted': colors.textMuted,
    '--store-success': colors.success,
    '--store-warning': colors.warning,
    '--store-error': colors.error,
    '--store-font-heading': typography.fontHeading,
    '--store-font-body': typography.fontBody,
    '--store-font-mono': typography.fontMono,
    '--store-radius': radiusMap[style.borderRadius],
  };
}

