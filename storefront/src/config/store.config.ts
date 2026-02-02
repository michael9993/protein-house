/**
 * STORE CONFIGURATION
 * ====================
 * This is the central configuration file for your store.
 * Customize these values to adapt the template for any client/store type.
 * 
 * Store Types Supported:
 * - physical: Traditional retail (clothing, electronics, sports gear)
 * - digital: Downloadable products (software, ebooks, music)
 * - food: Food & grocery (restaurants, grocery stores)
 * - services: Service-based (consulting, appointments)
 * - mixed: Combination of above
 */

export type StoreType = 'physical' | 'digital' | 'food' | 'services' | 'mixed';

// Homepage section identifiers
export type HomepageSectionId =
  | 'hero'
  | 'featuredCategories'
  | 'newArrivals'
  | 'bestSellers'
  | 'onSale'
  | 'featuredBrands'
  | 'testimonials'
  | 'newsletter'
  | 'instagramFeed';

// Default section order
export const DEFAULT_SECTION_ORDER: HomepageSectionId[] = [
  'hero',
  'featuredCategories',
  'newArrivals',
  'bestSellers',
  'onSale',
  'featuredBrands',
  'testimonials',
  'newsletter',
  'instagramFeed',
];

// Default RTL locales
export const DEFAULT_RTL_LOCALES = ['he', 'ar', 'fa', 'ur', 'yi', 'ps'];

export interface StoreConfig {
  // ============================================
  // BASIC STORE INFORMATION
  // ============================================
  store: {
    name: string;
    tagline: string;
    type: StoreType;
    description: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };

  // ============================================
  // BRANDING & THEME
  // ============================================
  branding: {
    logo: string;           // Path to logo image
    logoAlt: string;        // Alt text for logo
    favicon: string;        // Path to favicon

    colors: {
      primary: string;      // Main brand color (buttons, links)
      secondary: string;    // Secondary color (headers, accents)
      accent: string;       // Accent color (highlights, badges)
      background: string;   // Page background
      surface: string;      // Card/component background
      text: string;         // Primary text color
      textMuted: string;    // Secondary text color
      success: string;      // Success states
      warning: string;      // Warning states
      error: string;        // Error states
    };

    typography: {
      fontHeading: string;  // Font for headings
      fontBody: string;     // Font for body text
      fontMono: string;     // Font for code/prices
    };

    style: {
      borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
      buttonStyle: 'solid' | 'outline' | 'ghost';
      cardShadow: 'none' | 'sm' | 'md' | 'lg';
    };
  };

  // ============================================
  // FEATURE TOGGLES
  // ============================================
  features: {
    // Customer Features
    wishlist: boolean;
    compareProducts: boolean;
    productReviews: boolean;
    recentlyViewed: boolean;
    scrollToTop: boolean;

    // Checkout Features
    guestCheckout: boolean;
    expressCheckout: boolean;
    savePaymentMethods: boolean;

    // Product Features
    digitalDownloads: boolean;
    subscriptions: boolean;
    giftCards: boolean;
    productBundles: boolean;

    // Marketing Features
    newsletter: boolean;
    promotionalBanners: boolean;
    abandonedCartEmails: boolean;

    // Social Features
    socialLogin: boolean;
    shareButtons: boolean;
    instagramFeed: boolean;

    // Product Page Features
    relatedProducts: boolean;
  };

  // ============================================
  // E-COMMERCE SETTINGS
  // ============================================
  ecommerce: {
    currency: {
      default: string;      // Default currency code (USD, EUR, etc.)
      supported: string[];  // List of supported currencies
    };

    shipping: {
      enabled: boolean;
      freeShippingThreshold: number | null;  // null = no free shipping
      showEstimatedDelivery: boolean;
      deliverySlots: boolean;  // For food/grocery stores
    };

    tax: {
      showPricesWithTax: boolean;
      taxIncludedInPrice: boolean;
    };

    inventory: {
      showStockLevel: boolean;
      lowStockThreshold: number;
      allowBackorders: boolean;
    };

    checkout: {
      minOrderAmount: number | null;
      maxOrderAmount: number | null;
      termsRequired: boolean;
    };
  };

  // ============================================
  // HEADER CONFIGURATION
  // ============================================
  header?: {
    banner: {
      enabled: boolean;
      text: string;
      backgroundColor: string | null;  // null = use primary
      textColor: string | null;        // null = white
      useSaleorPromotions?: boolean;
      useSaleorVouchers?: boolean;
      items?: Array<{
        id: string;
        name: string;
        description?: string | null;
        displayText?: string | null;
        link?: string | null;
        icon?: string | null;
      }>;
      autoScrollIntervalSeconds?: number;
      useGradient?: boolean;
      gradientFrom?: string | null;
      gradientTo?: string | null;
      dismissible?: boolean;
    };
    showStoreName: boolean;
    logoPosition: 'left' | 'center';
  };

  // ============================================
  // FOOTER CONFIGURATION
  // ============================================
  footer?: {
    showBrand: boolean;
    showMenu: boolean;
    showContactInfo: boolean;
    showNewsletter: boolean;
    showSocialLinks: boolean;
    copyrightText: string | null;  // null = use default
    legalLinks?: {
      trackOrder: { enabled: boolean; url: string };
      privacyPolicy: { enabled: boolean; url: string };
      termsOfService: { enabled: boolean; url: string };
      shippingPolicy: { enabled: boolean; url: string };
      returnPolicy: { enabled: boolean; url: string };
    };
    /** Policy page content (Footer → Policy Page Content in Storefront Control). Nothing hardcoded—all from config. */
    returnPolicyPageTitle?: string;
    returnPolicyHeader?: string;
    returnPolicyContent?: string;
    returnPolicyDefaultContent?: string;
    returnPolicyFooter?: string;
    shippingPolicyPageTitle?: string;
    shippingPolicyHeader?: string;
    shippingPolicyContent?: string;
    shippingPolicyDefaultContent?: string;
    shippingPolicyFooter?: string;
    privacyPolicyPageTitle?: string;
    privacyPolicyHeader?: string;
    privacyPolicyContent?: string;
    privacyPolicyDefaultContent?: string;
    privacyPolicyFooter?: string;
    termsOfServicePageTitle?: string;
    termsOfServiceHeader?: string;
    termsOfServiceContent?: string;
    termsOfServiceDefaultContent?: string;
    termsOfServiceFooter?: string;
    policyPageEmptyMessage?: string;
  };

  // ============================================
  // HOMEPAGE SECTIONS
  // ============================================
  homepage: {
    sections: {
      hero: {
        enabled: boolean;
        type: 'image' | 'video' | 'slider';
      };
      featuredCategories: {
        enabled: boolean;
        limit: number;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      newArrivals: {
        enabled: boolean;
        limit: number;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      bestSellers: {
        enabled: boolean;
        limit: number;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      onSale: {
        enabled: boolean;
        limit: number;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      featuredBrands: {
        enabled: boolean;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      testimonials: {
        enabled: boolean;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      newsletter: {
        enabled: boolean;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
      instagramFeed: {
        enabled: boolean;
        username: string | null;
        background?: {
          style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass';
          color?: string | null;
          secondaryColor?: string | null;
          mixPercentage?: number;
          gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
          patternType?: 'grid' | 'dots' | 'lines' | 'waves';
          patternOpacity?: number;
          animationSpeed?: 'slow' | 'normal' | 'fast';
          glassBlur?: number;
          glassOpacity?: number;
        };
      };
    };
    sectionOrder?: HomepageSectionId[]; // Order of sections (defaults to standard order)
  };

  // ============================================
  // PAGES
  // ============================================
  pages: {
    aboutUs: boolean;
    contact: boolean;
    faq: boolean;
    blog: boolean;
    privacyPolicy: boolean;
    termsOfService: boolean;
    shippingPolicy: boolean;
    returnPolicy: boolean;
    forgotPassword: boolean;
    resetPassword: boolean;
    verifyEmail: boolean;
    confirmEmail: boolean;
  };

  // ============================================
  // INTEGRATIONS
  // ============================================
  integrations: {
    analytics: {
      googleAnalyticsId: string | null;
      googleTagManagerId: string | null;
      facebookPixelId: string | null;
      hotjarId: string | null;
    };

    marketing: {
      mailchimpListId: string | null;
      klaviyoApiKey: string | null;
    };

    support: {
      intercomAppId: string | null;
      zendeskKey: string | null;
      crispWebsiteId: string | null;
    };

    social: {
      facebook: string | null;
      instagram: string | null;
      twitter: string | null;
      youtube: string | null;
      tiktok: string | null;
      pinterest: string | null;
    };
  };

  // ============================================
  // SEO DEFAULTS
  // ============================================
  seo: {
    titleTemplate: string;  // e.g., "%s | Store Name"
    defaultTitle: string;
    defaultDescription: string;
    defaultImage: string;   // OG image
    twitterHandle: string | null;
  };

  // ============================================
  // LOCALIZATION
  // ============================================
  localization: {
    defaultLocale: string;
    supportedLocales: string[];
    dateFormat: string;
    timeFormat: '12h' | '24h';
    direction?: 'ltr' | 'rtl' | 'auto'; // Text direction (auto = detect from locale)
    rtlLocales?: string[]; // Custom list of RTL locales (defaults to he, ar, fa, ur, yi, ps)
  };

  // ============================================
  // DARK MODE
  // ============================================
  darkMode?: {
    enabled: boolean;
    auto: boolean; // Follow system preference
    colors?: {
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      border?: string; // Border color for dark mode
      primary?: string;
      secondary?: string;
      accent?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
  };

  // ============================================
  // PRODUCT FILTERS (NEW - from Storefront Control)
  // ============================================
  filters?: {
    enabled: boolean;
    priceFilter: { enabled: boolean; showQuickButtons: boolean };
    ratingFilter: { enabled: boolean };
    brandFilter: { enabled: boolean };
    sizeFilter: { enabled: boolean };
    colorFilter: { enabled: boolean };
    categoryFilter: { enabled: boolean };
    collectionFilter: { enabled: boolean };
    stockFilter: { enabled: boolean };
  };

  // ============================================
  // QUICK FILTERS (NEW - from Storefront Control)
  // ============================================
  quickFilters?: {
    enabled: boolean;
    showCategories: boolean;
    showCollections: boolean;
    showBrands: boolean;
    categoryLimit: number;
    collectionLimit: number;
    brandLimit: number;
    style?: Record<string, unknown>;
  };

  // ============================================
  // PROMO POPUP (NEW - from Storefront Control)
  // ============================================
  promoPopup?: {
    enabled: boolean;
    title: string;
    body: string;
    badge: string | null;
    imageUrl: string | null;
    backgroundImageUrl: string | null;
    ctaText: string;
    ctaLink: string;
    delaySeconds: number;
    showOncePerSession: boolean;
    ttlHours: number;
    excludeCheckout: boolean;
    excludeCart: boolean;
    autoDetectSales: boolean;
    itemsOnSaleText?: string;
    maybeLaterText?: string;
  };

  // ============================================
  // HERO SECTION (Extended - from Storefront Control)
  // ============================================
  heroContent?: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    imageUrl: string | null;
    videoUrl: string | null;
    overlayOpacity: number;
    textAlignment: 'left' | 'center' | 'right';
    slides?: Array<{
      imageUrl: string;
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
    }>;
  };

  // ============================================
  // UI COMPONENTS (NEW - from Storefront Control)
  // ============================================
  ui?: {
    buttons: {
      borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
      primary: ButtonVariant;
      secondary: ButtonVariant;
      outline: ButtonVariant;
      danger: ButtonVariant;
    };
    badges: {
      sale: BadgeStyle;
      new: BadgeStyle;
      outOfStock: BadgeStyle;
      lowStock: BadgeStyle;
      discount: BadgeStyle;
      featured: BadgeStyle;
    };
    inputs: {
      borderRadius: 'none' | 'sm' | 'md' | 'lg';
      borderColor: string | null;
      focusBorderColor: string | null;
      focusRingColor: string | null;
      backgroundColor: string | null;
      placeholderColor: string | null;
    };
    checkbox: {
      checkedBackgroundColor: string | null;
      borderRadius: 'none' | 'sm' | 'md' | 'full';
    };
    productCard: {
      borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
      shadow: 'none' | 'sm' | 'md' | 'lg';
      hoverShadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
      showQuickView: boolean;
      showWishlistButton: boolean;
      showAddToCart: boolean;
      imageAspectRatio: 'square' | 'portrait' | 'landscape';
    };
    toasts: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
      borderRadius: 'none' | 'sm' | 'md' | 'lg';
      success: ToastStyle;
      error: ToastStyle;
      warning: ToastStyle;
      info: ToastStyle;
    };
    icons: {
      style: 'outline' | 'solid' | 'duotone';
      defaultColor: string | null;
      activeColor: string | null;
    };
    activeFiltersTags?: Record<string, unknown>;
    cart?: {
      drawerSide: 'left' | 'right';
      showDeleteText?: boolean;
      showSaveForLater?: boolean;
    };
  };

  // ============================================
  // CONTENT/TEXT (NEW - from Storefront Control)
  // ============================================
  content?: {
    cart: {
      emptyCartTitle: string;
      emptyCartMessage: string;
      cartTitle: string;
      checkoutButton: string;
      continueShoppingButton: string;
      // Selection controls
      selectAllButton: string;
      deselectAllButton: string;
      selectAllItemsButton: string;
      selectItemsToCheckout: string;
      // Free shipping message
      freeShippingMessage: string;
      freeShippingThresholdReached: string;
      addXMoreForFreeShipping: string;
      unlockedFreeShipping: string;
      // Item actions
      saveForLaterButton: string;
      moveToCartButton: string;
      deleteButton: string;
      // Labels and text
      itemSingular: string;
      itemPlural: string;
      orderSummaryTitle: string;
      itemsSelectedText: string;
      eachLabel: string;
      availableLabel: string;
      outOfStockLabel: string;
      // Loading states
      loadingCheckoutTitle: string;
      loadingCheckoutMessage: string;
      // Error messages
      quantityMinError: string;
      onlyXItemsAvailable: string;
      useDeleteButtonMessage: string;
      failedToUpdateQuantity: string;
      onlyXAvailable: string;
      // Success messages
      quantityUpdatedSuccess: string;
      // Promo code section
      promoCodeLabel: string;
      promoCodePlaceholder: string;
      promoCodeApplyButton: string;
      /** Shown when a shipping voucher is applied (eligibility only, not discount amount) */
      eligibleForFreeShipping?: string;
      // Order summary
      subtotalLabel: string;
      subtotalLabelWithCount: string;
      shippingLabel: string;
      shippingFree: string;
      shippingCalculatedAtCheckout: string;
      totalLabel: string;
      // Checkout button states
      selectItemsButton: string;
      preparingCheckout: string;
      loadingCheckout: string;
      // Trust badges
      secureCheckoutText: string;
      sslEncryptedText: string;
      // Payment methods
      acceptedPaymentMethods: string;
      providedByStripe: string;
      // Saved for later
      itemsSavedForLater: string;
      // Additional cart UI fields
      viewCartButton?: string;           // "View Full Cart"
      shippingNote?: string;             // "Shipping and taxes calculated at checkout"
      youSaveLabel?: string;             // "You save"
      originalSubtotalLabel?: string;    // "Subtotal" (before discount)
      discountedSubtotalLabel?: string;  // "Your price" (after discount)
    };
    product: {
      addToCartButton: string;
      buyNowButton: string;
      outOfStockText: string;
      lowStockText: string;
      inStockText: string;
      saleBadgeText: string;
      newBadgeText: string;
      reviewsTitle: string;
      writeReviewButton: string;
      noReviewsText: string;
      // Button states
      addingButton: string;
      addedToCartButton: string;
      selectOptionsButton: string;
      viewCartLink: string;
      // Quick view modal
      quickAddButton?: string;
      viewFullPageLink?: string;
      loadingProductText?: string;
      productDetailsTitle?: string;
      closeButton?: string;
      productNotFoundText?: string;
      errorLoadingProductText?: string;
    };
    account: {
      signInTitle: string;
      signUpTitle: string;
      signInButton: string;
      signUpButton: string;
      signOutButton: string;
      forgotPasswordLink: string;
      myAccountTitle: string;
      ordersTitle: string;
      addressesTitle: string;
      wishlistTitle: string;
      settingsTitle: string;
      // Extended fields for account sidebar
      dashboardTitle: string;
      needHelpTitle: string;
      needHelpDescription: string;
      contactSupportButton: string;
      // Login page text
      signInSubtitle: string;
      signUpSubtitle: string;
      orContinueWith: string;
      whyCreateAccount: string;
      benefitFasterCheckout: string;
      benefitTrackOrders: string;
      benefitWishlist: string;
      benefitDiscounts: string;
      termsAgreement: string;
      termsOfService: string;
      privacyPolicy: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      firstNameLabel: string;
      lastNameLabel: string;
      createAccountButton: string;
      processingText: string;
      emailConfirmedMessage: string;
      canNowSignIn: string;
      switchToSignIn: string;
      accountExistsMessage: string;
      // Forgot / reset password
      forgotPasswordTitle: string;
      forgotPasswordSubtitle: string;
      sendResetLinkButton: string;
      forgotPasswordSuccessMessage: string;
      resetPasswordTitle: string;
      resetPasswordSubtitle: string;
      newPasswordLabel: string;
      newPasswordPlaceholder: string;
      invalidResetLinkMessage: string;
      resetLinkExpiredError: string;
      // Verify email page
      verifyEmailTitle: string;
      verifyEmailSubtitle: string;
      verifyEmailSentTo: string;
      verifyEmailInstructions: string;
      verifyEmailNotReceived: string;
      verifyEmailNotReceivedTitle: string;
      verifyEmailNotReceivedIntro: string;
      verifyEmailCheckSpam: string;
      verifyEmailWaitMinutes: string;
      verifyEmailSignInToResend: string;
      resendConfirmationButton: string;
      resendSendingText: string;
      resendSuccessMessage: string;
      backToSignIn: string;
      signInToResendEmail: string;
      signInFirstToResend: string;
      verifyEmailExpiryHelp: string;
      verifyEmailRequiredError: string;
      // Confirm email page (link landing)
      confirmAccountTitle: string;
      confirmAccountSubtitle: string;
      confirmAccountLinkExpiredError: string;
      confirmAccountRequestNewLink: string;
      confirmAccountUnexpectedError: string;
      confirmAccountAlreadyConfirmed: string;
      confirmAccountEmailLabel: string;
      confirmAccountEmailPlaceholder: string;
      confirmAccountTokenLabel: string;
      confirmAccountTokenPlaceholder: string;
      confirmAccountTokenHint: string;
      confirmAccountButton: string;
      confirmAccountBackToSignIn: string;
      confirmAccountConfirmingText: string;
      confirmAccountSuccessMessage: string;
      confirmAccountCheckingMessage: string;
      confirmAccountAutoLoginHint: string;
      // Error messages
      loginInvalidCredentialsError: string;
      loginEmailPasswordRequiredError: string;
      loginGenericError: string;
      registerEmailPasswordRequiredError: string;
      registerFailedError: string;
      registerAccountExistsError: string;
      registerGenericError: string;
      passwordMismatchError: string;
      passwordTooShortError: string;
      passwordResetRateLimitError: string;
      passwordResetRateLimitInfo: string;
      invalidEmailError: string;
    };
    general: {
      searchPlaceholder: string;
      newsletterTitle: string;
      newsletterDescription: string;
      newsletterButton: string;
      newsletterSuccess: string;
      newsletterPlaceholder: string;
      newsletterNoSpam: string;
      newsletterWeeklyUpdates: string;
      newsletterExclusiveOffers: string;
      newsletterAlreadySubscribed: string;
      newsletterAlreadyActive?: string;
      loadMoreButton: string;
      viewAllButton: string;
      backButton: string;
      closeButton: string;
      saveButton: string;
      cancelButton: string;
      confirmButton: string;
      deleteButton: string;
      editButton: string;
      // Breadcrumbs
      homeLabel: string;
    };
    homepage: {
      newArrivalsTitle: string;
      newArrivalsSubtitle: string;
      bestSellersTitle: string;
      bestSellersSubtitle: string;
      onSaleTitle: string;
      onSaleSubtitle: string;
      featuredTitle: string;
      featuredSubtitle: string;
      categoriesTitle: string;
      categoriesSubtitle: string;
      brandsTitle: string;
      brandsSubtitle: string;
      testimonialsTitle: string;
      testimonialsSubtitle: string;
      averageRatingLabel: string;
      happyCustomersLabel: string;
      satisfactionRateLabel: string;
      ordersDeliveredLabel: string;
      verifiedPurchaseLabel: string;
      loadingReviewsText: string;
      noReviewsAvailableText: string;
      noReviewsSubtext: string;
      noApprovedReviewsText: string;
      heroCtaText: string;
      heroSecondaryCtaText: string;
      watchVideoButton?: string;
      // Category cards
      shopNowButton: string;
      exploreText?: string;
      productCountText: string;
      // Newsletter
      newsletterEmailPlaceholder: string;
    };
    checkout: {
      secureCheckout: string;
      contactDetails: string;
      shippingAddress: string;
      shippingMethod: string;
      paymentMethod: string;
      orderSummary: string;
      placeOrder: string;
      orderConfirmation: string;
      thankYouTitle: string;
      thankYouMessage: string;
      shippingStep?: string;
      paymentStep?: string;
      confirmationStep?: string;
      checkoutTitle?: string;
      privacyPolicy?: string;
      termsOfService?: string;
      securityNote?: string;
      // Footer links (optional for backward compatibility)
      privacyPolicyLinkText?: string;
      termsOfServiceLinkText?: string;
      sslEncryptionMessage?: string;
    };
    filters: FiltersText;
    productDetail: ProductDetailText;
    dashboard: AccountDashboardText;
    orders: OrdersText;
    orderTracking: OrderTrackingText;
    addresses: AddressesText;
    wishlist: WishlistText;
    settings: SettingsText;
    footer: FooterText;
    navbar: NavbarText;
    contact: ContactText;
    error: ErrorText;
    notFound: NotFoundText;
  };

  // ============================================
  // STOREFRONT UX
  // ============================================
  storefront?: {
    cart?: {
      displayMode: 'page' | 'drawer';
    };
  };

  // ============================================
  // RELATED PRODUCTS
  // ============================================
  relatedProducts?: {
    enabled: boolean;
    strategy: 'category' | 'collection';
    maxItems: number;
    showOnMobile: boolean;
    title: string;
    subtitle: string | null;
  };
}

// Contact Page Text defaults
export interface ContactText {
  heroTitle: string;
  heroDescription: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
  formTitle: string;
  formDescription: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabelForm: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  sendButton: string;
  sendingButton: string;
  successTitle: string;
  successDescription: string;
  sendAnotherMessage: string;
  faqsTitle: string;
  faqsDescription: string;
  faqs: Array<{ question: string; answer: string }>;
  viewAllFaqs: string;
  followUsTitle: string;
  followUsDescription: string;
}

// Error Page Text defaults
export interface ErrorText {
  title: string;
  description: string;
  errorDetails: string;
  tryAgainButton: string;
  backToHomeButton: string;
  needHelpText: string;
  contactSupportLink: string;
}

// 404 Not Found Page Text defaults
export interface NotFoundText {
  title: string;
  description: string;
  backToHomeButton: string;
  browseProductsButton: string;
  helpfulLinksText: string;
}

export const DEFAULT_ERROR_TEXT: ErrorText = {
  title: "Something went wrong",
  description: "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
  errorDetails: "Error details",
  tryAgainButton: "Try Again",
  backToHomeButton: "Back to Home",
  needHelpText: "Need help?",
  contactSupportLink: "Contact our support team",
};

export const DEFAULT_NOT_FOUND_TEXT: NotFoundText = {
  title: "Page Not Found",
  description: "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.",
  backToHomeButton: "Back to Home",
  browseProductsButton: "Browse Products",
  helpfulLinksText: "Or check out these pages:",
};

// Filters/Sort/Product List Text type
export interface FiltersText {
  // Section titles
  sectionTitle: string;
  clearAllButton: string;
  showResultsButton: string;

  // Filter headings
  categoryTitle: string;
  collectionTitle: string;
  brandTitle: string;
  sizeTitle: string;
  colorTitle: string;
  priceTitle: string;
  ratingTitle: string;
  availabilityTitle: string;

  // Availability options
  inStockOnly: string;
  onSale: string;

  // Active filters summary
  activeFiltersLabel: string;
  categorySingular: string;
  categoryPlural: string;
  collectionSingular: string;
  collectionPlural: string;
  brandSingular: string;
  brandPlural: string;
  colorSingular: string;
  colorPlural: string;
  sizeSingular: string;
  sizePlural: string;

  // Sort options
  sortAtoZ: string;
  sortZtoA: string;
  sortPriceLowHigh: string;
  sortPriceHighLow: string;
  sortNewest: string;
  sortSale: string;

  // Empty/loading states
  noProductsTitle: string;
  noProductsWithFilters: string;
  noProductsEmpty: string;
  filteringProducts: string;
  loadingMore: string;
  seenAllProducts: string;
  tryAdjustingFilters: string;

  // Search (products page search bar + nav search)
  searchPlaceholder: string;
  searchClearAriaLabel: string;
  searchInputAriaLabel: string;
  searchProductsTitle: string;
  searchResultsTitle: string;
  resultsCountText: string;
  noResultsMessage: string;
  sortByLabel: string;
  filtersButtonText: string;
  searchForText: string;  // Text between count and search query (e.g., "for")

  // Results text
  resultsText: string;
  itemsAvailable: string;
  productsPageTitle: string;
  discoverProducts: string;

  // Quick filters
  shopAllButton: string;
  quickAddButton: string;
  scrollLeftAriaLabel: string;
  scrollRightAriaLabel: string;
  checkOutOurProducts: string;

  // Rating filter
  minimumRating: string;
  starsAndUp: string;
  starAndUp: string;
  clearRatingFilter: string;

  // Price filter
  minPriceLabel: string;
  maxPriceLabel: string;
  quickMinLabel: string;
  quickMaxLabel: string;
  clearPriceFilter: string;
}

// Default filters text configuration
export const DEFAULT_FILTERS_TEXT: FiltersText = {
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
  resultsCountText: "Found {count} result(s)",
  noResultsMessage: "No results found for \"{query}\"",

  // Results text
  resultsText: "results",
  itemsAvailable: "items available",
  productsPageTitle: "All Products",
  discoverProducts: "Discover Products",

  // Sort dropdown
  sortByLabel: "Sort by:",
  filtersButtonText: "Filters",
  searchForText: "for",  // Text between count and search query (e.g., "10 for 'shoes'")

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
};

// Product Detail Text defaults
export interface ProductDetailText {
  freeShipping: string;
  securePayment: string;
  easyReturns: string;
  descriptionTab: string;
  shippingTab: string;
  reviewsTab: string;
  noDescriptionAvailable: string;
  qtyLabel: string;
  qtyLabelWithColon: string;
  shareButton: string;
  // Variant selection labels
  colorLabel: string;
  sizeLabel: string;
  selectOptionLabel: string;
  pleaseSelectSize: string;
  pleaseSelectOption: string;
  // Stock messages
  onlyXLeft: string;
  inStockWithCount: string;
  sellingFast: string;
  savePercent: string;
  // Review pluralization
  reviewSingular: string;
  reviewPlural: string;
  // Image gallery labels
  zoomInLabel: string;
  zoomOutLabel: string;
  previousImageLabel: string;
  nextImageLabel: string;
  noReviewsYet: string;
  writeReviewTitle: string;
  ratingRequired: string;
  reviewTitleRequired: string;
  reviewTitlePlaceholder: string;
  reviewRequired: string;
  reviewPlaceholder: string;
  characterCount: string;
  imagesOptional: string;
  noFileChosen: string;
  uploadImagesHint: string;
  submitReviewButton: string;
  helpfulCount: string;
  helpfulButton: string;
  helpfulButtonWithCount: string;
  verifiedPurchase: string;
  editReview: string;
  deleteReview: string;
  // Review filters
  allRatings: string;
  verifiedOnly: string;
  // Review delete modal
  deleteReviewTitle: string;
  deleteReviewMessage: string;
  cancelButton: string;
  deletingButton: string;
  // Review time formatting
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  // Shipping information
  freeStandardShippingTitle: string;
  freeStandardShippingDescription: string;
  expressShippingTitle: string;
  expressShippingDescription: string;
  // Review list and loading states
  loadingReviews: string;
  reviewCountText: string;
  noReviewsMatchFilters: string;
  clearFilters: string;
  clearFiltersLowercase: string;
  tryAgain: string;
  failedToLoadReviews: string;
  loadMoreReviews: string;
  starsLabel: string;
  // Review form labels (for edit form)
  ratingLabel: string;
  titleLabel: string;
  reviewLabel: string;
  // Review form states and messages
  uploadingImages: string;
  savingButton: string;
  saveButton: string;
  submittingButton: string;
  thankYouMessage: string;
  reviewSubmittedMessage: string;
  // Review form validation messages
  pleaseSelectRating: string;
  pleaseEnterReviewTitle: string;
  pleaseEnterReviewBody: string;
  maxImagesError: string;
  onlyXMoreImagesError: string;
  failedToSubmitReview: string;
  failedToSubmitReviewRetry: string;
  mustBeLoggedInToReview: string;
  failedToUpdateReview: string;
  failedToDeleteReview: string;
  failedToUploadImages: string;
}

export const DEFAULT_PRODUCT_DETAIL_TEXT: ProductDetailText = {
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
};

// Account Dashboard Text defaults
export interface AccountDashboardText {
  totalOrders: string;
  wishlistItems: string;
  savedAddresses: string;
  memberSince: string;
  welcomeBack: string;
  welcomeBackMessage: string;
  accountSummary: string;
  recentOrders: string;
  viewAllButton: string;
  viewButton: string;
  orderLabel: string;
  orderNumberPrefix: string;
  noOrdersYet: string;
  whenYouPlaceOrder: string;
  noRecentOrders: string;
  startShopping: string;
}

export const DEFAULT_ACCOUNT_DASHBOARD_TEXT: AccountDashboardText = {
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
};

// Orders Page Text defaults
export interface OrdersText {
  myOrdersTitle: string;
  ordersPlacedCount: string;
  orderNumber: string;
  orderLabel: string;
  orderNumberPrefix: string;
  datePlaced: string;
  totalLabel: string;
  getInvoice: string;
  downloadInvoice: string;
  viewDetails: string;
  trackPackage: string;
  buyAgain: string;
  showAllOrders: string;
  showLess: string;
  ordersPlaced: string;
  noOrders: string;
  noOrdersMessage: string;
  noOrdersYetMessage: string;
  orderStatus: string;
  trackOrder: string;
  qtyLabel: string;
  remainingItems: string;
  generatingInvoice: string;
  generateDownloadInvoice: string;
  invoiceAvailable: string;
  invoiceAvailableMessage: string;
  invoicePending: string;
  invoicePendingMessage: string;
  invoiceWillBeGenerated: string;
  needInvoiceSooner: string;
  close: string;
  invoiceModalTitle: string;
  trackingModalTitle: string;
  trackingNumberLabel: string;
  statusLabel: string;
  trackPackageDescription: string;
  universalTrackers: string;
  directCarrierLinks: string;
  loading: string;
  // Order Details Page
  backToOrders: string;
  placedOn: string;
  orderItemsTitle: string;
  viewProduct: string;
  orderSummaryTitle: string;
  subtotalLabel: string;
  shippingLabel: string;
  shippingFree: string;
  totalLabelDetails: string;
  shippingAddressTitle: string;
  billingAddressTitle: string;
  shipmentTrackingTitle: string;
  statusLabelDetails: string;
  trackingNumberLabelDetails: string;
  invoiceTitle: string;
  invoiceNumberPrefix: string;
  downloadButton: string;
  generatingText: string;
  unavailableText: string;
  quickActionsTitle: string;
  needHelpTitle: string;
  contactSupportButton: string;
  viewFaqsButton: string;
  // Order Status Labels
  statusProcessing: string;
  statusPartiallyShipped: string;
  statusShipped: string;
  statusDelivered: string;
  statusCanceled: string;
  statusReturned: string;
  // Payment Status Labels
  paymentPending: string;
  paymentPartiallyPaid: string;
  paymentPaid: string;
  paymentPartiallyRefunded: string;
  paymentRefunded: string;
  paymentFailed: string;
  paymentCancelled: string;
  // Reorder Button
  reorderItems: string;
  addingToCart: string;
  itemsAddedToCart: string;
  redirectingToCart: string;
  tryAgain: string;
}

export const DEFAULT_ORDERS_TEXT: OrdersText = {
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
};

// Order Tracking Page Text defaults
export interface OrderTrackingText {
  title: string;
  description: string;
  orderNumberLabel: string;
  orderNumberPlaceholder: string;
  orderNumberHelp: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHelp: string;
  trackButton: string;
  trackingButton: string;
  errorNotFound: string;
  errorGeneric: string;
  backToTracking: string;
  orderFoundTitle: string;
  createAccountTitle: string;
  createAccountDescription: string;
  createAccountButton: string;
  needHelpText: string;
  contactSupportLink: string;
}

export const DEFAULT_ORDER_TRACKING_TEXT: OrderTrackingText = {
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

// Addresses Page Text defaults
export interface AddressesText {
  myAddresses: string;
  addressesCount: string;
  noAddressesYet: string;
  addAddressButton: string;
  defaultShipping: string;
  defaultBilling: string;
  shippingAndBilling: string;
  shippingAddress: string;
  billingAddress: string;
  savedAddress: string;
  setAsDefault: string;
  noAddresses: string;
  noAddressesMessage: string;
  noAddressesCheckoutMessage: string;
  addNewAddressTitle: string;
  addAddressDescription: string;
  editButton: string;
  deleteButton: string;
  continueShoppingButton: string;
  startShopping: string;
  cancel: string;
}

export const DEFAULT_ADDRESSES_TEXT: AddressesText = {
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
};

// Wishlist Page Text defaults
export interface WishlistText {
  myWishlistTitle: string;
  itemsCount: string;
  loadingWishlist: string;
  emptyWishlistTitle: string;
  emptyWishlistMessage: string;
  discoverProductsButton: string;
  clearAllButton: string;
  itemsSaved: string;
  viewProduct: string;
  viewDetails: string;
  outOfStock: string;
  addedOn: string;
  removeFromWishlist: string;
  moveToCart: string;
  removeFromWishlistTooltip: string;
}

export const DEFAULT_WISHLIST_TEXT: WishlistText = {
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
};

// Settings Page Text defaults
export interface SettingsText {
  accountSettings: string;
  settingsSubtitle: string;
  profileInformation: string;
  updatePersonalDetails: string;
  saveChangesButton: string;
  savingChanges: string;
  changesSaved: string;
  profileUpdated: string;
  profileUpdateFailed: string;
  emailChangePasswordRequired: string;
  emailChangeConfirmationSent: string;
  emailChangePasswordInvalid: string;
  profileInvalidEmailError: string;
  changePassword: string;
  passwordSecurityNote: string;
  currentPassword: string;
  newPasswordLabel: string;
  confirmNewPassword: string;
  updatePasswordButton: string;
  passwordUpdated: string;
  passwordUpdateFailed: string;
  notificationPreferences: string;
  notificationSubtitle: string;
  orderUpdates: string;
  orderUpdatesDesc: string;
  promotionsOffers: string;
  promotionsDesc: string;
  newsletterSetting: string;
  newsletterDesc: string;
  smsNotifications: string;
  smsDesc: string;
  dangerZone: string;
  deleteAccountWarning: string;
  deleteAccountButton: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
}

export const DEFAULT_SETTINGS_TEXT: SettingsText = {
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
};

// Footer Text defaults
export interface FooterText {
  privacyPolicyLink: string;
  termsOfServiceLink: string;
  shippingLink: string;
  returnPolicyLink: string;
  allRightsReserved: string;
  madeWith: string;
  inLocation: string;
  contactUs: string;
  contactUsButton: string;
  customerService: string;
  shopTitle: string;
  companyTitle: string;
  supportTitle: string;
  followUsTitle: string;
  trackOrderLink: string;
}

export const DEFAULT_FOOTER_TEXT: FooterText = {
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
};

// Navbar Text defaults
export interface NavbarText {
  selectChannel: string;
  searchPlaceholder: string;
  searchClearAriaLabel?: string;
  searchInputAriaLabel?: string;
  viewAllResultsFor?: string;
  recentlySearchedLabel?: string;
  recentSearchesClearLabel?: string;
  cartLabel: string;
  accountLabel: string;
  menuLabel: string;
  signInText: string;
  /** Mobile menu drawer position: "left" or "right" (from Storefront Control) */
  mobileNavPosition?: "left" | "right";
  /** Dropdown arrow direction when collapsed: "up", "down", "left", "right", or "auto" (from Storefront Control) */
  dropdownArrowDirection?: "up" | "down" | "left" | "right" | "auto";
  /** Dropdown arrow direction when expanded (e.g. "down" for account menu) */
  dropdownArrowDirectionExpanded?: "up" | "down" | "left" | "right" | "auto";
  // Mobile navigation
  homeLabel: string;
  shopLabel: string;
  categoriesLabel?: string;
  collectionsLabel?: string;
  brandsLabel?: string;
  viewAllProducts?: string;
  shopAllButton?: string;
  subcategoriesSide?: string;
  saleButton?: string;
}

export const DEFAULT_NAVBAR_TEXT: NavbarText = {
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
  mobileNavPosition: "right",
  dropdownArrowDirection: "auto",
  dropdownArrowDirectionExpanded: "down",
  // Mobile navigation
  homeLabel: "Home",
  shopLabel: "Shop",
};

// Helper types for UI config
interface ButtonVariant {
  backgroundColor: string | null;
  textColor: string | null;
  hoverBackgroundColor: string | null;
  borderColor: string | null;
}

interface BadgeStyle {
  backgroundColor: string | null;
  textColor: string | null;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

interface ToastStyle {
  backgroundColor: string | null;
  textColor: string | null;
  iconColor: string | null;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================
// This is the template default - customize for each client
export const defaultStoreConfig: StoreConfig = {
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
      primary: "#2563EB",      // Blue
      secondary: "#1F2937",    // Dark gray
      accent: "#F59E0B",       // Amber
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
      backgroundColor: null,
      textColor: null,
      useSaleorPromotions: false,
      useSaleorVouchers: false,
      items: [],
      autoScrollIntervalSeconds: 6,
      useGradient: false,
      gradientFrom: null,
      gradientTo: null,
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
    copyrightText: null,
    legalLinks: {
      trackOrder: { enabled: true, url: "/track-order" },
      privacyPolicy: { enabled: true, url: "/pages/privacy-policy" },
      termsOfService: { enabled: true, url: "/pages/terms-of-service" },
      shippingPolicy: { enabled: true, url: "/pages/shipping-policy" },
      returnPolicy: { enabled: true, url: "/pages/return-policy" },
    },
  },

  homepage: {
    sections: {
      hero: { enabled: true, type: "image" },
      featuredCategories: { enabled: true, limit: 6 },
      newArrivals: { enabled: true, limit: 8 },
      bestSellers: { enabled: true, limit: 8 },
      onSale: {
        enabled: true,
        limit: 4,
        // Default sale section background (color-mix like before)
        background: {
          style: "color-mix",
          mixPercentage: 8,
        },
      },
      featuredBrands: { enabled: false },
      testimonials: { enabled: true },
      newsletter: { enabled: true },
      instagramFeed: {
        enabled: false,
        username: null,
        background: {
          style: "color-mix" as const,
          color: null,
          secondaryColor: null,
          mixPercentage: 8,
        },
      },
    },
    sectionOrder: DEFAULT_SECTION_ORDER,
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
    direction: "auto",
    rtlLocales: DEFAULT_RTL_LOCALES,
  },

  darkMode: {
    enabled: false,
    auto: true,
    colors: {
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f8fafc",
      textMuted: "#94a3b8",
    },
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
    body: "Don't miss out on our biggest sale of the season!",
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

  content: {
    cart: {
      emptyCartTitle: "Your cart is empty",
      emptyCartMessage: "Looks like you haven't added anything yet",
      cartTitle: "Shopping Cart",
      checkoutButton: "Proceed to Checkout",
      continueShoppingButton: "Continue Shopping",
      // Selection controls
      selectAllButton: "Select All",
      deselectAllButton: "Deselect All",
      selectAllItemsButton: "Select all items",
      selectItemsToCheckout: "Select items to proceed to checkout",
      // Free shipping message
      freeShippingMessage: "Add {amount} more for free shipping",
      freeShippingThresholdReached: "You've qualified for free shipping!",
      addXMoreForFreeShipping: "Add {amount} more for FREE shipping!",
      unlockedFreeShipping: "You've unlocked FREE shipping!",
      // Item actions
      saveForLaterButton: "Save for Later",
      moveToCartButton: "Move to Cart",
      deleteButton: "Delete",
      // Labels and text
      itemSingular: "item",
      itemPlural: "items",
      orderSummaryTitle: "Order Summary",
      itemsSelectedText: "{count} {singular|plural} selected",
      eachLabel: "each",
      availableLabel: "available",
      outOfStockLabel: "Out of stock",
      // Loading states
      loadingCheckoutTitle: "Loading Checkout...",
      loadingCheckoutMessage: "Please wait while we prepare your checkout",
      // Error messages
      quantityMinError: "Quantity must be at least 1",
      onlyXItemsAvailable: "Only {count} items available in stock",
      useDeleteButtonMessage: "Use the Delete button to remove items from cart",
      failedToUpdateQuantity: "Failed to update quantity",
      onlyXAvailable: "Only {count} available",
      // Success messages
      quantityUpdatedSuccess: "Quantity updated!",
      // Promo code section
      promoCodeLabel: "Promo Code",
      promoCodePlaceholder: "Enter code",
      promoCodeApplyButton: "Apply",
      eligibleForFreeShipping: "Eligible for free shipping",
      // Order summary
      subtotalLabel: "Subtotal",
      subtotalLabelWithCount: "Subtotal ({count} items)",
      shippingLabel: "Shipping",
      shippingFree: "Free",
      shippingCalculatedAtCheckout: "Calculated at checkout",
      totalLabel: "Total",
      // Checkout button states
      selectItemsButton: "Select items to checkout",
      preparingCheckout: "Preparing checkout...",
      loadingCheckout: "Loading...",
      // Trust badges
      secureCheckoutText: "Secure Checkout",
      sslEncryptedText: "SSL encrypted",
      // Payment methods
      acceptedPaymentMethods: "We accept major credit cards",
      providedByStripe: "Payments powered by Stripe",
      // Saved for later
      itemsSavedForLater: "Saved for later",
      // Additional cart UI fields
      viewCartButton: "View Full Cart",
      shippingNote: "Shipping and taxes calculated at checkout",
      youSaveLabel: "You save",
      originalSubtotalLabel: "Subtotal",
      discountedSubtotalLabel: "Your price",
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
      noReviewsText: "No reviews yet. Be the first!",
      // Button states
      addingButton: "Adding...",
      addedToCartButton: "Added to Cart!",
      selectOptionsButton: "Select Options",
      viewCartLink: "View Cart →",
      quickAddButton: "Quick add",
      viewFullPageLink: "View full page",
      loadingProductText: "Loading product...",
      productDetailsTitle: "Product Details",
      closeButton: "Close",
      productNotFoundText: "Product not found",
      errorLoadingProductText: "Failed to load product",
    },
    account: {
      signInTitle: "Sign In",
      signUpTitle: "Create Account",
      signInButton: "Sign In",
      signUpButton: "Create Account",
      signOutButton: "Sign Out",
      forgotPasswordLink: "Forgot Password?",
      myAccountTitle: "My Account",
      ordersTitle: "My Orders",
      addressesTitle: "My Addresses",
      wishlistTitle: "Wishlist",
      settingsTitle: "Settings",
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
      newsletterDescription: "Get the latest updates and deals",
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
      // Breadcrumbs
      homeLabel: "Home",
    },
    homepage: {
      newArrivalsTitle: "New Arrivals",
      newArrivalsSubtitle: "Check out what's new",
      bestSellersTitle: "Best Sellers",
      bestSellersSubtitle: "Our most popular products",
      onSaleTitle: "On Sale",
      onSaleSubtitle: "Don't miss these deals",
      featuredTitle: "Featured Products",
      featuredSubtitle: "Hand-picked for you",
      categoriesTitle: "Shop by Category",
      categoriesSubtitle: "Browse our collections",
      brandsTitle: "Top Brands",
      brandsSubtitle: "Shop by brand",
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
      heroSecondaryCtaText: "Learn More",
      watchVideoButton: "Watch Video",
      // Category cards
      shopNowButton: "Shop Now",
      exploreText: "Explore",
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
      orderConfirmation: "Order Confirmed!",
      thankYouTitle: "Thank you for your order!",
      thankYouMessage: "We've received your order and will send you a confirmation email shortly.",
      // Footer links
      privacyPolicyLinkText: "Privacy Policy",
      termsOfServiceLinkText: "Terms of Service",
      sslEncryptionMessage: "Protected by SSL encryption • Your payment info is safe",
    },
    contact: {
      heroTitle: "Contact Us",
      heroDescription: "We'd love to hear from you. Send us a message and we'll respond as soon as we can.",
      emailLabel: "Email",
      phoneLabel: "Phone",
      addressLabel: "Address",
      formTitle: "Send a Message",
      formDescription: "Fill out the form below and we'll get back to you within 24 hours.",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabelForm: "Email",
      emailPlaceholder: "you@example.com",
      subjectLabel: "Subject",
      subjectPlaceholder: "How can we help?",
      messageLabel: "Message",
      messagePlaceholder: "Your message...",
      sendButton: "Send Message",
      sendingButton: "Sending...",
      successTitle: "Message Sent!",
      successDescription: "Thank you for reaching out. We'll get back to you soon.",
      sendAnotherMessage: "Send another message",
      faqsTitle: "Frequently Asked Questions",
      faqsDescription: "Quick answers to common questions.",
      faqs: [
        { question: "What are your shipping times?", answer: "Most orders ship within 24 hours. Standard delivery takes 3-5 business days." },
        { question: "How can I track my order?", answer: "Use the Track Order page and enter your order number and email." },
        { question: "What is your return policy?", answer: "Items can be returned within 30 days in original condition." },
      ],
      viewAllFaqs: "View all FAQs",
      followUsTitle: "Follow Us",
      followUsDescription: "Stay connected on social media.",
    },
    filters: DEFAULT_FILTERS_TEXT,
    productDetail: DEFAULT_PRODUCT_DETAIL_TEXT,
    dashboard: DEFAULT_ACCOUNT_DASHBOARD_TEXT,
    orders: DEFAULT_ORDERS_TEXT,
    orderTracking: DEFAULT_ORDER_TRACKING_TEXT,
    addresses: DEFAULT_ADDRESSES_TEXT,
    wishlist: DEFAULT_WISHLIST_TEXT,
    settings: DEFAULT_SETTINGS_TEXT,
    footer: DEFAULT_FOOTER_TEXT,
    navbar: DEFAULT_NAVBAR_TEXT,
    error: DEFAULT_ERROR_TEXT,
    notFound: DEFAULT_NOT_FOUND_TEXT,
  },
};

// ============================================
// STORE TYPE PRESETS
// ============================================
// Quick configurations for different store types

export const storeTypePresets: Record<StoreType, Partial<StoreConfig>> = {
  physical: {
    // Standard retail - default config works
  },

  digital: {
    features: {
      wishlist: true,
      compareProducts: false,
      productReviews: true,
      recentlyViewed: true,
      scrollToTop: true,
      guestCheckout: true,
      expressCheckout: true,
      savePaymentMethods: true,
      digitalDownloads: true,
      subscriptions: true,
      giftCards: true,
      productBundles: true,
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: true,
      instagramFeed: false,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD", "EUR", "GBP"] },
      shipping: {
        enabled: false,  // No shipping for digital
        freeShippingThreshold: null,
        showEstimatedDelivery: false,
        deliverySlots: false,
      },
      tax: { showPricesWithTax: true, taxIncludedInPrice: true },
      inventory: { showStockLevel: false, lowStockThreshold: 0, allowBackorders: true },
      checkout: { minOrderAmount: null, maxOrderAmount: null, termsRequired: true },
    },
  },

  food: {
    features: {
      wishlist: false,
      compareProducts: false,
      productReviews: true,
      recentlyViewed: true,
      scrollToTop: true,
      guestCheckout: true,
      expressCheckout: true,
      savePaymentMethods: true,
      digitalDownloads: false,
      subscriptions: true,  // Meal subscriptions
      giftCards: true,
      productBundles: true,  // Meal combos
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: false,
      instagramFeed: true,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD"] },
      shipping: {
        enabled: true,
        freeShippingThreshold: 30,
        showEstimatedDelivery: true,
        deliverySlots: true,  // Time slot delivery
      },
      tax: { showPricesWithTax: true, taxIncludedInPrice: true },
      inventory: { showStockLevel: true, lowStockThreshold: 10, allowBackorders: false },
      checkout: { minOrderAmount: 15, maxOrderAmount: 500, termsRequired: true },
    },
  },

  services: {
    features: {
      wishlist: false,
      compareProducts: false,
      productReviews: true,
      recentlyViewed: false,
      scrollToTop: true,
      guestCheckout: false,  // Require account for services
      expressCheckout: false,
      savePaymentMethods: true,
      digitalDownloads: false,
      subscriptions: true,
      giftCards: true,
      productBundles: true,  // Service packages
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: true,
      instagramFeed: false,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD", "EUR"] },
      shipping: {
        enabled: false,
        freeShippingThreshold: null,
        showEstimatedDelivery: false,
        deliverySlots: true,  // Appointment slots
      },
      tax: { showPricesWithTax: true, taxIncludedInPrice: true },
      inventory: { showStockLevel: false, lowStockThreshold: 0, allowBackorders: true },
      checkout: { minOrderAmount: null, maxOrderAmount: null, termsRequired: true },
    },
  },

  mixed: {
    // Enable everything for mixed stores
    features: {
      wishlist: true,
      compareProducts: true,
      productReviews: true,
      recentlyViewed: true,
      scrollToTop: true,
      guestCheckout: true,
      expressCheckout: true,
      savePaymentMethods: true,
      digitalDownloads: true,
      subscriptions: true,
      giftCards: true,
      productBundles: true,
      newsletter: true,
      promotionalBanners: true,
      abandonedCartEmails: true,
      socialLogin: true,
      shareButtons: true,
      instagramFeed: true,
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Merge default config with store type preset and custom overrides
 */
export function createStoreConfig(
  storeType: StoreType,
  customConfig: Partial<StoreConfig> = {}
): StoreConfig {
  const preset = storeTypePresets[storeType];

  return {
    ...defaultStoreConfig,
    ...preset,
    ...customConfig,
    store: {
      ...defaultStoreConfig.store,
      ...(preset as any)?.store,
      ...customConfig.store,
      type: storeType,
    },
    branding: {
      ...defaultStoreConfig.branding,
      ...(preset as any)?.branding,
      ...customConfig.branding,
      colors: {
        ...defaultStoreConfig.branding.colors,
        ...(preset as any)?.branding?.colors,
        ...customConfig.branding?.colors,
      },
    },
    features: {
      ...defaultStoreConfig.features,
      ...(preset as any)?.features,
      ...customConfig.features,
    },
    ecommerce: {
      ...defaultStoreConfig.ecommerce,
      ...(preset as any)?.ecommerce,
      ...customConfig.ecommerce,
      shipping: {
        ...defaultStoreConfig.ecommerce.shipping,
        ...(preset as any)?.ecommerce?.shipping,
        ...customConfig.ecommerce?.shipping,
      },
    },
  } as StoreConfig;
}

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get CSS variables from store config
 */
export function getThemeCSSVariables(config: StoreConfig): Record<string, string> {
  const { colors, typography, style } = config.branding;

  const radiusMap = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  };

  // Derive hover and focus colors from primary
  const primaryRgb = hexToRgb(colors.primary);
  const primaryHover = darkenColor(colors.primary, 10);
  const primaryFocusRing = primaryRgb
    ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`
    : `${colors.primary}33`;
  const primaryLight = primaryRgb
    ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`
    : `${colors.primary}1a`;

  return {
    // Base colors
    '--store-primary': colors.primary,
    '--store-primary-hover': primaryHover,
    '--store-primary-focus-ring': primaryFocusRing,
    '--store-primary-light': primaryLight,
    '--store-secondary': colors.secondary,
    '--store-accent': colors.accent,
    '--store-bg': colors.background,
    '--store-surface': colors.surface,
    '--store-text': colors.text,
    '--store-text-muted': colors.textMuted,
    '--store-success': colors.success,
    '--store-warning': colors.warning,
    '--store-error': colors.error,
    // Typography
    '--store-font-heading': typography.fontHeading,
    '--store-font-body': typography.fontBody,
    '--store-font-mono': typography.fontMono,
    // Style
    '--store-radius': radiusMap[style.borderRadius],
    // Button specific (for consistent styling)
    '--store-btn-bg': colors.primary,
    '--store-btn-hover-bg': primaryHover,
    '--store-btn-text': '#FFFFFF',
  };
}

