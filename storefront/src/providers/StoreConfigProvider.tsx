"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { StoreConfig, getThemeCSSVariables, storeConfig, DEFAULT_RTL_LOCALES } from "@/config";

// ============================================
// CONTEXT
// ============================================
const StoreConfigContext = createContext<StoreConfig | null>(null);

// ============================================
// HELPER: Detect RTL from locale
// ============================================
function isRtlLocale(locale: string | undefined, rtlLocales: string[] = DEFAULT_RTL_LOCALES): boolean {
  if (!locale || !rtlLocales || rtlLocales.length === 0) return false;
  const langCode = locale.split('-')[0].toLowerCase();
  return rtlLocales.some(rtl => rtl.toLowerCase() === langCode || locale.toLowerCase().startsWith(rtl.toLowerCase()));
}

// ============================================
// PROVIDER
// ============================================
interface StoreConfigProviderProps {
  children: React.ReactNode;
  config?: StoreConfig;
}

export function StoreConfigProvider({
  children,
  config: initialConfig = storeConfig,
}: StoreConfigProviderProps) {
  // Use state to allow dynamic updates
  const [config, setConfig] = React.useState<StoreConfig>(initialConfig);

  // Update config when initialConfig prop changes (e.g., from server-side fetch)
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Listen for real-time config updates from useConfigSync hook
  useEffect(() => {
    const handleConfigUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ channel: string; config: StoreConfig }>;
      if (customEvent.detail?.config) {
        const newConfig = customEvent.detail.config;
        console.log("[StoreConfigProvider] 🔄 Real-time config update received");
        console.log("[StoreConfigProvider]    Store name:", newConfig.store.name);
        console.log("[StoreConfigProvider]    Primary color:", newConfig.branding.colors.primary);
        
        // Always update - don't check if it's the same, React will handle re-renders efficiently
        setConfig(newConfig);
      }
    };

    window.addEventListener('storefront-config-updated', handleConfigUpdate);

    return () => {
      window.removeEventListener('storefront-config-updated', handleConfigUpdate);
    };
  }, []);

  // Debug logging to verify config is received
  useEffect(() => {
    console.log("[StoreConfigProvider] 🎨 Applying config:");
    console.log("[StoreConfigProvider]    Store name:", config.store.name);
    console.log("[StoreConfigProvider]    Primary color:", config.branding.colors.primary);
    console.log("[StoreConfigProvider]    Direction:", config.localization?.direction || "auto");
    console.log("[StoreConfigProvider]    Footer config:", config.footer);
    if (config.footer) {
      console.log("[StoreConfigProvider]    Footer showBrand:", config.footer.showBrand, typeof config.footer.showBrand);
      console.log("[StoreConfigProvider]    Footer showMenu:", config.footer.showMenu, typeof config.footer.showMenu);
    }
  }, [config]);

  // Generate CSS variables from config
  const cssVariables = useMemo(() => getThemeCSSVariables(config), [config]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup on unmount
    return () => {
      Object.keys(cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [cssVariables]);

  // Handle RTL/LTR direction (for dynamic updates)
  // Note: Initial direction is set server-side via blocking script to prevent FOUC
  useEffect(() => {
    const root = document.documentElement;
    const localization = config.localization;
    const direction = localization?.direction || 'auto';
    const defaultLocale = localization?.defaultLocale || 'en-US';
    
    let resolvedDir: 'ltr' | 'rtl' = 'ltr';
    
    if (direction === 'auto') {
      // Auto-detect from locale
      const rtlLocales = localization?.rtlLocales || DEFAULT_RTL_LOCALES;
      resolvedDir = isRtlLocale(defaultLocale, rtlLocales) ? 'rtl' : 'ltr';
    } else {
      resolvedDir = direction;
    }
    
    // Only update if different from current (prevents unnecessary updates)
    if (root.dir !== resolvedDir) {
      root.dir = resolvedDir;
    }
    if (root.lang !== defaultLocale) {
      root.lang = defaultLocale;
    }
  }, [config.localization]);

  // Handle dark mode
  useEffect(() => {
    const root = document.documentElement;
    const darkMode = config.darkMode;
    
    if (!darkMode?.enabled) {
      root.classList.remove('dark', 'dark-auto');
      return;
    }
    
    if (darkMode.auto) {
      // Follow system preference
      root.classList.add('dark-auto');
      root.classList.remove('dark');
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      // Initial check
      handleChange(mediaQuery);
      
      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        root.classList.remove('dark', 'dark-auto');
      };
    } else {
      // Always dark
      root.classList.add('dark');
      root.classList.remove('dark-auto');
      
      return () => {
        root.classList.remove('dark');
      };
    }
  }, [config.darkMode]);

  return (
    <StoreConfigContext.Provider value={config}>
      {children}
    </StoreConfigContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useStoreConfig(): StoreConfig {
  const config = useContext(StoreConfigContext);
  if (!config) {
    throw new Error("useStoreConfig must be used within StoreConfigProvider");
  }
  return config;
}

// ============================================
// FEATURE FLAG HOOKS
// ============================================

/**
 * Check if a specific feature is enabled
 */
export function useFeature(
  featureName: keyof StoreConfig["features"]
): boolean {
  const config = useStoreConfig();
  return config.features[featureName];
}

/**
 * Get branding configuration
 */
export function useBranding(): StoreConfig["branding"] {
  const config = useStoreConfig();
  return config.branding;
}

/**
 * Get store information
 */
export function useStoreInfo(): StoreConfig["store"] {
  const config = useStoreConfig();
  return config.store;
}

/**
 * Get e-commerce settings
 */
export function useEcommerceSettings(): StoreConfig["ecommerce"] {
  const config = useStoreConfig();
  return config.ecommerce;
}

/**
 * Get homepage configuration
 */
export function useHomepageConfig(): StoreConfig["homepage"] {
  const config = useStoreConfig();
  return config.homepage;
}

/**
 * Get SEO configuration
 */
export function useSeoConfig(): StoreConfig["seo"] {
  const config = useStoreConfig();
  return config.seo;
}

/**
 * Get social links
 */
export function useSocialLinks(): StoreConfig["integrations"]["social"] {
  const config = useStoreConfig();
  return config.integrations.social;
}

/**
 * Check if a page is enabled
 */
export function usePageEnabled(pageName: keyof StoreConfig["pages"]): boolean {
  const config = useStoreConfig();
  return config.pages[pageName];
}

// Default filters config
const DEFAULT_FILTERS_CONFIG = {
  enabled: true,
  priceFilter: { enabled: true, showQuickButtons: true },
  ratingFilter: { enabled: true },
  brandFilter: { enabled: true },
  sizeFilter: { enabled: true },
  colorFilter: { enabled: true },
  categoryFilter: { enabled: true },
  collectionFilter: { enabled: true },
  stockFilter: { enabled: true },
} as const;

// Default quickFilters config
const DEFAULT_QUICK_FILTERS_CONFIG = {
  enabled: true,
  showCategories: true,
  showCollections: true,
  showBrands: true,
  categoryLimit: 8,
  collectionLimit: 6,
  brandLimit: 6,
} as const;

/**
 * Get filters configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useFiltersConfig(): NonNullable<StoreConfig["filters"]> {
  const config = useStoreConfig();
  return { ...DEFAULT_FILTERS_CONFIG, ...config.filters };
}

/**
 * Get quickFilters configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useQuickFiltersConfig(): NonNullable<StoreConfig["quickFilters"]> {
  const config = useStoreConfig();
  return { ...DEFAULT_QUICK_FILTERS_CONFIG, ...config.quickFilters };
}

// Default header config
const DEFAULT_HEADER_CONFIG = {
  banner: {
    enabled: true,
    text: "Free shipping on orders over $50 • Fast delivery worldwide",
    backgroundColor: null,
    textColor: null,
  },
  showStoreName: true,
  logoPosition: "left" as const,
} as const;

// Default footer config
const DEFAULT_FOOTER_CONFIG = {
  showBrand: true,
  showMenu: true,
  showContactInfo: true,
  showNewsletter: true,
  showSocialLinks: true,
  copyrightText: null,
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
} as const;

/**
 * Get header configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useHeaderConfig(): NonNullable<StoreConfig["header"]> {
  const config = useStoreConfig();
  return {
    ...DEFAULT_HEADER_CONFIG,
    ...config.header,
    banner: {
      ...DEFAULT_HEADER_CONFIG.banner,
      ...config.header?.banner,
    },
  };
}

/**
 * Get footer configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 * IMPORTANT: Explicitly preserves false values from config to override defaults
 */
export function useFooterConfig(): NonNullable<StoreConfig["footer"]> {
  const config = useStoreConfig();
  
  // Debug: Log raw config before merge
  if (process.env.NODE_ENV === "development") {
    console.log("[useFooterConfig] Raw config.footer:", config.footer);
    console.log("[useFooterConfig] showBrand in config:", config.footer?.showBrand, typeof config.footer?.showBrand);
    console.log("[useFooterConfig] showMenu in config:", config.footer?.showMenu, typeof config.footer?.showMenu);
  }
  
  // Start with defaults
  const merged: NonNullable<StoreConfig["footer"]> = { ...DEFAULT_FOOTER_CONFIG };
  
  // Explicitly merge footer config, preserving false values
  if (config.footer) {
    // Boolean values: explicitly check if they exist in config (even if false)
    // Use Object.hasOwnProperty to check if property exists (handles false values correctly)
    if (Object.prototype.hasOwnProperty.call(config.footer, 'showBrand')) {
      merged.showBrand = !!config.footer.showBrand; // Convert to boolean, preserving false
    }
    if (Object.prototype.hasOwnProperty.call(config.footer, 'showMenu')) {
      merged.showMenu = !!config.footer.showMenu; // Convert to boolean, preserving false
    }
    if (Object.prototype.hasOwnProperty.call(config.footer, 'showContactInfo')) {
      merged.showContactInfo = !!config.footer.showContactInfo; // Convert to boolean, preserving false
    }
    if (Object.prototype.hasOwnProperty.call(config.footer, 'showNewsletter')) {
      merged.showNewsletter = !!config.footer.showNewsletter; // Convert to boolean, preserving false
    }
    if (Object.prototype.hasOwnProperty.call(config.footer, 'showSocialLinks')) {
      merged.showSocialLinks = !!config.footer.showSocialLinks; // Convert to boolean, preserving false
    }
    if (config.footer.copyrightText !== undefined) {
      merged.copyrightText = config.footer.copyrightText;
    }
    
    // Deep merge legalLinks to preserve defaults for missing fields
    if (config.footer.legalLinks) {
      merged.legalLinks = {
        trackOrder: {
          ...DEFAULT_FOOTER_CONFIG.legalLinks.trackOrder,
          ...config.footer.legalLinks.trackOrder,
        },
        privacyPolicy: {
          ...DEFAULT_FOOTER_CONFIG.legalLinks.privacyPolicy,
          ...config.footer.legalLinks.privacyPolicy,
        },
        termsOfService: {
          ...DEFAULT_FOOTER_CONFIG.legalLinks.termsOfService,
          ...config.footer.legalLinks.termsOfService,
        },
        shippingPolicy: {
          ...DEFAULT_FOOTER_CONFIG.legalLinks.shippingPolicy,
          ...config.footer.legalLinks.shippingPolicy,
        },
        returnPolicy: {
          ...DEFAULT_FOOTER_CONFIG.legalLinks.returnPolicy,
          ...config.footer.legalLinks.returnPolicy,
        },
      };
    }
  }
  
  // Debug: Log final merged config
  if (process.env.NODE_ENV === "development") {
    console.log("[useFooterConfig] Final merged config:", {
      showBrand: merged.showBrand,
      showMenu: merged.showMenu,
      showContactInfo: merged.showContactInfo,
      showNewsletter: merged.showNewsletter,
      showSocialLinks: merged.showSocialLinks,
    });
  }
  
  return merged;
}

// Default promo popup config
const DEFAULT_PROMO_POPUP_CONFIG = {
  enabled: true,
  title: "Special Offer",
  body: "Don't miss out on our biggest sale of the season!",
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
} as const;

/**
 * Get promo popup configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function usePromoPopupConfig(): NonNullable<StoreConfig["promoPopup"]> {
  const config = useStoreConfig();
  return { ...DEFAULT_PROMO_POPUP_CONFIG, ...config.promoPopup };
}

/**
 * Get hero content configuration (from Storefront Control app)
 */
export function useHeroContent(): StoreConfig["heroContent"] {
  const config = useStoreConfig();
  return config.heroContent;
}

// Default UI config
const DEFAULT_UI_CONFIG = {
  buttons: {
    borderRadius: "md" as const,
    primary: { backgroundColor: null, textColor: null, hoverBackgroundColor: null, borderColor: null },
    secondary: { backgroundColor: null, textColor: null, hoverBackgroundColor: null, borderColor: null },
    outline: { backgroundColor: null, textColor: null, hoverBackgroundColor: null, borderColor: null },
    danger: { backgroundColor: null, textColor: null, hoverBackgroundColor: null, borderColor: null },
  },
  badges: {
    sale: { backgroundColor: null, textColor: null, borderRadius: "sm" as const },
    new: { backgroundColor: null, textColor: null, borderRadius: "sm" as const },
    outOfStock: { backgroundColor: null, textColor: null, borderRadius: "sm" as const },
    lowStock: { backgroundColor: null, textColor: null, borderRadius: "sm" as const },
    discount: { backgroundColor: null, textColor: null, borderRadius: "full" as const },
    featured: { backgroundColor: null, textColor: null, borderRadius: "sm" as const },
  },
  inputs: {
    borderRadius: "md" as const,
    borderColor: null,
    focusBorderColor: null,
    focusRingColor: null,
    backgroundColor: null,
    placeholderColor: null,
  },
  checkbox: { checkedBackgroundColor: null, borderRadius: "sm" as const },
  productCard: {
    borderRadius: "lg" as const,
    shadow: "sm" as const,
    hoverShadow: "lg" as const,
    showQuickView: false,
    showWishlistButton: true,
    showAddToCart: true,
    imageAspectRatio: "square" as const,
  },
  toasts: {
    position: "bottom-right" as const,
    borderRadius: "md" as const,
    success: { backgroundColor: null, textColor: null, iconColor: null },
    error: { backgroundColor: null, textColor: null, iconColor: null },
    warning: { backgroundColor: null, textColor: null, iconColor: null },
    info: { backgroundColor: null, textColor: null, iconColor: null },
  },
  icons: { style: "outline" as const, defaultColor: null, activeColor: null },
} as const;

// Default content config
const DEFAULT_CONTENT_CONFIG = {
  cart: {
    emptyCartTitle: "Your cart is empty",
    emptyCartMessage: "Looks like you haven't added anything to your cart yet.",
    cartTitle: "Shopping Cart",
    checkoutButton: "Checkout",
    continueShoppingButton: "Continue Shopping",
    selectAllButton: "Select All",
    deselectAllButton: "Deselect All",
    selectAllItemsButton: "Select all items",
    selectItemsToCheckout: "Select items to proceed to checkout",
    freeShippingMessage: "Add {amount} more for free shipping",
    freeShippingThresholdReached: "You've qualified for free shipping!",
    addXMoreForFreeShipping: "Add {amount} more for FREE shipping!",
    unlockedFreeShipping: "You've unlocked FREE shipping!",
    saveForLaterButton: "Save for Later",
    moveToCartButton: "Move to Cart",
    deleteButton: "Delete",
    itemSingular: "item",
    itemPlural: "items",
    orderSummaryTitle: "Order Summary",
    itemsSelectedText: "{count} {singular|plural} selected",
    eachLabel: "each",
    availableLabel: "available",
    outOfStockLabel: "Out of stock",
    loadingCheckoutTitle: "Loading Checkout...",
    loadingCheckoutMessage: "Please wait while we prepare your checkout",
    quantityMinError: "Quantity must be at least 1",
    onlyXItemsAvailable: "Only {count} items available in stock",
    useDeleteButtonMessage: "Use the Delete button to remove items from cart",
    failedToUpdateQuantity: "Failed to update quantity",
    onlyXAvailable: "Only {count} available",
    quantityUpdatedSuccess: "Quantity updated!",
    // Promo code section
    promoCodeLabel: "Promo Code",
    promoCodePlaceholder: "Enter code",
    promoCodeApplyButton: "Apply",
    // Order summary
    subtotalLabel: "Subtotal",
    subtotalLabelWithCount: "Subtotal ({count} items)",
    shippingLabel: "Shipping",
    shippingFree: "FREE",
    shippingCalculatedAtCheckout: "Calculated at checkout",
    totalLabel: "Total",
    // Checkout button states
    selectItemsButton: "Select Items",
    preparingCheckout: "Preparing...",
    loadingCheckout: "Loading...",
    // Trust badges
    secureCheckoutText: "Secure Checkout",
    sslEncryptedText: "SSL Encrypted",
    // Payment methods
    acceptedPaymentMethods: "Accepted Payment Methods",
    providedByStripe: "Provided by Stripe",
    // Saved for later
    itemsSavedForLater: "{count} item(s) saved for later",
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
    addingButton: "Adding...",
    addedToCartButton: "Added to Cart!",
    selectOptionsButton: "Select Options",
    viewCartLink: "View Cart →",
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
    // Extended fields for account sidebar
    dashboardTitle: "Dashboard",
    needHelpTitle: "Need Help?",
    needHelpDescription: "Our support team is here to assist you 24/7",
    contactSupportButton: "Contact Support",
    // Login page text
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
    // Category cards
    shopNowButton: "Shop Now",
    productCountText: "Products",
    // Newsletter
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
    privacyPolicyLinkText: "Privacy Policy",
    termsOfServiceLinkText: "Terms of Service",
    sslEncryptionMessage: "Protected by SSL encryption • Your payment info is safe",
  },
  filters: {
    // Section titles
    sectionTitle: "Filters",
    clearAllButton: "Clear All Filters",
    showResultsButton: "Show Results",
    
    // Filter headings
    categoryTitle: "Category",
    collectionTitle: "Collection",
    brandTitle: "Brand",
    sizeTitle: "Size",
    colorTitle: "Color",
    priceTitle: "Price",
    ratingTitle: "Rating",
    availabilityTitle: "Availability",
    
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
    resultsCountText: "{count} results",
    noResultsMessage: "No products found matching your search",
    
    // Results text
    resultsText: "results",
    itemsAvailable: "items available",
    productsPageTitle: "All Products",
    discoverProducts: "Discover Products",
    searchForText: "for",  // Text between count and search query (e.g., "10 for 'shoes'")
    
    // Sort dropdown
    sortByLabel: "Sort by:",
    filtersButtonText: "Filters",
    
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
    // Variant selection labels
    colorLabel: "Color",
    sizeLabel: "Size",
    selectOptionLabel: "Select Option",
    pleaseSelectSize: "Please select a size",
    pleaseSelectOption: "Please select an option",
    // Stock messages
    onlyXLeft: "Only {count} left!",
    inStockWithCount: "In Stock ({count} available)",
    sellingFast: "Selling fast!",
    savePercent: "Save {percent}%",
    // Review pluralization
    reviewSingular: "review",
    reviewPlural: "reviews",
    // Image gallery labels
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
    // Review filters
    allRatings: "All Ratings",
    verifiedOnly: "Verified Only",
    // Review delete modal
    deleteReviewTitle: "Delete Review",
    deleteReviewMessage: "Are you sure you want to delete this review? This action cannot be undone.",
    cancelButton: "Cancel",
    deletingButton: "Deleting...",
    // Review time formatting
    justNow: "just now",
    minutesAgo: "{count} minutes ago",
    hoursAgo: "{count} hours ago",
    daysAgo: "{count} days ago",
    // Shipping information
    freeStandardShippingTitle: "Free Standard Shipping",
    freeStandardShippingDescription: "On orders over $75. Delivery in 5-7 business days.",
    expressShippingTitle: "Express Shipping",
    expressShippingDescription: "{price}. Delivery in 2-3 business days.",
    // Review list and loading states
    loadingReviews: "Loading reviews...",
    reviewCountText: "{count} review(s)", // Not used directly, using reviewSingular/reviewPlural instead
    noReviewsMatchFilters: "No reviews match your filters.",
    clearFilters: "Clear Filters",
    clearFiltersLowercase: "Clear filters",
    tryAgain: "Try again",
    failedToLoadReviews: "Failed to load reviews. Please try again.",
    loadMoreReviews: "Load More Reviews",
    starsLabel: "{count} Star(s)", // Not used directly, hardcoded in dropdown
    // Review form labels (for edit form)
    ratingLabel: "Rating",
    titleLabel: "Title",
    reviewLabel: "Review",
    // Review form states and messages
    uploadingImages: "Uploading and compressing images...",
    savingButton: "Saving...",
    saveButton: "Save",
    submittingButton: "Submitting...",
    thankYouMessage: "Thank you for your review!",
    reviewSubmittedMessage: "Your review has been submitted and will be visible after moderation.",
    // Review form validation messages
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
  },
  dashboard: {
    totalOrders: "Total Orders",
    wishlistItems: "Wishlist Items",
    savedAddresses: "Saved Addresses",
    memberSince: "Member Since",
    welcomeBack: "Welcome back, {name}",
    welcomeBackMessage: "Here's what's happening with your account today.",
    accountSummary: "here's what's happening with your account today",
    recentOrders: "Recent Orders",
    viewAllButton: "View All →",
    viewButton: "View",
    orderLabel: "Order",
    orderNumberPrefix: "Order #",
    noOrdersYet: "No orders yet",
    whenYouPlaceOrder: "When you place an order, it will appear here.",
    noRecentOrders: "No recent orders",
    startShopping: "Start Shopping",
  },
  orders: {
    myOrdersTitle: "My Orders",
    ordersPlacedCount: "{count} order(s) placed",
    orderNumber: "Order Number",
    orderLabel: "Order",
    orderNumberPrefix: "Order #",
    datePlaced: "Date Placed",
    totalLabel: "TOTAL",
    getInvoice: "Get Invoice",
    downloadInvoice: "Download Invoice",
    viewDetails: "View Details",
    trackPackage: "Track Package",
    buyAgain: "Buy Again",
    showAllOrders: "Show All Orders ({count})",
    showLess: "Show Less",
    ordersPlaced: "Orders Placed",
    noOrders: "No orders yet",
    noOrdersMessage: "When you place an order, it will appear here",
    noOrdersYetMessage: "Looks like you haven't placed any orders yet. Start shopping to see your orders here!",
    orderStatus: "Status",
    trackOrder: "Track Order",
    qtyLabel: "Qty:",
    remainingItems: "+{count}",
    generatingInvoice: "Generating Invoice...",
    generateDownloadInvoice: "Generate & Download Invoice",
    invoiceAvailable: "Invoice Available",
    invoiceAvailableMessage: "Click below to generate and download your invoice as a PDF.",
    invoicePending: "Invoice Pending",
    invoicePendingMessage: "Invoices are generated once payment is completed and will be sent to your email address. You can also download your invoice from this page once our staff confirms your order.",
    invoiceWillBeGenerated: "Your invoice will be generated instantly and downloaded as a PDF.",
    needInvoiceSooner: "Need your invoice sooner? Please contact our support team.",
    close: "Close",
    invoiceModalTitle: "Invoice",
    trackingModalTitle: "Track Package",
    trackingNumberLabel: "Tracking Number",
    statusLabel: "Status:",
    trackPackageDescription: "Track your package using any of the services below:",
    universalTrackers: "Universal Trackers (Recommended)",
    directCarrierLinks: "Direct Carrier Links",
    loading: "Loading...",
    // Order Details Page
    backToOrders: "Back to Orders",
    placedOn: "Placed on",
    orderItemsTitle: "Order Items",
    viewProduct: "View Product",
    orderSummaryTitle: "Order Summary",
    subtotalLabel: "Subtotal",
    shippingLabel: "Shipping",
    shippingFree: "Free",
    totalLabelDetails: "Total",
    shippingAddressTitle: "Shipping Address",
    billingAddressTitle: "Billing Address",
    shipmentTrackingTitle: "Shipment Tracking",
    statusLabelDetails: "Status",
    trackingNumberLabelDetails: "Tracking #",
    invoiceTitle: "Invoice",
    invoiceNumberPrefix: "Invoice #",
    downloadButton: "Download",
    generatingText: "Generating...",
    unavailableText: "Unavailable",
    quickActionsTitle: "Quick Actions",
    needHelpTitle: "Need Help?",
    contactSupportButton: "Contact Support",
    viewFaqsButton: "View FAQs",
    // Order Status Labels
    statusProcessing: "Processing",
    statusPartiallyShipped: "Partially Shipped",
    statusShipped: "Shipped",
    statusDelivered: "Delivered",
    statusCanceled: "Canceled",
    statusReturned: "Returned",
    // Payment Status Labels
    paymentPending: "Pending",
    paymentPartiallyPaid: "Partially Paid",
    paymentPaid: "Paid",
    paymentPartiallyRefunded: "Partially Refunded",
    paymentRefunded: "Refunded",
    paymentFailed: "Payment Failed",
    paymentCancelled: "Cancelled",
    // Reorder Button
    reorderItems: "Reorder Items",
    addingToCart: "Adding to Cart...",
    itemsAddedToCart: "{count} item(s) added to cart!",
    redirectingToCart: "Redirecting to cart...",
    tryAgain: "Try Again",
  },
  addresses: {
    myAddresses: "My Addresses",
    addressesCount: "{count} address(es) saved",
    noAddressesYet: "No addresses saved yet",
    addAddressButton: "Add Address",
    defaultShipping: "Default Shipping",
    defaultBilling: "Default Billing",
    shippingAndBilling: "Shipping & Billing",
    shippingAddress: "Shipping Address",
    billingAddress: "Billing Address",
    savedAddress: "Saved Address",
    setAsDefault: "Set as Default",
    noAddresses: "No addresses saved",
    noAddressesMessage: "Add your first address to speed up checkout",
    noAddressesCheckoutMessage: "Your shipping and billing addresses will be saved here when you complete checkout.",
    addNewAddressTitle: "Add New Address",
    addAddressDescription: "Adding new addresses requires going through checkout. Your addresses will be saved automatically when you complete a purchase.",
    editButton: "Edit",
    deleteButton: "Delete",
    continueShoppingButton: "Continue Shopping",
    startShopping: "Start Shopping",
    cancel: "Cancel",
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
    removeFromWishlistTooltip: "Remove from wishlist",
    moveToCart: "Add to Cart",
  },
  settings: {
    accountSettings: "Account Settings",
    settingsSubtitle: "Manage your profile, security, and notification preferences",
    profileInformation: "Profile Information",
    updatePersonalDetails: "Update your personal details",
    saveChangesButton: "Save Changes",
    savingChanges: "Saving...",
    changesSaved: "Changes saved successfully",
    changePassword: "Change Password",
    passwordSecurityNote: "Update your password to keep your account secure",
    currentPassword: "Current Password",
    newPasswordLabel: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePasswordButton: "Update Password",
    passwordUpdated: "Password updated successfully",
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
    customerService: "Customer Service",
    shopTitle: "Shop",
    companyTitle: "Company",
    supportTitle: "Support",
    followUsTitle: "Follow Us",
    trackOrderLink: "Track Order",
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
  error: {
    title: "Something went wrong",
    description: "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
    errorDetails: "Error details",
    tryAgainButton: "Try Again",
    backToHomeButton: "Back to Home",
    needHelpText: "Need help?",
    contactSupportLink: "Contact our support team",
  },
  notFound: {
    title: "Page Not Found",
    description: "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.",
    backToHomeButton: "Back to Home",
    browseProductsButton: "Browse Products",
    helpfulLinksText: "Or check out these pages:",
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
} as const;

/**
 * Get UI configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useUiConfig(): NonNullable<StoreConfig["ui"]> {
  const config = useStoreConfig();
  if (!config.ui) return DEFAULT_UI_CONFIG as any;
  return {
    ...DEFAULT_UI_CONFIG,
    ...config.ui,
    buttons: { ...DEFAULT_UI_CONFIG.buttons, ...config.ui.buttons },
    badges: { ...DEFAULT_UI_CONFIG.badges, ...config.ui.badges },
    inputs: { ...DEFAULT_UI_CONFIG.inputs, ...config.ui.inputs },
    checkbox: { ...DEFAULT_UI_CONFIG.checkbox, ...config.ui.checkbox },
    productCard: { ...DEFAULT_UI_CONFIG.productCard, ...config.ui.productCard },
    toasts: { ...DEFAULT_UI_CONFIG.toasts, ...config.ui.toasts },
    icons: { ...DEFAULT_UI_CONFIG.icons, ...config.ui.icons },
  };
}

/**
 * Get content/text configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useContentConfig(): NonNullable<StoreConfig["content"]> {
  const config = useStoreConfig();
  if (!config.content) return DEFAULT_CONTENT_CONFIG as NonNullable<StoreConfig["content"]>;
  return {
    ...DEFAULT_CONTENT_CONFIG,
    ...config.content,
    cart: { ...DEFAULT_CONTENT_CONFIG.cart, ...config.content.cart },
    product: { ...DEFAULT_CONTENT_CONFIG.product, ...config.content.product },
    account: { ...DEFAULT_CONTENT_CONFIG.account, ...config.content.account },
    general: { ...DEFAULT_CONTENT_CONFIG.general, ...config.content.general },
    homepage: { ...DEFAULT_CONTENT_CONFIG.homepage, ...config.content.homepage },
    checkout: { ...DEFAULT_CONTENT_CONFIG.checkout, ...config.content.checkout },
    filters: { ...DEFAULT_CONTENT_CONFIG.filters, ...(config.content.filters || {}) },
    productDetail: { ...DEFAULT_CONTENT_CONFIG.productDetail, ...(config.content?.productDetail || {}) } as NonNullable<StoreConfig["content"]>["productDetail"],
    dashboard: { ...DEFAULT_CONTENT_CONFIG.dashboard, ...(config.content.dashboard || {}) } as NonNullable<StoreConfig["content"]>["dashboard"],
    orders: { ...DEFAULT_CONTENT_CONFIG.orders, ...(config.content.orders || {}) } as NonNullable<StoreConfig["content"]>["orders"],
    addresses: { ...DEFAULT_CONTENT_CONFIG.addresses, ...(config.content.addresses || {}) } as NonNullable<StoreConfig["content"]>["addresses"],
    wishlist: { ...DEFAULT_CONTENT_CONFIG.wishlist, ...(config.content.wishlist || {}) } as NonNullable<StoreConfig["content"]>["wishlist"],
    settings: { ...DEFAULT_CONTENT_CONFIG.settings, ...(config.content.settings || {}) } as NonNullable<StoreConfig["content"]>["settings"],
    footer: { ...DEFAULT_CONTENT_CONFIG.footer, ...(config.content.footer || {}) } as NonNullable<StoreConfig["content"]>["footer"],
    navbar: { ...DEFAULT_CONTENT_CONFIG.navbar, ...(config.content.navbar || {}) } as NonNullable<StoreConfig["content"]>["navbar"],
    orderTracking: { ...DEFAULT_CONTENT_CONFIG.orderTracking, ...((config.content as any).orderTracking || {}) } as NonNullable<StoreConfig["content"]>["orderTracking"],
    contact: { ...DEFAULT_CONTENT_CONFIG.contact, ...((config.content as any).contact || {}) } as NonNullable<StoreConfig["content"]>["contact"],
    // Ensure all required fields are present (with type assertion for optional fields)
    error: { ...DEFAULT_CONTENT_CONFIG.error, ...((config.content as any).error || {}) } as NonNullable<StoreConfig["content"]>["error"],
    notFound: { ...DEFAULT_CONTENT_CONFIG.notFound, ...((config.content as any).notFound || {}) } as NonNullable<StoreConfig["content"]>["notFound"],
  } as NonNullable<StoreConfig["content"]>;
}

/**
 * Get filters text configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 * Convenient shortcut for accessing just the filters text section
 */
export function useFiltersText(): NonNullable<StoreConfig["content"]>["filters"] {
  const content = useContentConfig();
  return content.filters;
}

/**
 * Get product detail text configuration
 */
export function useProductDetailText(): NonNullable<StoreConfig["content"]>["productDetail"] {
  const content = useContentConfig();
  return content.productDetail as NonNullable<StoreConfig["content"]>["productDetail"];
}

/**
 * Get account dashboard text configuration
 */
export function useDashboardText(): NonNullable<StoreConfig["content"]>["dashboard"] {
  const content = useContentConfig();
  return content.dashboard as NonNullable<StoreConfig["content"]>["dashboard"];
}

/**
 * Get orders page text configuration
 */
export function useOrdersText(): NonNullable<StoreConfig["content"]>["orders"] {
  const content = useContentConfig();
  return content.orders as NonNullable<StoreConfig["content"]>["orders"];
}

/**
 * Get order tracking page text configuration
 */
export function useOrderTrackingText(): NonNullable<StoreConfig["content"]>["orderTracking"] {
  const content = useContentConfig();
  return content.orderTracking as NonNullable<StoreConfig["content"]>["orderTracking"];
}

/**
 * Get contact page text configuration
 */
export function useContactText(): NonNullable<StoreConfig["content"]>["contact"] {
  const content = useContentConfig();
  return content.contact as NonNullable<StoreConfig["content"]>["contact"];
}

/**
 * Get addresses page text configuration
 */
export function useAddressesText(): NonNullable<StoreConfig["content"]>["addresses"] {
  const content = useContentConfig();
  return content.addresses as NonNullable<StoreConfig["content"]>["addresses"];
}

/**
 * Get wishlist page text configuration
 */
export function useWishlistText(): NonNullable<StoreConfig["content"]>["wishlist"] {
  const content = useContentConfig();
  return content.wishlist as NonNullable<StoreConfig["content"]>["wishlist"];
}

/**
 * Get settings page text configuration
 */
export function useSettingsText(): NonNullable<StoreConfig["content"]>["settings"] {
  const content = useContentConfig();
  return content.settings as NonNullable<StoreConfig["content"]>["settings"];
}

/**
 * Get footer text configuration
 */
export function useFooterText(): NonNullable<StoreConfig["content"]>["footer"] {
  const content = useContentConfig();
  return content.footer!;
}

/**
 * Get navbar text configuration
 */
export function useNavbarText(): NonNullable<StoreConfig["content"]>["navbar"] {
  const content = useContentConfig();
  return content.navbar!;
}

/**
 * Get error page text configuration
 */
export function useErrorText(): NonNullable<StoreConfig["content"]>["error"] {
  const content = useContentConfig();
  return content.error!;
}

/**
 * Get 404 not found page text configuration
 */
export function useNotFoundText(): NonNullable<StoreConfig["content"]>["notFound"] {
  const content = useContentConfig();
  return content.notFound!;
}

/**
 * Get button styles based on variant
 */
export function useButtonStyle(variant: "primary" | "secondary" | "outline" | "danger" = "primary") {
  const ui = useUiConfig();
  const branding = useBranding();
  const buttonConfig = ui.buttons[variant];
  
  // Resolve colors with fallbacks
  const bgColor = buttonConfig.backgroundColor || (variant === "primary" ? branding.colors.primary : 
    variant === "secondary" ? branding.colors.secondary : 
    variant === "danger" ? branding.colors.error : "transparent");
  const textColor = buttonConfig.textColor || (variant === "outline" ? branding.colors.primary : "#FFFFFF");
  const borderColor = buttonConfig.borderColor || (variant === "outline" ? branding.colors.primary : "transparent");
  
  return {
    backgroundColor: bgColor,
    color: textColor,
    borderColor,
    borderRadius: ui.buttons.borderRadius,
  };
}

/**
 * Get badge styles based on type
 */
export function useBadgeStyle(type: "sale" | "new" | "outOfStock" | "lowStock" | "discount" | "featured" = "sale") {
  const ui = useUiConfig();
  const branding = useBranding();
  const badgeConfig = ui.badges[type];
  
  // Resolve colors with fallbacks
  const defaultColors = {
    sale: branding.colors.error,
    new: branding.colors.success,
    outOfStock: branding.colors.textMuted,
    lowStock: branding.colors.warning,
    discount: branding.colors.error,
    featured: branding.colors.accent,
  };
  
  return {
    backgroundColor: badgeConfig.backgroundColor || defaultColors[type],
    color: badgeConfig.textColor || "#FFFFFF",
    borderRadius: badgeConfig.borderRadius,
  };
}

// ============================================
// UTILITY COMPONENTS
// ============================================

/**
 * Conditionally render children based on feature flag
 */
interface FeatureGateProps {
  feature: keyof StoreConfig["features"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const isEnabled = useFeature(feature);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Conditionally render children based on page flag
 */
interface PageGateProps {
  page: keyof StoreConfig["pages"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PageGate({ page, children, fallback = null }: PageGateProps) {
  const isEnabled = usePageEnabled(page);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Export context for advanced use cases
export { StoreConfigContext };

