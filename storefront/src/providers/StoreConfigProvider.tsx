"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { StoreConfig, getThemeCSSVariables, storeConfig, DEFAULT_RTL_LOCALES, ANIMATION_PRESETS } from "@/config";
import { initPreviewMode } from "@/lib/preview-mode";
import type {
  TrustStripConfig,
  BrandGridConfig,
  CategoriesConfig,
  TrendingConfig,
  PromotionBannerConfig,
  FlashDealsConfig,
  CollectionMosaicConfig,
  BestSellersConfig,
  CustomerFeedbackConfig,
  NewsletterConfig as NewsletterSectionConfig,
} from "@saleor/apps-storefront-config";

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
        setConfig(customEvent.detail.config);
      }
    };

    window.addEventListener('storefront-config-updated', handleConfigUpdate);

    return () => {
      window.removeEventListener('storefront-config-updated', handleConfigUpdate);
    };
  }, []);

  // Initialize preview mode bridge (iframe PostMessage -> CustomEvent)
  useEffect(() => {
    initPreviewMode();
  }, []);

  // Generate CSS variables from config
  const cssVariables = useMemo(() => getThemeCSSVariables(config), [config]);

  // Apply all DOM mutations in a single effect to batch into one paint cycle
  // CSS variables, RTL/LTR direction, and dark mode are all applied together.
  // Note: Initial direction is set server-side via blocking script to prevent FOUC
  useEffect(() => {
    const root = document.documentElement;

    // --- CSS Variables ---
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // --- Direction ---
    const localization = config.localization;
    const direction = localization?.direction || "auto";
    const defaultLocale = localization?.defaultLocale || "en-US";
    let resolvedDir: "ltr" | "rtl" = "ltr";
    if (direction === "auto") {
      const rtlLocales = localization?.rtlLocales || DEFAULT_RTL_LOCALES;
      resolvedDir = isRtlLocale(defaultLocale, rtlLocales) ? "rtl" : "ltr";
    } else {
      resolvedDir = direction;
    }
    if (root.dir !== resolvedDir) root.dir = resolvedDir;
    if (root.lang !== defaultLocale) root.lang = defaultLocale;

    // --- Dark Mode ---
    const darkMode = config.darkMode;
    let mediaCleanup: (() => void) | undefined;
    if (!darkMode?.enabled) {
      root.classList.remove("dark", "dark-auto");
    } else if (darkMode.auto) {
      root.classList.add("dark-auto");
      root.classList.remove("dark");
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        e.matches ? root.classList.add("dark") : root.classList.remove("dark");
      };
      handleChange(mediaQuery);
      mediaQuery.addEventListener("change", handleChange);
      mediaCleanup = () => {
        mediaQuery.removeEventListener("change", handleChange);
        root.classList.remove("dark", "dark-auto");
      };
    } else {
      root.classList.add("dark");
      root.classList.remove("dark-auto");
    }

    return () => {
      Object.keys(cssVariables).forEach((key) => root.style.removeProperty(key));
      mediaCleanup?.();
      if (!darkMode?.auto) root.classList.remove("dark");
    };
  }, [cssVariables, config.localization, config.darkMode]);

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
// GENERIC CONFIG ACCESSOR HOOKS
// ============================================

/**
 * Access any top-level config section by key
 */
export function useConfigSection<K extends keyof StoreConfig>(key: K): StoreConfig[K] {
  const config = useStoreConfig();
  return config[key];
}

/**
 * Access a homepage section by id, returns null if not present
 */
export function useHomepageSection<K extends keyof NonNullable<StoreConfig["homepage"]>["sections"]>(
  id: K
): NonNullable<StoreConfig["homepage"]>["sections"][K] | null {
  const config = useStoreConfig();
  const sections = config.homepage?.sections;
  if (!sections) return null;
  return (sections as Record<string, unknown>)[id as string] as NonNullable<StoreConfig["homepage"]>["sections"][K] ?? null;
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
  const value = config.features[featureName];
  // Features can be boolean or number (like newProductDays), so coerce to boolean
  return typeof value === 'boolean' ? value : !!value;
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
 * Get analytics integrations config (GTM ID, GA ID, etc.)
 */
export function useAnalyticsConfig(): StoreConfig["integrations"]["analytics"] {
  const config = useStoreConfig();
  return config.integrations.analytics;
}

/**
 * Get cookie consent configuration
 */
export function useCookieConsentConfig(): StoreConfig["integrations"]["cookieConsent"] {
  const config = useStoreConfig();
  return config.integrations.cookieConsent;
}

/**
 * Get cookie consent text/translations
 */
export function useCookieConsentText() {
  const config = useStoreConfig();
  return config.content?.cookieConsent ?? {};
}

/**
 * Get WhatsApp Business Chat configuration
 */
export function useWhatsAppConfig() {
  const config = useStoreConfig();
  const number = config.integrations.support.whatsappBusinessNumber;
  return {
    enabled: !!number,
    phoneNumber: number,
    defaultMessage: config.integrations.support.whatsappDefaultMessage,
  };
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
    useSaleorPromotions: false,
    useSaleorVouchers: false,
    items: [] as Array<{
      id: string;
      name: string;
      description?: string | null;
      link?: string | null;
      icon?: string | null;
    }>,
    autoScrollIntervalSeconds: 6,
    useGradient: false,
    gradientFrom: null as string | null,
    gradientTo: null as string | null,
    gradientStops: [] as Array<{ color: string; position: number }>,
    gradientAngle: 90,
    dismissible: false,
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
    const policyFields = [
      "returnPolicyPageTitle", "returnPolicyHeader", "returnPolicyContent", "returnPolicyDefaultContent", "returnPolicyFooter",
      "shippingPolicyPageTitle", "shippingPolicyHeader", "shippingPolicyContent", "shippingPolicyDefaultContent", "shippingPolicyFooter",
      "privacyPolicyPageTitle", "privacyPolicyHeader", "privacyPolicyContent", "privacyPolicyDefaultContent", "privacyPolicyFooter",
      "termsOfServicePageTitle", "termsOfServiceHeader", "termsOfServiceContent", "termsOfServiceDefaultContent", "termsOfServiceFooter",
      "policyPageEmptyMessage",
    ] as const;
    for (const field of policyFields) {
      if (config.footer[field] !== undefined) {
        (merged as Record<string, unknown>)[field] = config.footer[field];
      }
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
 * Get cart display mode from Storefront Control app
 * Returns 'page' (default) or 'drawer'
 */
export function useCartDisplayMode(): 'page' | 'drawer' {
  const config = useStoreConfig();
  return config.storefront?.cart?.displayMode ?? 'page';
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
    hoverEffect: "lift" as const,
    badgePosition: "top-start" as const,
    showBrandLabel: true,
    showRating: true,
    imageFit: "cover" as const,
    textStyles: {
      name: { fontSize: "sm" as const, fontWeight: "semibold" as const, color: null },
      price: { fontSize: "base" as const, fontWeight: "bold" as const, color: null },
      originalPrice: { fontSize: "sm" as const, fontWeight: "normal" as const, color: null },
      reviewCount: { fontSize: "xs" as const, fontWeight: "normal" as const, color: null },
    },
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
  filterSidebar: {
    checkboxAccentColor: null as string | null,
    sectionTitleFontSize: "xs" as const,
    sectionTitleFontWeight: "semibold" as const,
    sectionTitleColor: null as string | null,
    sectionTitleHoverColor: null as string | null,
    chevronColor: null as string | null,
    chevronHoverColor: null as string | null,
    itemTextFontSize: "xs" as const,
    itemTextColor: null as string | null,
    itemCountColor: null as string | null,
    sizeChipSelectedBg: null as string | null,
    sizeChipSelectedText: null as string | null,
    sizeChipSelectedBorder: null as string | null,
    clearAllButtonBg: null as string | null,
    clearAllButtonText: null as string | null,
    clearAllButtonBorder: null as string | null,
    clearAllButtonHoverBg: null as string | null,
    clearAllButtonHoverText: null as string | null,
    priceInputFocusRingColor: null as string | null,
    priceQuickButtonActiveBg: null as string | null,
    priceQuickButtonActiveText: null as string | null,
    mobileShowResultsBg: null as string | null,
    mobileShowResultsText: null as string | null,
  },
  cart: {
    drawerSide: "right" as const,
    showDeleteText: false,
    showSaveForLater: false,
  },
  sectionViewAllButton: {
    style: "pill" as const,
    icon: "chevron" as const,
  },
} as const;

// Default content config
export const DEFAULT_CONTENT_CONFIG = {
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
    eligibleForFreeShipping: "Eligible for free shipping",
    // Order summary
    subtotalLabel: "Subtotal",
    originalSubtotalLabel: "Subtotal",
    youSaveLabel: "You save",
    discountedSubtotalLabel: "Your price",
    shippingNote: "Shipping and taxes calculated at checkout",
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
    // Gift (optional promotion)
    giftLabel: "Free gift (optional)",
    giftRemoveHint: "You can remove it if you don't want it",
    giftAddedMessage: "A free gift has been added to your cart. You can remove it if you don't want it.",
    voucherLabel: "Voucher",
    voucherRemoved: "Voucher removed",
    promoCodeApplied: "Promo code applied",
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
    viewCartLink: "View Cart",
    quickAddButton: "Quick add",
    viewFullPageLink: "View full page",
    loadingProductText: "Loading product...",
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
    // Forgot / reset password
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
    // Verify email page
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
    // Confirm email page (link landing)
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
    invalidEmailError: "Please enter a valid email address. Check the domain and extension (e.g. .com not .comm).",
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
    newsletterAlreadySubscribed: "You're already subscribed to our newsletter!",
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
    viewAllCategoriesButton: "View All Categories",
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
    shopNowButton: "Shop Collection",
    productCountText: "Products",
    // Newsletter
    newsletterEmailPlaceholder: "Enter your email",
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
    businessDaysText: "{min}-{max} business days",
    freeShippingLabel: "Free",
    noDeliveryMethodsText: "No delivery methods available",
    
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
    
    // SSL/Security
    sslEncryptionText: "Secure 256-bit SSL encryption",
    
    // Footer links
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    securityNote: "Protected by SSL encryption • Your payment info is safe",
    // Legacy fields
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
    
    // Search (products page search bar + nav search)
    searchPlaceholder: "Search Products",
    searchClearAriaLabel: "Clear search",
    searchInputAriaLabel: "Search products",
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
    profileUpdated: "Profile updated successfully",
    profileUpdateFailed: "Failed to update profile. Please try again.",
    emailChangePasswordRequired: "Password is required to change your email. We will send a confirmation link to your new address.",
    emailChangeConfirmationSent: "A confirmation link has been sent to your new email address. Please click it to complete the change.",
    emailChangePasswordInvalid: "Password is not valid. Please enter your current account password.",
    profileInvalidEmailError: "Please enter a valid email address. Check the domain and extension (e.g. .com not .comm).",
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
  navbar: {
    selectChannel: "Select channel/currency",
    searchPlaceholder: "Search...",
    searchClearAriaLabel: "Clear search",
    searchInputAriaLabel: "Search products",
    viewAllResultsFor: "View all results for",
    recentlySearchedLabel: "Recent Searches",
    recentSearchesClearLabel: "Clear",
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
  if (!config.ui) return { ...DEFAULT_UI_CONFIG, activeFiltersTags: {}, filterSidebar: { ...DEFAULT_UI_CONFIG.filterSidebar } } as NonNullable<StoreConfig["ui"]>;
  return {
    ...DEFAULT_UI_CONFIG,
    ...config.ui,
    buttons: { ...DEFAULT_UI_CONFIG.buttons, ...config.ui.buttons },
    badges: { ...DEFAULT_UI_CONFIG.badges, ...config.ui.badges },
    inputs: { ...DEFAULT_UI_CONFIG.inputs, ...config.ui.inputs },
    checkbox: { ...DEFAULT_UI_CONFIG.checkbox, ...config.ui.checkbox },
    productCard: {
      ...DEFAULT_UI_CONFIG.productCard,
      ...config.ui.productCard,
      textStyles: {
        name: { ...DEFAULT_UI_CONFIG.productCard.textStyles?.name, ...config.ui.productCard?.textStyles?.name },
        price: { ...DEFAULT_UI_CONFIG.productCard.textStyles?.price, ...config.ui.productCard?.textStyles?.price },
        originalPrice: { ...DEFAULT_UI_CONFIG.productCard.textStyles?.originalPrice, ...config.ui.productCard?.textStyles?.originalPrice },
        reviewCount: { ...DEFAULT_UI_CONFIG.productCard.textStyles?.reviewCount, ...config.ui.productCard?.textStyles?.reviewCount },
      },
    },
    toasts: { ...DEFAULT_UI_CONFIG.toasts, ...config.ui.toasts },
    icons: { ...DEFAULT_UI_CONFIG.icons, ...config.ui.icons },
    filterSidebar: { ...DEFAULT_UI_CONFIG.filterSidebar, ...config.ui.filterSidebar },
    cart: { ...DEFAULT_UI_CONFIG.cart, ...config.ui.cart },
    sectionViewAllButton: { ...DEFAULT_UI_CONFIG.sectionViewAllButton, ...config.ui.sectionViewAllButton },
    activeFiltersTags: config.ui.activeFiltersTags ?? {},
  };
}

export function useSectionViewAllButtonConfig() {
  const ui = useUiConfig();
  return ui.sectionViewAllButton ?? { style: "pill" as const, icon: "chevron" as const };
}

// Default filter sidebar config (with resolved fallback colors)
const DEFAULT_FILTER_SIDEBAR_CONFIG = {
  checkboxAccentColor: "#171717",
  sectionTitleColor: "#171717",
  sectionTitleHoverColor: "#525252",
  chevronColor: "#a3a3a3",
  chevronHoverColor: "#525252",
  itemTextColor: "#262626",
  itemCountColor: "#a3a3a3",
  sizeChipSelectedBg: "#171717",
  sizeChipSelectedText: "#ffffff",
  sizeChipSelectedBorder: "#171717",
  clearAllButtonBg: "#f5f5f5",
  clearAllButtonText: "#525252",
  clearAllButtonBorder: "#e5e5e5",
  clearAllButtonHoverBg: "#e5e5e5",
  clearAllButtonHoverText: "#171717",
  priceQuickButtonActiveText: "#ffffff",
  mobileShowResultsText: "#ffffff",
};

/**
 * Get filter sidebar configuration with fallback colors resolved
 * Colors fall back to sensible neutral defaults when null
 * Price/mobile colors fall back to branding.colors.primary when null
 */
export function useFilterSidebarConfig() {
  const ui = useUiConfig();
  const branding = useBranding();
  const fs = ui.filterSidebar ?? {};
  return {
    checkboxAccentColor: fs.checkboxAccentColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.checkboxAccentColor,
    sectionTitleFontSize: fs.sectionTitleFontSize ?? "xs",
    sectionTitleFontWeight: fs.sectionTitleFontWeight ?? "semibold",
    sectionTitleColor: fs.sectionTitleColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.sectionTitleColor,
    sectionTitleHoverColor: fs.sectionTitleHoverColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.sectionTitleHoverColor,
    chevronColor: fs.chevronColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.chevronColor,
    chevronHoverColor: fs.chevronHoverColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.chevronHoverColor,
    itemTextColor: fs.itemTextColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.itemTextColor,
    itemCountColor: fs.itemCountColor ?? DEFAULT_FILTER_SIDEBAR_CONFIG.itemCountColor,
    sizeChipSelectedBg: fs.sizeChipSelectedBg ?? DEFAULT_FILTER_SIDEBAR_CONFIG.sizeChipSelectedBg,
    sizeChipSelectedText: fs.sizeChipSelectedText ?? DEFAULT_FILTER_SIDEBAR_CONFIG.sizeChipSelectedText,
    sizeChipSelectedBorder: fs.sizeChipSelectedBorder ?? DEFAULT_FILTER_SIDEBAR_CONFIG.sizeChipSelectedBorder,
    clearAllButtonBg: fs.clearAllButtonBg ?? DEFAULT_FILTER_SIDEBAR_CONFIG.clearAllButtonBg,
    clearAllButtonText: fs.clearAllButtonText ?? DEFAULT_FILTER_SIDEBAR_CONFIG.clearAllButtonText,
    clearAllButtonBorder: fs.clearAllButtonBorder ?? DEFAULT_FILTER_SIDEBAR_CONFIG.clearAllButtonBorder,
    clearAllButtonHoverBg: fs.clearAllButtonHoverBg ?? DEFAULT_FILTER_SIDEBAR_CONFIG.clearAllButtonHoverBg,
    clearAllButtonHoverText: fs.clearAllButtonHoverText ?? DEFAULT_FILTER_SIDEBAR_CONFIG.clearAllButtonHoverText,
    priceInputFocusRingColor: fs.priceInputFocusRingColor ?? branding.colors.primary,
    priceQuickButtonActiveBg: fs.priceQuickButtonActiveBg ?? branding.colors.primary,
    priceQuickButtonActiveText: fs.priceQuickButtonActiveText ?? DEFAULT_FILTER_SIDEBAR_CONFIG.priceQuickButtonActiveText,
    mobileShowResultsBg: fs.mobileShowResultsBg ?? branding.colors.primary,
    mobileShowResultsText: fs.mobileShowResultsText ?? DEFAULT_FILTER_SIDEBAR_CONFIG.mobileShowResultsText,
  };
}

/**
 * Get content/text configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useContentConfig(): NonNullable<StoreConfig["content"]> {
  const config = useStoreConfig();
  if (!config.content) return DEFAULT_CONTENT_CONFIG as unknown as NonNullable<StoreConfig["content"]>;
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
export function useOrderTrackingText(): NonNullable<NonNullable<StoreConfig["content"]>["orderTracking"]> {
  const content = useContentConfig();
  return content.orderTracking ?? {
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
  };
}

/**
 * Get contact page text configuration
 */
export function useContactText(): NonNullable<NonNullable<StoreConfig["content"]>["contact"]> {
  const content = useContentConfig();
  return content.contact ?? {
    heroTitle: "Get in Touch",
    heroDescription: "Have a question or need help? We're here for you.",
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
    viewAllFaqs: "View All FAQs",
    followUsTitle: "Follow Us",
    followUsDescription: "Stay connected with us on social media.",
  };
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
// RELATED PRODUCTS CONFIG
// ============================================

// Default related products config
const DEFAULT_RELATED_PRODUCTS_CONFIG = {
  enabled: true,
  strategy: "category" as const,
  maxItems: 8,
  showOnMobile: true,
  title: "You May Also Like",
  subtitle: "Customers also viewed these products",
} as const;

/**
 * Get related products configuration (from Storefront Control app)
 * Always returns a complete config with defaults
 */
export function useRelatedProductsConfig(): NonNullable<StoreConfig["relatedProducts"]> {
  const config = useStoreConfig();
  return { ...DEFAULT_RELATED_PRODUCTS_CONFIG, ...config.relatedProducts };
}

// ============================================
// DESIGN TOKENS HOOK
// ============================================

const DEFAULT_DESIGN_TOKENS = {
  animations: {
    ...ANIMATION_PRESETS.moderate,
    transitionEasing: 'ease-out' as const,
  },
  spacing: {
    sectionPaddingY: 'normal' as const,
    containerMaxWidth: 1440,
    containerPaddingX: 'normal' as const,
    cardGap: 'normal' as const,
  },
  grid: {
    productColumns: { sm: 2, md: 2, lg: 4 },
  },
};

export function useDesignTokens() {
  const config = useStoreConfig();
  const design = config.design;
  if (!design) return DEFAULT_DESIGN_TOKENS;

  const preset = ANIMATION_PRESETS[design.animations.preset] ?? ANIMATION_PRESETS.moderate;
  return {
    animations: {
      cardHoverDuration: design.animations.cardHoverDuration ?? preset.cardHoverDuration,
      cardHoverLift: design.animations.cardHoverLift ?? preset.cardHoverLift,
      imageZoomScale: design.animations.imageZoomScale ?? preset.imageZoomScale,
      imageZoomDuration: design.animations.imageZoomDuration ?? preset.imageZoomDuration,
      buttonHoverScale: design.animations.buttonHoverScale ?? preset.buttonHoverScale,
      transitionEasing: design.animations.transitionEasing ?? 'ease-out' as const,
      sectionRevealDuration: design.animations.sectionRevealDuration ?? preset.sectionRevealDuration,
      marqueeSpeed: design.animations.marqueeSpeed ?? preset.marqueeSpeed,
      heroAutoRotate: design.animations.heroAutoRotate ?? preset.heroAutoRotate,
    },
    spacing: design.spacing,
    grid: design.grid ?? { productColumns: { sm: 2, md: 2, lg: 4 } },
  };
}

// Re-export homepage section types from shared package
export type {
  TrustStripConfig,
  BrandGridConfig,
  CategoriesConfig,
  TrendingConfig,
  PromotionBannerConfig,
  FlashDealsConfig,
  CollectionMosaicConfig,
  BestSellersConfig,
  CustomerFeedbackConfig,
  NewsletterSectionConfig,
};

// ============================================
// HOMEPAGE SECTION HOOKS
// ============================================

/**
 * Get section order for homepage
 * Returns the configured order or default order
 */
export function useSectionOrder() {
  const config = useHomepageConfig();
  return config?.sectionOrder ?? [];
}

// Homepage section hooks — thin wrappers over useHomepageSection for discoverability
export const useHeroConfig = () => useHomepageSection("hero");
export const useTrustStripConfig = () => useHomepageSection("trustStrip") as TrustStripConfig | null;
export const useMarqueeConfig = () => useHomepageSection("marquee");
export const useBrandGridConfig = () => useHomepageSection("brandGrid") as BrandGridConfig | null;
export const useCategoriesConfig = () => useHomepageSection("categories") as CategoriesConfig | null;
export const useTrendingConfig = () => useHomepageSection("trending") as TrendingConfig | null;
export const usePromotionBannerConfig = () => useHomepageSection("promotionBanner") as PromotionBannerConfig | null;
export const useFlashDealsConfig = () => useHomepageSection("flashDeals") as FlashDealsConfig | null;
export const useCollectionMosaicConfig = () => useHomepageSection("collectionMosaic") as CollectionMosaicConfig | null;
export const useBestSellersConfig = () => useHomepageSection("bestSellers") as BestSellersConfig | null;
export const useCustomerFeedbackConfig = () => useHomepageSection("customerFeedback") as CustomerFeedbackConfig | null;
export const useNewsletterSectionConfig = () => useHomepageSection("newsletter") as NewsletterSectionConfig | null;


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
