/**
 * FOOD & GROCERY STORE CONFIGURATION EXAMPLE
 * ==========================================
 * Configuration for food delivery, restaurants, grocery stores
 * Examples: UberEats-style, Grocery delivery, Meal kits
 */

import { createStoreConfig, StoreConfig } from '../store.config';

export const foodStoreConfig: StoreConfig = createStoreConfig('food', {
  store: {
    name: "FreshBite",
    tagline: "Fresh Food, Fast Delivery",
    type: "food",
    description: "Fresh groceries and prepared meals delivered to your door",
    email: "orders@freshbite.com",
    phone: "+1 (555) FRESH-01",
    address: {
      street: "789 Culinary Lane",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
  },

  branding: {
    logo: "/logos/freshbite-logo.svg",
    logoAlt: "FreshBite Logo",
    favicon: "/favicons/freshbite-favicon.ico",
    
    colors: {
      primary: "#22C55E",      // Fresh Green
      secondary: "#15803D",    // Deep Green
      accent: "#F97316",       // Appetizing Orange
      background: "#FEFCE8",   // Warm cream
      surface: "#FFFFFF",
      text: "#1C1917",
      textMuted: "#78716C",
      success: "#22C55E",
      warning: "#EAB308",
      error: "#EF4444",
    },
    
    typography: {
      fontHeading: "Poppins",
      fontBody: "Nunito",
      fontMono: "JetBrains Mono",
    },
    
    style: {
      borderRadius: "lg",
      buttonStyle: "solid",
      cardShadow: "sm",
    },
  },

  features: {
    wishlist: false,                // Not typical for food
    compareProducts: false,
    productReviews: true,           // Restaurant/dish reviews
    recentlyViewed: true,
    guestCheckout: true,
    expressCheckout: true,          // Quick reorder
    savePaymentMethods: true,
    digitalDownloads: false,
    subscriptions: true,            // Meal subscriptions
    giftCards: true,
    productBundles: true,           // Meal combos
    newsletter: true,
    promotionalBanners: true,
    abandonedCartEmails: true,
    socialLogin: true,
    shareButtons: false,
    instagramFeed: true,            // Food photography
  },

  ecommerce: {
    currency: {
      default: "USD",
      supported: ["USD"],
    },
    shipping: {
      enabled: true,
      freeShippingThreshold: 35,    // Free delivery on $35+
      showEstimatedDelivery: true,
      deliverySlots: true,          // Time slot selection
    },
    tax: {
      showPricesWithTax: true,
      taxIncludedInPrice: true,
    },
    inventory: {
      showStockLevel: true,         // "Limited availability"
      lowStockThreshold: 5,
      allowBackorders: false,       // Can't backorder food
    },
    checkout: {
      minOrderAmount: 15,           // Minimum order
      maxOrderAmount: 500,
      termsRequired: true,
    },
  },

  homepage: {
    sections: {
      hero: { enabled: true, type: "slider" },
      featuredCategories: { enabled: true, limit: 8 },     // Cuisines
      newArrivals: { enabled: true, limit: 6 },            // New dishes
      bestSellers: { enabled: true, limit: 8 },            // Popular items
      onSale: { enabled: true, limit: 4 },                 // Daily deals
      featuredBrands: { enabled: false },
      testimonials: { enabled: true },
      newsletter: { enabled: true },
      instagramFeed: { enabled: true, username: "freshbite" },
    },
  },

  integrations: {
    analytics: {
      googleAnalyticsId: "GA-XXXXXXXXX",
      googleTagManagerId: null,
      facebookPixelId: "XXXXXXXXXX",
      hotjarId: null,
    },
    marketing: {
      mailchimpListId: null,
      klaviyoApiKey: "XXXXXXXX",     // For food marketing
    },
    support: {
      intercomAppId: null,
      zendeskKey: null,
      crispWebsiteId: "XXXXXXXX",    // Live chat for orders
    },
    social: {
      facebook: "https://facebook.com/freshbite",
      instagram: "https://instagram.com/freshbite",
      twitter: null,
      youtube: null,
      tiktok: "https://tiktok.com/@freshbite",
      pinterest: "https://pinterest.com/freshbite",
    },
  },

  seo: {
    titleTemplate: "%s | FreshBite - Fresh Food Delivery",
    defaultTitle: "FreshBite - Fresh Groceries & Meals Delivered",
    defaultDescription: "Order fresh groceries and delicious prepared meals. Fast delivery, minimum order $15. Fresh food, delivered fresh!",
    defaultImage: "/og-images/freshbite-og.jpg",
    twitterHandle: null,
  },

  pages: {
    aboutUs: true,
    contact: true,
    faq: true,
    blog: true,                     // Recipes, food tips
    privacyPolicy: true,
    termsOfService: true,
    shippingPolicy: true,           // Delivery policy
    returnPolicy: true,             // Freshness guarantee
  },

  localization: {
    defaultLocale: "en-US",
    supportedLocales: ["en-US", "es-US"],  // English & Spanish
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
});

export default foodStoreConfig;

