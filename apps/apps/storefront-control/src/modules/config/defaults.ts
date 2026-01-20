import { StorefrontConfig } from "./schema";

export const CONFIG_VERSION = 1;

export const getDefaultConfig = (channelSlug: string): StorefrontConfig => ({
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
    showNewsletter: true,
    showSocialLinks: true,
    showContactInfo: true,
    copyrightText: null, // use default
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
