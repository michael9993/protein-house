/**
 * SPORTS STORE CONFIGURATION EXAMPLE
 * ===================================
 * Configuration for sports/athletic gear stores
 * Examples: Nike, Adidas, Dick's Sporting Goods
 */

import { createStoreConfig, StoreConfig } from '../store.config';

export const sportsStoreConfig: StoreConfig = createStoreConfig('physical', {
  store: {
    name: "SportZone",
    tagline: "Gear Up for Greatness",
    type: "physical",
    description: "Premium sports equipment and athletic wear for champions",
    email: "support@sportzone.com",
    phone: "+1 (555) SPORT-01",
    address: {
      street: "456 Athletic Drive",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "United States",
    },
  },

  branding: {
    logo: "/logos/sportzone-logo.svg",
    logoAlt: "SportZone Logo",
    favicon: "/favicons/sportzone-favicon.ico",
    
    colors: {
      primary: "#FF4500",      // Energetic Orange-Red
      secondary: "#1A1A1A",    // Bold Black
      accent: "#00D4FF",       // Electric Blue
      background: "#FFFFFF",
      surface: "#F5F5F5",
      text: "#1A1A1A",
      textMuted: "#666666",
      success: "#00C853",
      warning: "#FFD600",
      error: "#FF1744",
    },
    
    typography: {
      fontHeading: "Bebas Neue",     // Bold, sporty
      fontBody: "Roboto",
      fontMono: "JetBrains Mono",
    },
    
    style: {
      borderRadius: "sm",            // Sharp, athletic look
      buttonStyle: "solid",
      cardShadow: "md",
    },
  },

  features: {
    wishlist: true,
    compareProducts: true,           // Compare gear specs
    productReviews: true,
    recentlyViewed: true,
    guestCheckout: true,
    expressCheckout: true,
    savePaymentMethods: true,
    digitalDownloads: false,
    subscriptions: false,
    giftCards: true,
    productBundles: true,            // Equipment bundles
    newsletter: true,
    promotionalBanners: true,
    abandonedCartEmails: true,
    socialLogin: true,
    shareButtons: true,
    instagramFeed: true,             // Show athletic lifestyle
  },

  ecommerce: {
    currency: {
      default: "USD",
      supported: ["USD", "CAD", "GBP", "EUR"],
    },
    shipping: {
      enabled: true,
      freeShippingThreshold: 75,     // Free shipping on $75+
      showEstimatedDelivery: true,
      deliverySlots: false,
    },
    tax: {
      showPricesWithTax: false,
      taxIncludedInPrice: false,
    },
    inventory: {
      showStockLevel: true,
      lowStockThreshold: 10,
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
      hero: { enabled: true, type: "video" },      // Dynamic sports video
      featuredCategories: { enabled: true, limit: 8 },
      newArrivals: { enabled: true, limit: 8 },
      bestSellers: { enabled: true, limit: 8 },
      onSale: { enabled: true, limit: 4 },
      featuredBrands: { enabled: true },           // Nike, Adidas, etc.
      testimonials: { enabled: true },
      newsletter: { enabled: true },
      instagramFeed: { enabled: true, username: "sportzone" },
    },
  },

  integrations: {
    analytics: {
      googleAnalyticsId: "GA-XXXXXXXXX",
      googleTagManagerId: "GTM-XXXXXXX",
      facebookPixelId: "XXXXXXXXXX",
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
      facebook: "https://facebook.com/sportzone",
      instagram: "https://instagram.com/sportzone",
      twitter: "https://twitter.com/sportzone",
      youtube: "https://youtube.com/sportzone",
      tiktok: "https://tiktok.com/@sportzone",
      pinterest: null,
    },
  },

  seo: {
    titleTemplate: "%s | SportZone - Gear Up for Greatness",
    defaultTitle: "SportZone - Premium Sports Equipment & Athletic Wear",
    defaultDescription: "Shop the best sports equipment, athletic wear, and fitness gear. Free shipping on orders over $75. Gear up for greatness!",
    defaultImage: "/og-images/sportzone-og.jpg",
    twitterHandle: "@sportzone",
  },

  pages: {
    aboutUs: true,
    contact: true,
    faq: true,
    blog: true,                      // Training tips, gear guides
    privacyPolicy: true,
    termsOfService: true,
    shippingPolicy: true,
    returnPolicy: true,
  },

  localization: {
    defaultLocale: "en-US",
    supportedLocales: ["en-US", "en-CA", "en-GB"],
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
});

export default sportsStoreConfig;

