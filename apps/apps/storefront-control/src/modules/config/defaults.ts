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
      testimonials: { enabled: true },
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
