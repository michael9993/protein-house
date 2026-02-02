/**
 * DIGITAL PRODUCTS STORE CONFIGURATION EXAMPLE
 * =============================================
 * Configuration for digital product stores
 * Examples: Software, eBooks, Music, Courses, Templates
 */

import { createStoreConfig, StoreConfig } from '../store.config';

export const digitalStoreConfig: StoreConfig = createStoreConfig('digital', {
  store: {
    name: "DigitalVault",
    tagline: "Premium Digital Assets",
    type: "digital",
    description: "Your marketplace for premium digital products, templates, and software",
    email: "support@digitalvault.io",
    phone: "+1 (555) DIGITAL",
    address: undefined, // No physical address needed
  },

  branding: {
    logo: "/logos/digitalvault-logo.svg",
    logoAlt: "DigitalVault Logo",
    favicon: "/favicons/digitalvault-favicon.ico",
    
    colors: {
      primary: "#8B5CF6",      // Purple (tech/creative)
      secondary: "#0F172A",    // Dark slate
      accent: "#06B6D4",       // Cyan
      background: "#0F172A",   // Dark mode default
      surface: "#1E293B",
      text: "#F8FAFC",
      textMuted: "#94A3B8",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    
    typography: {
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
      fontMono: "Fira Code",
    },
    
    style: {
      borderRadius: "lg",
      buttonStyle: "solid",
      cardShadow: "lg",
    },
  },

  features: {
    wishlist: true,
    compareProducts: true,
    productReviews: true,
    recentlyViewed: true,
    scrollToTop: true,
    guestCheckout: false,           // Require account for downloads
    expressCheckout: true,
    savePaymentMethods: true,
    digitalDownloads: true,         // Core feature
    subscriptions: true,            // SaaS subscriptions
    giftCards: true,
    productBundles: true,           // Software bundles
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
      supported: ["USD", "EUR", "GBP", "CAD", "AUD"],
    },
    shipping: {
      enabled: false,               // No physical shipping
      freeShippingThreshold: null,
      showEstimatedDelivery: false,
      deliverySlots: false,
    },
    tax: {
      showPricesWithTax: true,      // VAT included for EU
      taxIncludedInPrice: true,
    },
    inventory: {
      showStockLevel: false,        // Unlimited digital stock
      lowStockThreshold: 0,
      allowBackorders: true,
    },
    checkout: {
      minOrderAmount: null,
      maxOrderAmount: null,
      termsRequired: true,          // License agreement
    },
  },

  homepage: {
    sections: {
      hero: { enabled: true, type: "slider" },
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

  integrations: {
    analytics: {
      googleAnalyticsId: "GA-XXXXXXXXX",
      googleTagManagerId: "GTM-XXXXXXX",
      facebookPixelId: null,
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
      facebook: null,
      instagram: null,
      twitter: "https://twitter.com/digitalvault",
      youtube: "https://youtube.com/digitalvault",
      tiktok: null,
      pinterest: null,
    },
  },

  seo: {
    titleTemplate: "%s | DigitalVault",
    defaultTitle: "DigitalVault - Premium Digital Assets & Software",
    defaultDescription: "Download premium digital products, software, templates, and more. Instant delivery, lifetime access.",
    defaultImage: "/og-images/digitalvault-og.jpg",
    twitterHandle: "@digitalvault",
  },

  pages: {
    aboutUs: true,
    contact: true,
    faq: true,
    blog: true,
    privacyPolicy: true,
    termsOfService: true,
    shippingPolicy: false,          // No shipping
    returnPolicy: true,             // Refund policy
    forgotPassword: true,
    resetPassword: true,
    verifyEmail: true,
    confirmEmail: true,
  },

  localization: {
    defaultLocale: "en-US",
    supportedLocales: ["en-US", "en-GB", "de-DE", "fr-FR"],
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
  },
});

export default digitalStoreConfig;

