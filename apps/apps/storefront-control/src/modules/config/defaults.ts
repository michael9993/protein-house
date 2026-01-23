import { StorefrontConfig, StorefrontConfigSchema } from "./schema";

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
    // @ts-expect-error - Using eval to prevent webpack from bundling fs/path
    const fs = typeof require !== "undefined" ? eval('require("fs")') : null;
    // @ts-expect-error - Using eval to prevent webpack from bundling fs/path
    const path = typeof require !== "undefined" ? eval('require("path")') : null;
    return { fs, path };
  } catch {
    return { fs: null, path: null };
  }
}

export const CONFIG_VERSION = 1;

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
 * Uses Hebrew config for 'ils' channel, English for others
 */
function getSampleConfigForChannel(channelSlug: string): StorefrontConfig | null {
  // Determine which sample file to use
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
  // @ts-expect-error - process available at runtime in Node.js
  if (typeof process !== "undefined" && (process as any).cwd) {
    // @ts-expect-error
    possibleRoots.push((process as any).cwd());
  }
  
  // Try relative to this file (if __dirname is available)
  try {
    // @ts-expect-error - __dirname might not be available in ESM
    if (typeof __dirname !== "undefined") {
      // @ts-expect-error
      possibleRoots.push(path.resolve(__dirname, "../.."));
      // @ts-expect-error
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

  header: {
    banner: {
      enabled: true,
      text: "Free shipping on orders over $50 • Fast delivery worldwide",
      backgroundColor: null, // use primary
      textColor: null,       // white
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
  },

  homepage: {
    sections: {
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
      },
      featuredCategories: { enabled: true, limit: 6 },
      newArrivals: { enabled: true, limit: 8 },
      bestSellers: { enabled: true, limit: 8 },
      onSale: { enabled: true, limit: 4 },
      featuredBrands: { enabled: false },
      testimonials: { 
        enabled: true,
        starColor: "#FFD700", // Gold color for stars
        starEmptyColor: null, // Use textMuted with 30% opacity
        starSize: "base",
        loadingReviewsText: null, // "Loading reviews..."
        verifiedPurchaseLabel: null, // "Verified Purchase"
        customerLabel: null, // "Customer"
        card: {
          backgroundColor: null, // white
          borderColor: null, // neutral-200/50
          borderRadius: null, // use --store-radius
          padding: null, // p-6
          shadow: null, // use primary color with 15% opacity
          hoverShadow: null, // default hover shadow
          hoverTransform: null, // translateY(-4px)
        },
        trustBadges: {
          showAverageRating: true,
          showCustomerCount: true,
          showSatisfactionRate: true,
          showOrdersDelivered: true,
          borderColor: null, // neutral-200
          textColor: null, // use text colors from branding
        },
      },
      newsletter: { enabled: true },
      instagramFeed: { enabled: false, username: null },
    },
    sectionOrder: [
      "hero",
      "featuredCategories",
      "newArrivals",
      "bestSellers",
      "onSale",
      "featuredBrands",
      "testimonials",
      "newsletter",
      "instagramFeed",
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
  },

  content: {
    cart: {
      emptyCartTitle: "Your cart is empty",
      emptyCartMessage: "Looks like you haven't added anything to your cart yet.",
      cartTitle: "Shopping Cart",
      checkoutButton: "Checkout",
      continueShoppingButton: "Continue Shopping",
    },
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
    },
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
    },
    general: {
      searchPlaceholder: "Search products...",
      newsletterTitle: "Subscribe to our newsletter",
      newsletterDescription: "Get the latest updates on new products and sales.",
      newsletterButton: "Subscribe",
      newsletterSuccess: "Thanks for subscribing!",
      loadMoreButton: "Load More",
      viewAllButton: "View All",
      backButton: "Back",
      closeButton: "Close",
      saveButton: "Save",
      cancelButton: "Cancel",
      confirmButton: "Confirm",
      deleteButton: "Delete",
      editButton: "Edit",
    },
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
      watchVideoButton: "Watch Video",
      shopNowButton: "Shop Now",
      exploreText: "Explore",
      productCountText: "Products",
      newsletterEmailPlaceholder: "Enter your email",
    },
    checkout: {
      secureCheckout: "Secure Checkout",
      contactDetails: "Contact Details",
      shippingAddress: "Shipping Address",
      shippingMethod: "Shipping Method",
      paymentMethod: "Payment Method",
      orderSummary: "Order Summary",
      placeOrder: "Place Order",
      orderConfirmation: "Order Confirmation",
      thankYouTitle: "Thank you for your order!",
      thankYouMessage: "We've received your order and will send you a confirmation email shortly.",
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

      // Search
      searchPlaceholder: "Search Products",
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
    },
    navbar: {
      selectChannel: "Select channel/currency",
      searchPlaceholder: "Search...",
      cartLabel: "Cart",
      accountLabel: "Account",
      menuLabel: "Menu",
      signInText: "Sign In",
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
      myOrders: "My Orders",
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
    },
    addresses: {
      myAddresses: "My Addresses",
      addNewAddress: "Add New Address",
      editAddress: "Edit Address",
      deleteAddress: "Delete Address",
      defaultBilling: "Default Billing Address",
      defaultShipping: "Default Shipping Address",
      setAsDefault: "Set as Default",
      noAddresses: "You haven't added any addresses yet.",
      noAddressesDescription: "Add an address to make checkout faster.",
    },
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
