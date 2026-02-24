import { StorefrontConfig, StorefrontConfigSchema } from "./schema";
import { CONFIG_VERSION } from "@saleor/apps-storefront-config";

// Re-export so existing consumers keep working
export { CONFIG_VERSION };

// Lazy-load Node.js modules only when needed (server-side only)
// This prevents client-side bundling errors
// Using eval to prevent webpack from trying to bundle these modules
function getNodeModules() {
  if (typeof window !== "undefined") {
    // Client-side - return null
    return { fs: null, path: null };
  }

  // Server-side - try to load using eval to prevent webpack bundling
  try {
    const fs = typeof require !== "undefined" ? eval('require("fs")') : null;
    const path = typeof require !== "undefined" ? eval('require("path")') : null;
    return { fs, path };
  } catch {
    return { fs: null, path: null };
  }
}

// Cache for loaded sample configs
let sampleConfigCache: {
  hebrew?: StorefrontConfig;
  english?: StorefrontConfig;
} = {};

/**
 * Clear the sample config cache (called when sample files are updated)
 */
export function clearSampleConfigCache(): void {
  sampleConfigCache = {};
  console.log(`[getDefaultConfig] Cache cleared`);
}

/**
 * Load sample config from file
 * Returns null if file doesn't exist or is invalid
 */
function loadSampleConfig(filePath: string): StorefrontConfig | null {
  try {
    const { fs, path } = getNodeModules();
    if (!fs || !path) {
      console.warn(`[getDefaultConfig] Node.js fs/path modules not available (client-side or not available)`);
      return null;
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`[getDefaultConfig] Sample config file not found: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);

    // Handle both formats: direct config or { config: {...} }
    const configData = parsed.config || parsed;

    // Validate the config
    const validated = StorefrontConfigSchema.safeParse(configData);
    if (!validated.success) {
      console.error(`[getDefaultConfig] Invalid sample config in ${filePath}:`, validated.error.errors);
      return null;
    }

    return validated.data;
  } catch (error) {
    console.error(`[getDefaultConfig] Error loading sample config from ${filePath}:`, error);
    return null;
  }
}

/**
 * Get sample config for a channel
 * Uses Hebrew config for 'ils' channel, English for others.
 * When adding new schema fields: update getFallbackDefaultConfig(), sample-config-import.json (Hebrew), and sample-config-import-en.json (English).
 */
function getSampleConfigForChannel(channelSlug: string): StorefrontConfig | null {
  // Determine which sample file to use (ILS/he = Hebrew, else = English)
  const isHebrew = channelSlug.toLowerCase() === "ils" || channelSlug.toLowerCase() === "he";

  // Use cache if available
  if (isHebrew && sampleConfigCache.hebrew) {
    return sampleConfigCache.hebrew;
  }
  if (!isHebrew && sampleConfigCache.english) {
    return sampleConfigCache.english;
  }

  // Load from file
  const { fs, path } = getNodeModules();
  if (!fs || !path) {
    console.warn(`[getDefaultConfig] Node.js modules not available (client-side or not available), cannot load sample config`);
    return null;
  }

  // Try multiple possible paths (development vs production)
  const possibleRoots: string[] = [];

  // Add current working directory
  if (typeof process !== "undefined" && process.cwd) {
    possibleRoots.push(process.cwd());
  }

  // Try relative to this file (if __dirname is available)
  try {
    if (typeof __dirname !== "undefined") {
      possibleRoots.push(path.resolve(__dirname, "../.."));
      possibleRoots.push(path.resolve(__dirname, "../../.."));
    }
  } catch {
    // Ignore if __dirname is not available
  }

  let sampleFile: string | null = null;
  const fileName = isHebrew ? "sample-config-import.json" : "sample-config-import-en.json";

  for (const root of possibleRoots) {
    const candidate = path.join(root, fileName);
    if (fs.existsSync(candidate)) {
      sampleFile = candidate;
      break;
    }
  }

  if (!sampleFile) {
    console.warn(`[getDefaultConfig] Sample config file "${fileName}" not found in any of: ${possibleRoots.join(", ")}`);
    return null;
  }

  const config = loadSampleConfig(sampleFile);

  // Cache it
  if (config) {
    if (isHebrew) {
      sampleConfigCache.hebrew = config;
    } else {
      sampleConfigCache.english = config;
    }
  }

  return config;
}

/**
 * Fallback default config (used if sample files are not available)
 */
const getFallbackDefaultConfig = (channelSlug: string): StorefrontConfig => ({
  version: CONFIG_VERSION,
  channelSlug,

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
      primary: "#2563EB",
      secondary: "#1F2937",
      accent: "#F59E0B",
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
    scrollToTop: true,
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
    relatedProducts: true,
    stockAlerts: true,
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
      defaultEstimatedMinDays: 2,
      defaultEstimatedMaxDays: 5,
      estimatedDeliveryFormat: "range" as const,
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

  header: {
    banner: {
      enabled: true,
      text: "Free shipping on orders over $50 • Fast delivery worldwide",
      backgroundColor: null, // use primary
      textColor: null,       // white
      useSaleorPromotions: false,
      useSaleorVouchers: false,
      items: [],
      manualItems: [],
      autoScrollIntervalSeconds: 6,
      useGradient: false,
      gradientFrom: null,
      gradientTo: null,
      gradientStops: [],
      gradientAngle: 90,
      dismissible: false,
    },
    showStoreName: true,
    logoPosition: "left",
  },

  footer: {
    showBrand: true,
    showMenu: true,
    showContactInfo: true,
    showNewsletter: true,
    showSocialLinks: true,
    copyrightText: null, // use default
    legalLinks: {
      trackOrder: {
        enabled: true,
        url: "/track-order",
      },
      privacyPolicy: {
        enabled: true,
        url: "/pages/privacy-policy",
      },
      termsOfService: {
        enabled: true,
        url: "/pages/terms-of-service",
      },
      shippingPolicy: {
        enabled: true,
        url: "/pages/shipping-policy",
      },
      returnPolicy: {
        enabled: true,
        url: "/pages/return-policy",
      },
    },
    policyPageEmptyMessage: "This policy has not been configured yet. Content can be set in Storefront Control under Footer → Policy Page Content.",
  },

  homepage: {
    sections: {
      // Core hero section
      hero: {
        enabled: true,
        type: "image",
        title: "Welcome to Our Store",
        subtitle: "Discover amazing products at great prices",
        ctaText: "Shop Now",
        ctaLink: "/products",
        badgeText: "New Season Collection",
        imageUrl: null,
        videoUrl: null,
        slides: [],
        overlayOpacity: 40,
        textAlignment: "center",
        autoRotateSeconds: 4,
        showProgressBar: true,
        showNavDots: true,
        background: { style: "solid", color: "#0a0a0a", secondaryColor: null },
      },
      // Trust indicators strip
      trustStrip: {
        enabled: true,
        freeShippingText: null, // Auto-generate from ecommerce config
        easyReturnsText: null,
        secureCheckoutText: null,
        supportText: null,
        background: { style: "gradient", color: null, secondaryColor: null },
      },
      // Scrolling marquee
      marquee: {
        enabled: true,
        text: "Free shipping on all orders over $100! • Shop the new collection now • Limited time offer",
        speedSeconds: 20,
        textColor: null,
        background: { style: "solid", color: "#0a0a0a", secondaryColor: null },
      },
      // Brand partners grid
      brandGrid: {
        enabled: true,
        title: null, // Use content.homepage.brandsTitle
        subtitle: null,
        maxBrands: 12,
        showLogos: true,
        layout: "grid",
        background: { style: "solid", color: "#ffffff", secondaryColor: null },
      },
      // Shop by category
      categories: {
        enabled: true,
        title: null, // Use content.homepage.categoriesTitle
        subtitle: null, // Use content.homepage.categoriesSubtitle
        maxCategories: 6,
        showProductCount: true,
        showSubcategories: true,
        layoutStyle: "mosaic",
        background: { style: "color-mix", color: null, secondaryColor: null, mixPercentage: 3 },
      },
      // Trending/new arrivals
      trending: {
        enabled: true,
        title: null, // Use content.homepage.newArrivalsTitle
        subtitle: null, // Use content.homepage.newArrivalsSubtitle
        collectionSlug: "new-arrivals",
        fallbackToNewest: true,
        maxProducts: 4,
        layout: "grid",
        background: { style: "solid", color: "#ffffff", secondaryColor: null },
      },
      // Promotion banner
      promotionBanner: {
        enabled: true,
        badgeText: "Special Offer",
        title: "Don't miss out",
        highlight: "Up to 25% off",
        description: "Premium performance gear for run, court, and studio. Limited time collection.",
        primaryCta: { text: "Shop Sale Items", link: "/products?collection=sale" },
        secondaryCta: { text: "All Products", link: "/products" },
        autoDetectDiscount: true,
        background: { style: "gradient", color: "#ffffff", secondaryColor: "#f5f5f5" },
      },
      // Flash deals / sale products
      flashDeals: {
        enabled: true,
        title: null, // Use content.homepage.onSaleTitle
        subtitle: null, // Use content.homepage.onSaleSubtitle
        badgeTemplate: "Up to {discount}% OFF",
        collectionSlug: "sale",
        maxProducts: 8,
        background: { style: "solid", color: "#ffffff", secondaryColor: null },
      },
      // Collection mosaic
      collectionMosaic: {
        enabled: true,
        title: "Shop by Collection",
        subtitle: "Curated for you",
        maxCollections: 5,
        excludeSlugs: ["hero-banner", "testimonials", "brands", "new-arrivals", "best-sellers", "sale"],
        layoutStyle: "mosaic",
        background: { style: "gradient", color: "#ffffff", secondaryColor: "#f9fafb" },
      },
      // Best sellers
      bestSellers: {
        enabled: true,
        title: null, // Use content.homepage.bestSellersTitle
        subtitle: null, // Use content.homepage.bestSellersSubtitle
        collectionSlug: "best-sellers",
        fallbackToTopRated: true,
        maxProducts: 6,
        layout: "horizontal-scroll",
        background: { style: "solid", color: "#ffffff", secondaryColor: null },
      },
      // Customer feedback / testimonials
      customerFeedback: {
        enabled: true,
        title: null, // Use content.homepage.testimonialsTitle
        subtitle: null, // Use content.homepage.testimonialsSubtitle
        maxReviews: 3,
        minRating: 4,
        showProductName: true,
        background: { style: "solid", color: "#ffffff", secondaryColor: null },
        starColor: "#FFD700",
        starEmptyColor: null,
      },
      // Newsletter signup
      newsletter: {
        enabled: true,
        title: null, // Use content.general.newsletterTitle
        subtitle: null, // Use content.general.newsletterDescription
        buttonText: null, // Use content.general.newsletterButton
        placeholder: null,
        layout: "stacked",
        background: { style: "solid", color: null, secondaryColor: null },
      },
      // Recently viewed products
      recentlyViewed: {
        enabled: true,
        background: { style: "none", color: null, secondaryColor: null },
      },
      // Legacy sections (for backward compatibility)
      featuredCategories: { enabled: false, limit: 6, background: { style: "none", color: null, secondaryColor: null } },
      newArrivals: { enabled: false, limit: 8, background: { style: "none", color: null, secondaryColor: null } },
      feature: {
        enabled: false,
        title: "Featured Collection",
        description: "Discover our hand-picked selection of premium products.",
        imageUrl: null,
        imagePosition: "left",
        ctaText: "Shop Now",
        ctaLink: "/collections/featured",
        background: { style: "none", color: null, secondaryColor: null },
      },
      onSale: { enabled: false, limit: 4, background: { style: "none", color: null, secondaryColor: null } },
      featuredBrands: { enabled: false, background: { style: "none", color: null, secondaryColor: null } },
      testimonials: {
        enabled: false,
        background: { style: "none", color: null, secondaryColor: null },
        starColor: "#FFD700",
        starEmptyColor: null,
        starSize: "base",
        loadingReviewsText: null,
        verifiedPurchaseLabel: null,
        customerLabel: null,
      },
      instagramFeed: { enabled: false, username: null, background: { style: "none", color: null, secondaryColor: null } },
    },
    sectionOrder: [
      "hero",
      "trustStrip",
      "marquee",
      "brandGrid",
      "categories",
      "trending",
      "promotionBanner",
      "flashDeals",
      "collectionMosaic",
      "bestSellers",
      "customerFeedback",
      "newsletter",
    ],
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
    forgotPassword: true,
    resetPassword: true,
    verifyEmail: true,
    confirmEmail: true,
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
      whatsappBusinessNumber: null,
      whatsappDefaultMessage: null,
    },
    social: {
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null,
      tiktok: null,
      pinterest: null,
    },
    cookieConsent: {
      enabled: true,
      position: "bottom" as const,
      consentExpiryDays: 365,
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
    direction: "auto", // "auto" = detect from locale, "ltr", "rtl"
    rtlLocales: ["he", "ar", "fa", "ur", "yi", "ps"], // Locales that trigger RTL when direction is "auto"
  },

  filters: {
    enabled: true,
    priceFilter: { enabled: true, showQuickButtons: true },
    ratingFilter: { enabled: true },
    brandFilter: { enabled: true },
    sizeFilter: { enabled: true },
    colorFilter: { enabled: true },
    categoryFilter: { enabled: true },
    collectionFilter: { enabled: true },
    stockFilter: { enabled: true },
  },

  quickFilters: {
    enabled: true,
    showCategories: true,
    showCollections: true,
    showBrands: true,
    categoryLimit: 8,
    collectionLimit: 6,
    brandLimit: 6,
    style: {
      cardWidth: 160,
      cardHeight: 220,
      cardGap: 0.5,
      titleFontSize: "base",
      titleFontWeight: "semibold",
      arrowSize: 48,
      arrowIconSize: 24,
      titleColor: null,
      valueColor: null,
      activeValueColor: null,
      shopAllButtonBackgroundColor: null,
      shopAllButtonTextColor: null,
      shopAllButtonHoverBackgroundColor: null,
      shopAllButtonBorderColor: null,
      navbarMode: {
        buttonPaddingX: 14,        // px-3.5
        buttonPaddingY: 6,           // py-1.5
        buttonFontSize: "xs",
        buttonFontWeight: "semibold",
        buttonBorderRadius: "full",
        buttonGap: 8,             // gap-2
        groupLabelFontSize: "xs", // text-[10px] (10px)
        groupLabelPaddingX: 8,    // px-2
        groupLabelPaddingY: 4,    // py-1
        separatorWidth: 1,        // w-px
        separatorHeight: 24,      // h-6
        containerPaddingY: 10,    // py-2.5
        backgroundColor: null,    // bg-white
        borderTopColor: null,
        borderBottomColor: null,
        shadowColor: null,
      },
    },
  },

  promoPopup: {
    enabled: true,
    title: "Special Offer",
    body: "Don't miss out on our biggest sale of the season! Shop now and save on your favorite items.",
    badge: "Up to 25% Off",
    imageUrl: null,
    backgroundImageUrl: null,
    ctaText: "Shop Sale Items",
    ctaLink: "/products?onSale=true",
    itemsOnSaleText: "{count} {count, plural, =1 {item} other {items}} on sale",
    maybeLaterText: "Maybe later",
    delaySeconds: 2,
    showOncePerSession: false,
    ttlHours: 24,
    excludeCheckout: true,
    excludeCart: true,
    autoDetectSales: true,
  },

  ui: {
    buttons: {
      borderRadius: "md",
      primary: {
        backgroundColor: null, // use primary color
        textColor: null,       // white
        hoverBackgroundColor: null, // darken primary
        borderColor: null,
      },
      secondary: {
        backgroundColor: null, // use secondary color
        textColor: null,       // white
        hoverBackgroundColor: null,
        borderColor: null,
      },
      outline: {
        backgroundColor: null, // transparent
        textColor: null,       // use primary
        hoverBackgroundColor: null,
        borderColor: null,     // use primary
      },
      danger: {
        backgroundColor: null, // use error color
        textColor: null,       // white
        hoverBackgroundColor: null,
        borderColor: null,
      },
    },
    badges: {
      sale: {
        backgroundColor: null, // use error/red
        textColor: null,       // white
        borderRadius: "sm",
      },
      new: {
        backgroundColor: null, // use success/green
        textColor: null,       // white
        borderRadius: "sm",
      },
      outOfStock: {
        backgroundColor: null, // gray
        textColor: null,       // white
        borderRadius: "sm",
      },
      lowStock: {
        backgroundColor: null, // use warning
        textColor: null,       // white
        borderRadius: "sm",
      },
      discount: {
        backgroundColor: null, // use error/red
        textColor: null,       // white
        borderRadius: "full",
      },
      featured: {
        backgroundColor: null, // use accent
        textColor: null,       // white
        borderRadius: "sm",
      },
    },
    inputs: {
      borderRadius: "md",
      borderColor: null,      // neutral-200
      focusBorderColor: null, // primary
      focusRingColor: null,   // primary with opacity
      backgroundColor: null,  // white
      placeholderColor: null, // neutral-400
    },
    checkbox: {
      checkedBackgroundColor: null, // primary
      borderRadius: "sm",
    },
    productCard: {
      borderRadius: "lg",
      shadow: "sm",
      hoverShadow: "lg",
      showQuickView: false,
      showWishlistButton: true,
      showAddToCart: true,
      imageAspectRatio: "square",
      hoverEffect: "lift",
      badgePosition: "top-start",
      showBrandLabel: true,
      showRating: true,
      imageFit: "cover",
      textStyles: {
        name: { fontSize: "sm", fontWeight: "semibold", color: null },
        price: { fontSize: "base", fontWeight: "bold", color: null },
        originalPrice: { fontSize: "sm", fontWeight: "normal", color: null },
        reviewCount: { fontSize: "xs", fontWeight: "normal", color: null },
      },
    },
    toasts: {
      position: "bottom-right",
      borderRadius: "md",
      success: {
        backgroundColor: null, // green-50
        textColor: null,       // green-800
        iconColor: null,       // green-500
      },
      error: {
        backgroundColor: null, // red-50
        textColor: null,       // red-800
        iconColor: null,       // red-500
      },
      warning: {
        backgroundColor: null, // yellow-50
        textColor: null,       // yellow-800
        iconColor: null,       // yellow-500
      },
      info: {
        backgroundColor: null, // blue-50
        textColor: null,       // blue-800
        iconColor: null,       // blue-500
      },
    },
    icons: {
      style: "outline",
      defaultColor: null,     // inherit
      activeColor: null,      // primary
    },
    activeFiltersTags: {
      containerBackgroundColor: null, // bg-white
      containerBorderColor: null,     // border-neutral-200
      containerBorderRadius: "lg",
      containerPadding: 16,           // p-4
      containerShadow: "sm",
      titleFontSize: "sm",
      titleFontWeight: "semibold",
      titleColor: null,               // text-neutral-900
      clearAllButtonFontSize: "xs",
      clearAllButtonFontWeight: "medium",
      clearAllButtonColor: null,      // text-neutral-500
      clearAllButtonHoverColor: null, // hover:text-neutral-700
      tagBackgroundColor: null,       // bg-neutral-50
      tagBorderColor: null,           // border-neutral-200
      tagTextColor: null,             // text-neutral-700
      tagHoverBackgroundColor: null,  // hover:bg-neutral-100
      tagHoverBorderColor: null,      // hover:border-neutral-300
      tagBorderRadius: "full",
      tagPaddingX: 12,                // px-3
      tagPaddingY: 6,                 // py-1.5
      tagFontSize: "xs",
      tagFontWeight: "medium",
      tagGap: 8,                      // gap-2
      removeButtonSize: 16,           // h-4 w-4
      removeButtonColor: null,        // text-neutral-400
      removeButtonHoverBackgroundColor: null, // hover:bg-neutral-200
      removeButtonHoverColor: null,   // hover:text-neutral-600
      removeButtonBorderRadius: "full",
    },
    filterSidebar: {
      checkboxAccentColor: null,         // inherit neutral-900
      sectionTitleFontSize: "xs",
      sectionTitleFontWeight: "semibold",
      sectionTitleColor: null,           // neutral-900
      sectionTitleHoverColor: null,      // neutral-600
      chevronColor: null,                // neutral-400
      chevronHoverColor: null,           // neutral-600
      itemTextFontSize: "xs",
      itemTextColor: null,               // neutral-800
      itemCountColor: null,              // neutral-400
      sizeChipSelectedBg: null,          // neutral-900
      sizeChipSelectedText: null,        // white
      sizeChipSelectedBorder: null,      // neutral-900
      clearAllButtonBg: null,            // neutral-100
      clearAllButtonText: null,          // neutral-600
      clearAllButtonBorder: null,        // neutral-200
      clearAllButtonHoverBg: null,       // neutral-200
      clearAllButtonHoverText: null,     // neutral-900
      priceInputFocusRingColor: null,    // primary
      priceQuickButtonActiveBg: null,    // primary
      priceQuickButtonActiveText: null,  // white
      mobileShowResultsBg: null,         // primary
      mobileShowResultsText: null,       // white
    },
    cart: {
      displayMode: "drawer",
      drawerSide: "right",
      showDeleteText: false,
      showSaveForLater: false,
    },
    sectionViewAllButton: {
      style: "pill",
      icon: "chevron",
    },
  },

  content: {
    cart: {
      emptyCartTitle: "Your cart is empty",
      emptyCartMessage: "Looks like you haven't added anything to your cart yet.",
      cartTitle: "Shopping Cart",
      checkoutButton: "Checkout",
      continueShoppingButton: "Continue Shopping",
      giftLabel: "Gift",
      giftAddedMessage: "A free gift has been added to your cart.",
      giftRemoveHint: "(You can remove it)",
      deliverySummaryLabel: "All items arrive within {days} business days",
      loadingCheckoutTitle: "Loading Checkout...",
      loadingCheckoutMessage: "Please wait while we prepare your checkout",
      selectItemsButton: "Select Items",
      preparingCheckout: "Preparing...",
      loadingCheckout: "Loading...",
    } as unknown as StorefrontConfig["content"]["cart"],
    product: {
      addToCartButton: "Add to Cart",
      buyNowButton: "Buy Now",
      outOfStockText: "Out of Stock",
      lowStockText: "Only {count} left in stock",
      inStockText: "In Stock",
      saleBadgeText: "Sale",
      newBadgeText: "New",
      reviewsTitle: "Customer Reviews",
      writeReviewButton: "Write a Review",
      noReviewsText: "No reviews yet. Be the first to review this product!",
      quickAddButton: "Quick add",
      viewFullPageLink: "View full page",
      loadingProductText: "Loading product...",
      productDetailsTitle: "Product Details",
      closeButton: "Close",
      productNotFoundText: "Product not found",
      errorLoadingProductText: "Failed to load product",
    } as unknown as StorefrontConfig["content"]["product"],
    account: {
      signInTitle: "Welcome back",
      signUpTitle: "Create your account",
      signInButton: "Sign In",
      signUpButton: "Create Account",
      signOutButton: "Sign Out",
      forgotPasswordLink: "Forgot password?",
      myAccountTitle: "My Account",
      ordersTitle: "My Orders",
      addressesTitle: "Addresses",
      wishlistTitle: "Wishlist",
      settingsTitle: "Settings",
      dashboardTitle: "Dashboard",
      needHelpTitle: "Need Help?",
      needHelpDescription: "Our support team is here to assist you 24/7",
      contactSupportButton: "Contact Support",
      signInSubtitle: "Sign in to access your orders, wishlist and personalized recommendations",
      signUpSubtitle: "Join us to enjoy exclusive benefits and faster checkout",
      orContinueWith: "or continue with",
      whyCreateAccount: "Why create an account?",
      benefitFasterCheckout: "Faster checkout with saved details",
      benefitTrackOrders: "Track your orders in real-time",
      benefitWishlist: "Save items to your wishlist",
      benefitDiscounts: "Exclusive member discounts & offers",
      termsAgreement: "By continuing, you agree to our",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      emailLabel: "Email Address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
      firstNameLabel: "First Name",
      lastNameLabel: "Last Name",
      createAccountButton: "Create Account",
      processingText: "Processing...",
      emailConfirmedMessage: "Your email has been confirmed successfully!",
      canNowSignIn: "You can now sign in to your account.",
      switchToSignIn: "Switch to Sign In →",
      accountExistsMessage: "You already have an account with this email. Please sign in with your email and password below.",
      forgotPasswordTitle: "Reset your password",
      forgotPasswordSubtitle: "Enter your email and we'll send you a link to reset your password.",
      sendResetLinkButton: "Send reset link",
      forgotPasswordSuccessMessage: "If an account exists for that email, you will receive a link to reset your password.",
      resetPasswordTitle: "Set new password",
      resetPasswordSubtitle: "Enter your new password below.",
      newPasswordLabel: "New password",
      newPasswordPlaceholder: "Enter new password",
      invalidResetLinkMessage: "Invalid or expired link. Please request a new password reset.",
      resetLinkExpiredError: "Reset link is invalid or has expired. Please request a new one.",
      verifyEmailTitle: "Check Your Email",
      verifyEmailSubtitle: "We've sent a confirmation link to your email address",
      verifyEmailSentTo: "We sent a confirmation email to:",
      verifyEmailInstructions: "Please click the confirmation link in the email to activate your account.",
      verifyEmailNotReceived: "If you don't see the email, check your spam folder or click the button below to resend it.",
      verifyEmailNotReceivedTitle: "Email not received?",
      verifyEmailNotReceivedIntro: "The confirmation email is sent automatically after registration. If you don't see it:",
      verifyEmailCheckSpam: "Check your spam/junk folder",
      verifyEmailWaitMinutes: "Wait a few minutes (emails may be delayed)",
      verifyEmailSignInToResend: "Sign in below to resend the email",
      resendConfirmationButton: "Resend Confirmation Email",
      resendSendingText: "Sending...",
      resendSuccessMessage: "Confirmation email sent! Please check your inbox.",
      backToSignIn: "Back to Sign In",
      signInToResendEmail: "Sign In to Resend Email",
      signInFirstToResend: "You need to sign in first to resend the confirmation email.",
      verifyEmailExpiryHelp: "The confirmation link will expire in 24 hours. If you need help, please contact support.",
      verifyEmailRequiredError: "Email address is required",
      confirmAccountTitle: "Confirm Your Email",
      confirmAccountSubtitle: "Click the link in your email or enter your confirmation details below",
      confirmAccountLinkExpiredError: "This confirmation link is invalid or has expired.",
      confirmAccountRequestNewLink: "Request a new confirmation email",
      confirmAccountUnexpectedError: "An unexpected error occurred. Please try again or request a new confirmation email.",
      confirmAccountAlreadyConfirmed: "This account has already been confirmed. Redirecting to sign in...",
      confirmAccountEmailLabel: "Email Address",
      confirmAccountEmailPlaceholder: "you@example.com",
      confirmAccountTokenLabel: "Confirmation Token",
      confirmAccountTokenPlaceholder: "Enter token from email",
      confirmAccountTokenHint: "The token was sent to your email address",
      confirmAccountButton: "Confirm Account",
      confirmAccountBackToSignIn: "Back to Sign In",
      confirmAccountConfirmingText: "Confirming...",
      confirmAccountSuccessMessage: "Account confirmed and logged in! Redirecting...",
      confirmAccountCheckingMessage: "Confirming your email...",
      confirmAccountAutoLoginHint: "You'll be logged in automatically when verification succeeds. If nothing happens, press the Confirm Account button below.",
      // Error messages
      loginInvalidCredentialsError: "Please, enter valid credentials",
      loginEmailPasswordRequiredError: "Email and password are required",
      loginGenericError: "An error occurred during login. Please try again.",
      registerEmailPasswordRequiredError: "Email and password are required",
      registerFailedError: "Registration failed",
      registerAccountExistsError: "An account with this email already exists. Please sign in instead.",
      registerGenericError: "An error occurred during registration. Please try again.",
      passwordMismatchError: "Passwords do not match. Please try again.",
      passwordTooShortError: "Password must be at least 8 characters.",
      // Rate limiting messages
      passwordResetRateLimitError: "You've already requested a password reset recently. Please wait 15 minutes before requesting another one.",
      passwordResetRateLimitInfo: "If you don't receive an email, please check your spam folder. You can request another reset link in 15 minutes.",
    },
    general: {
      searchPlaceholder: "Search products...",
      newsletterTitle: "Subscribe to our newsletter",
      newsletterDescription: "Get the latest updates on new products and sales.",
      newsletterButton: "Subscribe",
      newsletterSuccess: "Thanks for subscribing!",
      newsletterPlaceholder: "Enter your email",
      newsletterNoSpam: "No spam, ever",
      newsletterWeeklyUpdates: "Weekly updates",
      newsletterExclusiveOffers: "Exclusive offers",
      newsletterAlreadySubscribed: "You're subscribed to our newsletter!",
      loadMoreButton: "Load More",
      viewAllButton: "View All",
      backButton: "Back",
      closeButton: "Close",
      saveButton: "Save",
      cancelButton: "Cancel",
      confirmButton: "Confirm",
      deleteButton: "Delete",
      editButton: "Edit",
      homeLabel: "Home",
      allProductsLabel: "Products",
    } as StorefrontConfig["content"]["general"],
    homepage: {
      newArrivalsTitle: "New Arrivals",
      newArrivalsSubtitle: "Just dropped - the latest additions to our collection",
      bestSellersTitle: "Best Sellers",
      bestSellersSubtitle: "Our most popular products loved by customers",
      onSaleTitle: "On Sale",
      onSaleSubtitle: "Don't miss these amazing deals",
      featuredTitle: "Featured Products",
      featuredSubtitle: "Hand-picked for you",
      categoriesTitle: "Shop by Category",
      categoriesSubtitle: "Find what you're looking for",
      viewAllCategoriesButton: "View All Categories",
      subcategoriesLabel: "Subcategories",
      viewCategoryButton: "View All",
      productsLabel: "products",
      brandsTitle: "Top Brands",
      brandsSubtitle: "Shop your favorite brands",
      testimonialsTitle: "What Our Customers Say",
      testimonialsSubtitle: "Real reviews from real customers",
      averageRatingLabel: "Average Rating",
      happyCustomersLabel: "Happy Customers",
      satisfactionRateLabel: "Satisfaction Rate",
      ordersDeliveredLabel: "Orders Delivered",
      verifiedPurchaseLabel: "Verified Purchase",
      loadingReviewsText: "Loading reviews...",
      noReviewsAvailableText: "No reviews available yet. Be the first to review our products!",
      noReviewsSubtext: "Reviews will appear here once customers start leaving feedback.",
      noApprovedReviewsText: "No approved reviews with 4+ stars yet. {count} review(s) pending approval.",
      heroCtaText: "Shop Now",
      heroSecondaryCtaText: "Browse Categories",
      exploreBrandsButton: "Explore brands",
      brandsStatLabel: "Brands",
      stylesStatLabel: "Styles",
      ratingStatLabel: "Rating",
      heroDefaultTitle: "Multi-brand performance",
      heroDefaultSubtitle: "Performance footwear and sportswear curated from the world's most trusted labels.",
      watchVideoButton: "Watch Video",
      shopNowButton: "Shop Collection",
      exploreText: "Explore",
      productCountText: "Products",
      newsletterEmailPlaceholder: "Enter your email",
      curatedLabel: "Curated",
      viewDetailsButton: "View details",
      viewAllBrandsButton: "View all brands",
      viewAllOffersButton: "View all offers",
      allCollectionsButton: "All Collections",
      viewAllButton: "View All",
      itemsText: "items",
      stylesText: "styles",
      performanceLineupText: "Performance lineup",
      brandLabel: "Brand",
      performanceFallback: "Performance",
      saleBadgeLabel: "Sale",
      saleBadgeOffText: "OFF",
      newBadgeLabel: "New",
      featuredBadgeLabel: "Featured",
      outOfStockBadgeLabel: "Out of stock",
      lowStockBadgeLabel: "Low stock",
      itemsOnSaleText: "{count} items on sale",
      savePercentText: "Save {discount}%",
      upToPercentOffText: "Up to {discount}% Off",
      reviewedProductLabel: "Reviewed Product",
      verifiedBuyerLabel: "Verified Buyer",
      anonymousLabel: "Anonymous",
      shopCollectionButton: "Shop collection",
      featuredCollectionLabel: "Featured Collection",
      specialOfferText: "Special Offer",
      dontMissOutTitle: "Don't miss out",
      shopSaleItemsButton: "Shop Sale Items",
      allProductsButton: "All Products",
      promoDescriptionFallback: "Premium performance gear for run, court, and studio. Limited time collection.",
      recentlyViewedSubLabel: "Your History",
      recentlyViewedTitle: "Recently Viewed",
      recentlyViewedSubtitle: "Products you've looked at recently",
    },
    checkout: {
      // Page & Header
      checkoutTitle: "Checkout",
      secureCheckout: "Secure Checkout",

      // Breadcrumb steps
      shippingStep: "Shipping",
      paymentStep: "Payment",
      confirmationStep: "Confirmation",

      // Contact Information Section
      contactInfoTitle: "Contact Information",
      contactInfoSubtitle: "We'll use this to send order updates",
      accountLabel: "Account",
      signOutButton: "Sign out",
      guestEmailLabel: "Email",
      guestEmailPlaceholder: "Enter your email",
      createAccountCheckbox: "Create account for faster checkout",
      passwordLabel: "Password",

      // Shipping Address Section
      shippingAddressTitle: "Shipping Address",
      shippingAddressSubtitle: "Where should we deliver?",
      addAddressButton: "Add address",
      editAddressButton: "Edit",
      changeAddressButton: "Change",

      // Address Form Fields
      firstNameLabel: "First name",
      lastNameLabel: "Last name",
      companyLabel: "Company",
      addressLine1Label: "Street address",
      addressLine2Label: "Street address (continue)",
      cityLabel: "City",
      countryLabel: "Country",
      countryPlaceholder: "Search country...",
      noCountryFound: "No country found",
      stateLabel: "State",
      postalCodeLabel: "Postal code",
      phoneLabel: "Phone number",
      saveAddressButton: "Save address",
      cancelButton: "Cancel",

      // Localized Address Fields (country-specific variants)
      provinceLabel: "Province",
      districtLabel: "District",
      zipCodeLabel: "Zip code",
      postTownLabel: "Post town",
      prefectureLabel: "Prefecture",
      cityAreaLabel: "City area",
      countryAreaLabel: "Country area",

      // Billing Address Section
      billingAddressTitle: "Billing Address",
      billingAddressSubtitle: "For your invoice",
      useSameAsShipping: "Use shipping address as billing address",

      // Delivery Methods Section
      deliveryMethodsTitle: "Delivery methods",
      deliveryMethodsSubtitle: "Choose shipping speed",
      noShippingMethodsAvailable: "No shipping methods available for this address. Please try a different shipping address.",
      businessDaysText: "{min}-{max} business days",
      freeShippingLabel: "Free",
      noDeliveryMethodsText: "No delivery methods available",
      fetchingShippingRates: "Calculating shipping rates...",
      updatingShippingRates: "Updating shipping rates for new address...",
      calculateShippingButton: "Calculate Shipping Rates",
      calculatingShippingText: "Calculating shipping rates...",
      recalculateRatesButton: "Recalculate",
      addressChangedNotice: "Shipping address changed since last calculation",
      shippingFetchErrorText: "Could not fetch shipping rates",
      shippingFetchErrorHint: "Please verify your shipping address is correct and try again.",
      noShippingMethodsHint: "Please check that your address details are correct, or try a different address.",
      tryAgainButton: "Try Again",
      shippingAddressDetected: "Shipping address detected",
      calculateShippingHint: "Click below to see available shipping options and pricing for your address.",
      freeShippingVoucherNotApplicable:
        "Free shipping voucher is not applicable with this delivery method. Choose a free shipping method to use your voucher.",
      freeShippingAppliedWithMethod: "Free shipping applied with this method.",

      // Payment Section
      paymentTitle: "Payment",
      paymentSubtitle: "Select your payment method",
      paymentMethodLabel: "Payment method",
      payNowButton: "Pay now",
      initializingPaymentText: "Initializing payment system...",
      paymentSystemUnavailableError: "Payment system is not available. Please try again later.",
      checkoutInfoMissingError: "Checkout information is missing. Please refresh the page.",
      paymentFormNotReadyError: "Payment form is not ready. Please refresh the page and try again.",
      paymentValidationFailedError: "Payment validation failed",
      transactionCreationFailedError: "Transaction could not be created. Please try again.",
      invalidPaymentDataError: "Invalid payment data received. Please try again.",
      paymentInitIncompleteError: "Payment initialization incomplete. Please try again.",
      paymentConfirmationFailedError: "Payment confirmation failed. Please try again.",
      paymentTimeoutError: "Payment timed out. Please try again.",
      paymentFailedError: "Payment failed",
      unexpectedPaymentError: "An unexpected error occurred with your payment",
      paymentSuccessOrderFailedError: "Payment was successful but order processing failed. Please contact support.",

      // Order Summary Section
      orderSummaryTitle: "Order Summary",
      itemsCountSingular: "1 item",
      itemsCountPlural: "{count} items",
      productsLabel: "Products",
      quantityLabel: "Quantity",
      addPromoCodeText: "Add promo code or gift card",
      promoCodeLabel: "Promo code",
      promoCodePlaceholder: "Enter code",
      applyPromoButton: "Apply",
      removePromoButton: "Remove",
      oneVoucherPerOrderHint: "One voucher per order. Gift cards can be combined.",
      replaceVoucherConfirm: "Only one voucher can be used per order. Applying this code will replace {code}. Continue?",
      eligibleForFreeShipping: "Eligible for free shipping",
      giftCardLabel: "Gift card",
      subtotalLabel: "Subtotal",
      shippingLabel: "Shipping",
      taxLabel: "Tax",
      includesTaxText: "Includes {amount} tax",
      totalLabel: "Total",

      // Legacy section titles (for backwards compatibility)
      contactDetails: "Contact Details",
      shippingAddress: "Shipping Address",
      shippingMethod: "Shipping Method",
      paymentMethod: "Payment Method",
      orderSummary: "Order Summary",
      placeOrder: "Place Order",

      // Place Order Section
      placeOrderButton: "Place Order",
      processingOrderText: "Processing your order...",
      agreementText: "By placing this order, you agree to our",

      // Order confirmation
      almostDoneText: "Almost done…",
      orderConfirmation: "Order Confirmation",
      thankYouTitle: "Thank you for your order!",
      thankYouMessage: "We've received your order and will send you a confirmation email shortly.",
      orderNumberLabel: "Order number",
      continueShoppingButton: "Continue Shopping",
      viewOrderButton: "View Order",
      orderReceiptTitle: "Order Receipt",
      orderNumberPrefix: "Order #",
      orderConfirmedTitle: "Order Confirmed",
      orderConfirmedMessage: "Thank you for your order! We've received it and will notify you when your package ships.",
      confirmationSentTo: "Confirmation sent to:",
      customerLabel: "Customer:",
      orderDateLabel: "Order Date:",
      whatsNextTitle: "What's Next?",
      orderProcessingStep: "Order Processing",
      orderProcessingMessage: "We're preparing your order for shipment.",
      shippingNotificationStep: "Shipping Notification",
      shippingNotificationMessage: "You'll receive tracking info when shipped.",
      deliveryStep: "Delivery",
      deliveryMessage: "Your order will arrive at your doorstep!",
      printReceiptButton: "Print Receipt",
      thankYouPurchaseMessage: "Thank you for your purchase! If you have any questions, please contact our support team.",

      // Order Info Section (confirmation page)
      orderDetailsTitle: "Order Details",
      contactLabel: "Contact",
      authorizedStatus: "Authorized",
      authorizedMessage: "We've received your payment authorization",
      paidStatus: "Paid",
      paidMessage: "We've received your payment",
      overpaidStatus: "Overpaid",
      overpaidMessage: "Contact support for refund assistance",
      processingStatus: "Processing",
      processingMessage: "Payment is being processed",

      // Error messages
      requiredFieldError: "This field is required",
      invalidEmailError: "Please enter a valid email",
      invalidPhoneError: "Please enter a valid phone number",
      selectDeliveryMethodError: "Please select a delivery method",
      selectPaymentMethodError: "Please select a payment method",

      // Address Form Actions
      deleteAddressButton: "Delete address",
      savingAddressText: "Saving…",
      savedText: "Saved",
      createAddressTitle: "Create address",
      editAddressTitle: "Edit address",
      addressSavedSuccess: "Address saved successfully!",
      addressUpdatedSuccess: "Address updated successfully!",
      cantShipToAddressText: "Can't ship to this address",

      // Sign In/Out
      signInTitle: "Sign in",
      signInButton: "Sign in",
      newCustomerText: "New customer?",
      guestCheckoutButton: "Guest checkout",
      forgotPasswordLink: "Forgot password?",
      resendLink: "Resend?",
      processingText: "Processing…",
      orText: "or",
      continueWithGoogle: "Continue with Google",
      signInWithGoogle: "Sign in with Google",
      alreadyHaveAccount: "Already have an account?",

      // Guest User
      contactDetailsTitle: "Contact details",
      createAccountLabel: "I want to create account",
      passwordMinChars: "Password (minimum 8 characters)",

      // Reset Password
      resetPasswordTitle: "Reset password",
      rememberedPasswordText: "Remembered your password?",
      provideNewPasswordText: "Provide a new password for your account",

      // Address List
      noSavedAddressesText: "You currently have no saved addresses.",

      // Voucher/Gift Card
      voucherLabel: "Voucher:",
      giftCardMaskedLabel: "Gift Card: ••••",

      // Empty Cart
      emptyCartTitle: "Your cart is empty",
      emptyCartMessage: "Looks like you haven't added anything to your cart yet. Explore our products and find something you'll love!",
      browseProductsButton: "Browse Products",
      goToHomepageButton: "Go to Homepage",
      needHelpText: "Need help?",
      freeShippingBadge: "Free shipping on orders over $50",
      easyReturnsBadge: "Easy 30-day returns",
      securePaymentBadge: "Secure payment processing",

      // Order Not Found
      orderNotFoundTitle: "Order not found",
      orderNotFoundMessage: "We couldn't find the order you're looking for. Please check your order number and try again.",

      // No checkout found / Error pages
      noCheckoutFoundTitle: "No checkout found",
      noCheckoutFoundMessage: "It looks like you haven't started a checkout yet. Add some items to your cart first.",
      returnToCartButton: "Return to Cart",
      checkoutExpiredTitle: "Checkout expired or invalid",
      checkoutExpiredMessage: "This checkout session has expired or is no longer valid. Please return to your cart and try again.",
      somethingWentWrongTitle: "Something went wrong",
      somethingWentWrongMessage: "We couldn't load your checkout. Please return to your cart and try again.",

      // SSL/Security
      sslEncryptionText: "Secure 256-bit SSL encryption",

      // Footer links
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      securityNote: "Protected by SSL encryption • Your payment info is safe",
    },
    filters: {
      // Section titles
      sectionTitle: "Filters",
      clearAllButton: "Clear All Filters",
      showResultsButton: "Show Results",
      filtersButtonText: "Filters",

      // Filter headings
      categoryTitle: "Category",
      collectionTitle: "Collection",
      brandTitle: "Brand",
      sizeTitle: "Size",
      colorTitle: "Color",
      priceTitle: "Price",
      ratingTitle: "Rating",
      availabilityTitle: "Availability",

      // Sort dropdown
      sortByLabel: "Sort by:",
      searchForText: "for",

      // Availability options
      inStockOnly: "In Stock Only",
      onSale: "On Sale",

      // Active filters summary
      activeFiltersLabel: "Active Filters:",
      categorySingular: "category",
      categoryPlural: "categories",
      collectionSingular: "collection",
      collectionPlural: "collections",
      brandSingular: "brand",
      brandPlural: "brands",
      colorSingular: "color",
      colorPlural: "colors",
      sizeSingular: "size",
      sizePlural: "sizes",

      // Sort options
      sortAtoZ: "A to Z",
      sortZtoA: "Z to A",
      sortPriceLowHigh: "Price: Low to High",
      sortPriceHighLow: "Price: High to Low",
      sortNewest: "Newest",
      sortSale: "Sale",

      // Empty/loading states
      noProductsTitle: "No products found",
      noProductsWithFilters: "Try adjusting your filters",
      noProductsEmpty: "Check back later for new products",
      filteringProducts: "Filtering products...",
      loadingMore: "Loading more products...",
      seenAllProducts: "You've seen all {count} products",
      tryAdjustingFilters: "Try adjusting your filters to see more",

      // Search (products page search bar + nav search)
      searchPlaceholder: "Search Products",
      searchClearAriaLabel: "Clear search",
      searchInputAriaLabel: "Search products",
      searchProductsTitle: "Search Products",
      searchResultsTitle: "Search Results",
      resultsCountText: "Found {count} result(s)",
      noResultsMessage: "No results found for \"{query}\"",

      // Results text
      resultsText: "results",
      itemsAvailable: "items available",
      productsPageTitle: "All Products",
      discoverProducts: "Discover Products",

      // Quick filters
      shopAllButton: "Shop All",
      quickAddButton: "Quick Add",
      scrollLeftAriaLabel: "Scroll left",
      scrollRightAriaLabel: "Scroll right",
      checkOutOurProducts: "Check Out Our Products",

      // Rating filter
      minimumRating: "Minimum Rating",
      starsAndUp: "{count} stars & up",
      starAndUp: "1 star & up",
      clearRatingFilter: "Clear",

      // Price filter
      minPriceLabel: "Min Price",
      maxPriceLabel: "Max Price",
      quickMinLabel: "Quick Min",
      quickMaxLabel: "Quick Max",
      clearPriceFilter: "Clear",
      applyPriceFilter: "Apply",
      priceUnderLabel: "Under",
      priceAboveLabel: "+",
    },
    productDetail: {
      freeShipping: "Free Shipping",
      securePayment: "Secure Payment",
      easyReturns: "Easy Returns",
      descriptionTab: "Description",
      shippingTab: "Shipping",
      reviewsTab: "Reviews",
      noDescriptionAvailable: "No description available for this product.",
      qtyLabel: "Qty",
      qtyLabelWithColon: "Qty:",
      shareButton: "Share",
      colorLabel: "Color",
      sizeLabel: "Size",
      selectOptionLabel: "Select Option",
      pleaseSelectSize: "Please select a size",
      pleaseSelectOption: "Please select an option",
      onlyXLeft: "Only {count} left!",
      inStockWithCount: "In Stock ({count} available)",
      sellingFast: "Selling fast!",
      savePercent: "Save {percent}%",
      reviewSingular: "review",
      reviewPlural: "reviews",
      zoomInLabel: "Zoom in",
      zoomOutLabel: "Zoom out",
      previousImageLabel: "Previous image",
      nextImageLabel: "Next image",
      noReviewsYet: "No reviews yet. Be the first to review this product!",
      writeReviewTitle: "Write a Review",
      ratingRequired: "Rating *",
      reviewTitleRequired: "Review Title *",
      reviewTitlePlaceholder: "Summarize your review",
      reviewRequired: "Review *",
      reviewPlaceholder: "Share your experience with this product...",
      characterCount: "{count} / 2000 characters",
      imagesOptional: "Images (Optional)",
      noFileChosen: "No file chosen",
      uploadImagesHint: "Upload up to 5 images (max 5MB each)",
      submitReviewButton: "Submit Review",
      helpfulCount: "{count} people found this helpful",
      helpfulButton: "Helpful",
      helpfulButtonWithCount: "Helpful ({count})",
      verifiedPurchase: "Verified Purchase",
      editReview: "Edit",
      deleteReview: "Delete",
      allRatings: "All Ratings",
      verifiedOnly: "Verified Only",
      deleteReviewTitle: "Delete Review",
      deleteReviewMessage: "Are you sure you want to delete this review? This action cannot be undone.",
      cancelButton: "Cancel",
      deletingButton: "Deleting...",
      justNow: "just now",
      minutesAgo: "{count} minutes ago",
      hoursAgo: "{count} hours ago",
      daysAgo: "{count} days ago",
      freeStandardShippingTitle: "Free Standard Shipping",
      freeStandardShippingDescription: "On orders over $75. Delivery in 5-7 business days.",
      expressShippingTitle: "Express Shipping",
      expressShippingDescription: "{price}. Delivery in 2-3 business days.",
      deliveryEstimateLabel: "Ships in {days} business days",
      estimatedDeliveryPrefix: "Estimated delivery",
      businessDaysLabel: "business days",
      trackOrderLabel: "Track your order",
      shippingEstimatedDelivery: "Estimated delivery: {days} business days",
      shippingFreeLabel: "Free Shipping",
      shippingProcessingTime: "Processing time: 1-3 business days",
      shippingTrackingNotice: "You'll receive tracking information via email once your order ships",
      shippingWarehouseNotice: "This item ships from our international fulfillment center",
      shippingReturnPolicyNote: "Returns accepted within 30 days of delivery",
      shippingCarrierLabel: "Carrier: {carrier}",
      shippingExtendedReturnNote: "Please note: return shipping for international items may take additional time",
      loadingReviews: "Loading reviews...",
      reviewCountText: "{count} review",
      noReviewsMatchFilters: "No reviews match your filters.",
      clearFilters: "Clear Filters",
      clearFiltersLowercase: "Clear filters",
      tryAgain: "Try again",
      failedToLoadReviews: "Failed to load reviews. Please try again.",
      loadMoreReviews: "Load More Reviews",
      starsLabel: "{count} Stars",
      ratingLabel: "Rating",
      titleLabel: "Title",
      reviewLabel: "Review",
      uploadingImages: "Uploading and compressing images...",
      savingButton: "Saving...",
      saveButton: "Save",
      submittingButton: "Submitting...",
      thankYouMessage: "Thank you for your review!",
      reviewSubmittedMessage: "Your review has been submitted and will be visible after moderation.",
      pleaseSelectRating: "Please select a rating",
      pleaseEnterReviewTitle: "Please enter a review title",
      pleaseEnterReviewBody: "Please enter a review body",
      maxImagesError: "Maximum 5 images allowed per review",
      onlyXMoreImagesError: "Only {count} more image(s) can be uploaded (max 5 total)",
      failedToSubmitReview: "Failed to submit review",
      failedToSubmitReviewRetry: "Failed to submit review. Please try again.",
      mustBeLoggedInToReview: "You must be logged in to submit a review. Please log in and try again.",
      failedToUpdateReview: "Failed to update review",
      failedToDeleteReview: "Failed to delete review",
      failedToUploadImages: "Failed to upload images",
      specificationsTab: "Specifications",
      noSpecifications: "No specifications available.",
      selectAttributeLabel: "Select {attribute}",
      pleaseSelectAttribute: "Please select {attribute}",
      unlimitedStock: "In Stock",
      selectOptionsForStock: "Select options to see availability",
      maxPerCustomer: "Limit {count} per customer",
      unavailableForSelection: "Unavailable for current selection",
      relatedProductsTitle: "You May Also Like",
      relatedProductsSubtitle: "Customers also viewed these products",
      relatedViewDetailsButton: "View details",
      relatedPreviousLabel: "Previous products",
      relatedNextLabel: "Next products",
      // Stock Alert / Notify Me
      notifyMeButton: "Notify me when back in stock",
      notifyMeTitle: "Notify me when back in stock",
      notifyMeDescription: "Get notified when {variant} is available",
      notifyMeDescriptionGeneric: "Get notified when this item is available",
      notifyMeEmailPlaceholder: "Enter your email",
      notifyMeSubmitButton: "Notify Me",
      notifyMeSubmitting: "Subscribing...",
      notifyMeSuccess: "You'll be notified when this item is back in stock",
      notifyMeAlreadySubscribed: "You're already subscribed for this item",
      notifyMeUnsubscribe: "Unsubscribe",
      notifyMeInvalidEmail: "Please enter a valid email address",
      notifyMeError: "Failed to subscribe. Please try again.",
      notifyMeCancel: "Cancel",
    } as StorefrontConfig["content"]["productDetail"],
    dashboard: {
      totalOrders: "Total Orders",
      wishlistItems: "Wishlist Items",
      savedAddresses: "Saved Addresses",
      memberSince: "Member Since",
      welcomeBack: "Welcome back, {name}",
      welcomeBackMessage: "Here's what's happening with your account today.",
      accountSummary: "Here's what's happening with your account today",
      recentOrders: "Recent Orders",
      viewAllButton: "View All →",
      viewButton: "View",
      orderLabel: "Order",
      orderNumberPrefix: "Order #",
      noOrdersYet: "No orders yet",
      whenYouPlaceOrder: "When you place an order, it will appear here.",
      noRecentOrders: "No recent orders",
      startShopping: "Start Shopping",
    } as StorefrontConfig["content"]["dashboard"],
    navbar: {
      selectChannel: "Select channel/currency",
      searchPlaceholder: "Search...",
      searchClearAriaLabel: "Clear search",
      searchInputAriaLabel: "Search products",
      bannerDismissAriaLabel: "Dismiss banner",
      bannerPrevAriaLabel: "Previous banner",
      bannerNextAriaLabel: "Next banner",
      viewAllResultsFor: "View all results for",
      recentlySearchedLabel: "Recent Searches",
      recentSearchesClearLabel: "Clear",
      cartLabel: "Cart",
      accountLabel: "Account",
      menuLabel: "Menu",
      signInText: "Sign In",
      shopAllButton: "Shop All",
      saleButton: "Sale",
      collectionsLabel: "Collections",
      brandsLabel: "Brands",
      categoriesLabel: "Categories",
      viewAllProducts: "View All Products",
      exploreCategoryLabel: "Explore",
      browseSubcategoriesLabel: "Browse subcategories",
      megaMenuProductLabel: "product",
      megaMenuProductsLabel: "products",
      megaMenuHoverPrompt: "Hover a category to explore",
      subcategoriesSide: "auto",
      mobileNavPosition: "right",
      mobileMenuStyle: "visual",
      dropdownArrowDirection: "auto",
      dropdownArrowDirectionExpanded: "down",
      homeLabel: "Home",
      shopLabel: "Shop",
    },
    footer: {
      privacyPolicyLink: "Privacy Policy",
      termsOfServiceLink: "Terms of Service",
      shippingLink: "Shipping",
      returnPolicyLink: "Return Policy",
      allRightsReserved: "All rights reserved",
      madeWith: "Made with",
      inLocation: "in {location}",
      contactUs: "Contact Us",
      contactUsButton: "Contact Us",
      customerService: "Customer Service",
      shopTitle: "Shop",
      companyTitle: "Company",
      supportTitle: "Support",
      followUsTitle: "Follow Us",
      trackOrderLink: "Track Order",
    },
    orders: {
      myOrdersTitle: "My Orders",
      orderHistory: "Order History",
      orderNumber: "Order Number",
      orderDate: "Order Date",
      orderStatus: "Order Status",
      orderTotal: "Order Total",
      viewOrder: "View Order",
      reorder: "Reorder",
      noOrders: "You haven't placed any orders yet.",
      noOrdersDescription: "When you place an order, it will appear here.",
      startShopping: "Start Shopping",
    } as unknown as StorefrontConfig["content"]["orders"],
    addresses: {
      myAddresses: "My Addresses",
      addAddressButton: "Add Address",
      addNewAddressTitle: "Add New Address",
      editButton: "Edit",
      deleteButton: "Delete",
      defaultBilling: "Default Billing Address",
      defaultShipping: "Default Shipping Address",
      setAsDefault: "Set as Default",
      noAddresses: "You haven't added any addresses yet.",
      noAddressesMessage: "Add an address to make checkout faster.",
      addressesCount: "{count} address(es) saved",
      noAddressesYet: "No addresses saved yet",
      shippingAndBilling: "Shipping & Billing",
      shippingAddress: "Shipping Address",
      billingAddress: "Billing Address",
      savedAddress: "Saved Address",
      noAddressesCheckoutMessage: "Your addresses will be saved when you complete checkout.",
      addAddressDescription: "Add addresses at checkout.",
      continueShoppingButton: "Continue Shopping",
      startShopping: "Start Shopping",
      cancel: "Cancel",
    } as unknown as StorefrontConfig["content"]["addresses"],
    orderTracking: {
      title: "Track Your Order",
      description: "Enter your order number and email address to view your order status and tracking information.",
      orderNumberLabel: "Order Number",
      orderNumberPlaceholder: "e.g., 12345",
      orderNumberHelp: "You can find your order number in your confirmation email.",
      emailLabel: "Email Address",
      emailPlaceholder: "your@email.com",
      emailHelp: "The email address you used when placing the order.",
      trackButton: "Track Order",
      trackingButton: "Tracking...",
      errorNotFound: "Order not found. Please check your order number and email address.",
      errorGeneric: "An error occurred while tracking your order. Please try again.",
      backToTracking: "Track Another Order",
      orderFoundTitle: "Order Details",
      createAccountTitle: "Create an Account",
      createAccountDescription: "Sign up to track all your orders, save your addresses, and enjoy faster checkout.",
      createAccountButton: "Create Account",
      needHelpText: "Need help?",
      contactSupportLink: "Contact Support",
    },
    contact: {
      heroTitle: "Get in Touch",
      heroDescription: "Have a question or need help? We're here for you. Reach out through any of the channels below or fill out the contact form.",
      emailLabel: "Email",
      phoneLabel: "Phone",
      addressLabel: "Address",
      formTitle: "Send Us a Message",
      formDescription: "We'll get back to you within 24 hours.",
      nameLabel: "Your Name",
      namePlaceholder: "John Doe",
      emailLabelForm: "Email Address",
      emailPlaceholder: "john@example.com",
      subjectLabel: "Subject",
      subjectPlaceholder: "How can we help?",
      messageLabel: "Message",
      messagePlaceholder: "Tell us more about your inquiry...",
      sendButton: "Send Message",
      sendingButton: "Sending...",
      successTitle: "Message Sent!",
      successDescription: "Thank you for reaching out. We'll be in touch soon.",
      sendAnotherMessage: "Send another message",
      faqsTitle: "Frequently Asked Questions",
      faqsDescription: "Find quick answers to common questions.",
      faqs: [
        {
          question: "What are your shipping times?",
          answer: "Most orders ship within 24 hours. Standard delivery takes 3-5 business days, and express delivery takes 1-2 business days.",
        },
        {
          question: "Do you offer international shipping?",
          answer: "Yes! We ship worldwide. International delivery typically takes 7-14 business days depending on the destination.",
        },
        {
          question: "What is your return policy?",
          answer: "We offer a 30-day return policy on all unused items in original packaging. Returns are free within the continental US.",
        },
      ],
      viewAllFaqs: "View All FAQs",
      followUsTitle: "Follow Us",
      followUsDescription: "Stay connected for updates, tips, and exclusive offers.",
    },
    wishlist: {
      myWishlistTitle: "My Wishlist",
      itemsCount: "{count} item(s) saved",
      loadingWishlist: "Loading wishlist...",
      emptyWishlistTitle: "Your wishlist is empty",
      emptyWishlistMessage: "Save items you love by clicking the heart icon on any product.",
      discoverProductsButton: "Discover Products",
      clearAllButton: "Clear All",
      itemsSaved: "{count} item(s) saved",
      viewProduct: "View Product",
      viewDetails: "View Details",
      outOfStock: "Out of Stock",
      addedOn: "Added {date}",
      removeFromWishlist: "Remove",
      moveToCart: "Add to Cart",
      removeFromWishlistTooltip: "Remove from wishlist",
    } as StorefrontConfig["content"]["wishlist"],
    settings: {
      accountSettings: "Account Settings",
      settingsSubtitle: "Manage your profile, security, and notification preferences",
      profileInformation: "Profile Information",
      updatePersonalDetails: "Update your personal details",
      saveChangesButton: "Save Changes",
      savingChanges: "Saving...",
      changesSaved: "Changes saved successfully",
      profileUpdated: "Profile updated successfully",
      profileUpdateFailed: "Failed to update profile. Please try again.",
      emailChangePasswordRequired: "Password is required to change your email...",
      emailChangeConfirmationSent: "A confirmation link has been sent to your new email...",
      emailChangePasswordInvalid: "Password is not valid. Please enter your current account password.",
      profileInvalidEmailError: "Please enter a valid email address. Check the domain and extension.",
      changePassword: "Change Password",
      passwordSecurityNote: "Update your password to keep your account secure",
      currentPassword: "Current Password",
      newPasswordLabel: "New Password",
      confirmNewPassword: "Confirm New Password",
      updatePasswordButton: "Update Password",
      passwordUpdated: "Password updated successfully",
      passwordUpdateFailed: "Failed to update password. Please try again.",
      notificationPreferences: "Notification Preferences",
      notificationSubtitle: "Choose how you want to receive updates",
      orderUpdates: "Order Updates",
      orderUpdatesDesc: "Receive notifications about your order status",
      promotionsOffers: "Promotions & Offers",
      promotionsDesc: "Get notified about sales and exclusive deals",
      newsletterSetting: "Newsletter",
      newsletterDesc: "Weekly updates about new arrivals and trends",
      smsNotifications: "SMS Notifications",
      smsDesc: "Receive text messages for important updates",
      dangerZone: "Danger Zone",
      deleteAccountWarning: "Permanently delete your account and all associated data",
      deleteAccountButton: "Delete Account",
      confirmDeleteTitle: "Delete Account?",
      confirmDeleteMessage: "This action cannot be undone. All your data will be permanently removed.",
    } as StorefrontConfig["content"]["settings"],
    error: {
      title: "Something went wrong",
      description: "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
      errorDetails: "Error details",
      tryAgainButton: "Try Again",
      backToHomeButton: "Back to Home",
      needHelpText: "Need help?",
      contactSupportLink: "Contact our support team",
      contactSupportUrl: "/contact",
      errorCode: "Error",
    } as StorefrontConfig["content"]["error"],
    notFound: {
      title: "Page Not Found",
      description: "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.",
      backToHomeButton: "Back to Home",
      browseProductsButton: "Browse Products",
      helpfulLinksText: "Or check out these pages:",
      categoriesLinkText: "Categories",
      collectionsLinkText: "Collections",
      aboutUsLinkText: "About Us",
      contactLinkText: "Contact",
      productNotFoundTitle: "Product Not Found",
      productNotFoundDescription: "The product you're looking for doesn't exist or has been removed.",
      productNotFoundBackButton: "Back to Products",
    } as StorefrontConfig["content"]["notFound"],
    cookieConsent: {
      bannerTitle: "Cookie Preferences",
      bannerDescription: "We use cookies to enhance your experience. Essential cookies are always active. You can choose to enable analytics and marketing cookies.",
      acceptAllButton: "Accept All",
      rejectAllButton: "Essential Only",
      manageButton: "Manage Preferences",
      essentialLabel: "Essential",
      essentialDescription: "Required for basic site functionality (login, cart, checkout).",
      analyticsLabel: "Analytics",
      analyticsDescription: "Help us understand how visitors interact with our site.",
      marketingLabel: "Marketing",
      marketingDescription: "Used for targeted advertising and remarketing.",
      savePreferencesButton: "Save Preferences",
      policyLinkText: "Cookie Policy",
    },
  },

  darkMode: {
    enabled: false,
    auto: true, // Follow system preference when enabled
    colors: {
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      border: "#334155",
      // Optional overrides (undefined = use light mode colors)
      primary: undefined,
      secondary: undefined,
      accent: undefined,
      success: undefined,
      warning: undefined,
      error: undefined,
    },
  },

  storefront: {
    cart: {
      displayMode: "drawer" as const,
      drawerSide: "right" as const,
      showDeleteText: false,
      showSaveForLater: false,
    },
  },

  relatedProducts: {
    enabled: true,
    strategy: "category" as const,
    maxItems: 8,
    showOnMobile: true,
    title: "You May Also Like",
    subtitle: "Customers also viewed these products",
  },

  design: {
    animations: {
      preset: "moderate" as const,
    },
    spacing: {
      sectionPaddingY: "normal" as const,
    },
  },
});

/**
 * Get default config for a channel
 * First tries to load from sample config files (Hebrew/English)
 * Falls back to hardcoded defaults if sample files are not available
 */
export const getDefaultConfig = (channelSlug: string): StorefrontConfig => {
  // Try to load from sample config file first
  const sampleConfig = getSampleConfigForChannel(channelSlug);

  if (sampleConfig) {
    // Ensure channelSlug matches (in case sample config has different channel)
    const configWithChannel = {
      ...sampleConfig,
      channelSlug,
    };

    console.log(`[getDefaultConfig] ✅ Using sample config for channel "${channelSlug}"`);
    return configWithChannel;
  }

  // Fallback to hardcoded defaults
  console.log(`[getDefaultConfig] ⚠️ Sample config not found for "${channelSlug}", using fallback defaults`);
  return getFallbackDefaultConfig(channelSlug);
};
