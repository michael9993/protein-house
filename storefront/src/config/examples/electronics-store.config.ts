/**
 * ELECTRONICS STORE CONFIGURATION EXAMPLE
 * =======================================
 * Configuration for electronics and tech stores
 * Examples: Best Buy, Newegg, Apple Store style
 */

import { createStoreConfig, StoreConfig } from '../store.config';

export const electronicsStoreConfig: StoreConfig = createStoreConfig('physical', {
  store: {
    name: "TechNova",
    tagline: "Innovation at Your Fingertips",
    type: "physical",
    description: "Premium electronics, gadgets, and tech accessories",
    email: "support@technova.com",
    phone: "+1 (555) TECH-NOW",
    address: {
      street: "101 Silicon Avenue",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "United States",
    },
  },

  branding: {
    logo: "/logos/technova-logo.svg",
    logoAlt: "TechNova Logo",
    favicon: "/favicons/technova-favicon.ico",
    
    colors: {
      primary: "#3B82F6",      // Tech Blue
      secondary: "#1E293B",    // Dark slate
      accent: "#06B6D4",       // Cyan
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      textMuted: "#64748B",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    
    typography: {
      fontHeading: "Plus Jakarta Sans",
      fontBody: "Inter",
      fontMono: "SF Mono",
    },
    
    style: {
      borderRadius: "md",
      buttonStyle: "solid",
      cardShadow: "md",
    },
  },

  features: {
    wishlist: true,
    compareProducts: true,          // Compare specs (essential!)
    productReviews: true,
    recentlyViewed: true,
    scrollToTop: true,
    guestCheckout: true,
    expressCheckout: true,
    savePaymentMethods: true,
    digitalDownloads: false,
    subscriptions: false,
    giftCards: true,
    productBundles: true,           // Tech bundles
    newsletter: true,
    promotionalBanners: true,
    abandonedCartEmails: true,
    socialLogin: true,
    shareButtons: true,
    instagramFeed: false,
  },

  ecommerce: {
    currency: {
      default: "USD",
      supported: ["USD", "CAD", "EUR", "GBP", "AUD"],
    },
    shipping: {
      enabled: true,
      freeShippingThreshold: 99,    // Free shipping $99+
      showEstimatedDelivery: true,
      deliverySlots: false,
    },
    tax: {
      showPricesWithTax: false,
      taxIncludedInPrice: false,
    },
    inventory: {
      showStockLevel: true,         // "Only 3 left!"
      lowStockThreshold: 5,
      allowBackorders: true,        // Pre-orders for new tech
    },
    checkout: {
      minOrderAmount: null,
      maxOrderAmount: null,
      termsRequired: true,
    },
  },

  homepage: {
    sections: {
      hero: { enabled: true, type: "slider" },         // New launches
      featuredCategories: { enabled: true, limit: 8 },
      newArrivals: { enabled: true, limit: 8 },        // Latest tech
      bestSellers: { enabled: true, limit: 8 },
      onSale: { enabled: true, limit: 4 },
      featuredBrands: { enabled: true },               // Apple, Samsung, etc.
      testimonials: { enabled: true },
      newsletter: { enabled: true },
      instagramFeed: { enabled: false, username: null },
    },
  },

  integrations: {
    analytics: {
      googleAnalyticsId: "GA-XXXXXXXXX",
      googleTagManagerId: "GTM-XXXXXXX",
      facebookPixelId: "XXXXXXXXXX",
      hotjarId: "XXXXXXX",
    },
    marketing: {
      mailchimpListId: null,
      klaviyoApiKey: null,
    },
    support: {
      intercomAppId: "XXXXXXXX",
      zendeskKey: null,
      crispWebsiteId: null,
    },
    social: {
      facebook: "https://facebook.com/technova",
      instagram: "https://instagram.com/technova",
      twitter: "https://twitter.com/technova",
      youtube: "https://youtube.com/technova",
      tiktok: "https://tiktok.com/@technova",
      pinterest: null,
    },
  },

  seo: {
    titleTemplate: "%s | TechNova - Innovation at Your Fingertips",
    defaultTitle: "TechNova - Premium Electronics & Tech Accessories",
    defaultDescription: "Shop the latest electronics, smartphones, laptops, and tech accessories. Free shipping on orders over $99. Expert reviews and comparisons.",
    defaultImage: "/og-images/technova-og.jpg",
    twitterHandle: "@technova",
  },

  pages: {
    aboutUs: true,
    contact: true,
    faq: true,
    blog: true,                     // Tech reviews, guides
    privacyPolicy: true,
    termsOfService: true,
    shippingPolicy: true,
    returnPolicy: true,
    forgotPassword: true,
    resetPassword: true,
    verifyEmail: true,
    confirmEmail: true,
  },

  localization: {
    defaultLocale: "en-US",
    supportedLocales: ["en-US", "en-CA", "en-GB", "en-AU"],
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
});

export default electronicsStoreConfig;

