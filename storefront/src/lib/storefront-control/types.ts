/**
 * StorefrontControlConfig types
 * These match the schema from the storefront-control app
 */

import type { SectionBackgroundConfig } from "@/lib/section-backgrounds";

export type StoreType = "physical" | "digital" | "food" | "services" | "mixed";
export type BorderRadius = "none" | "sm" | "md" | "lg" | "full";
export type ButtonStyle = "solid" | "outline" | "ghost";
export type CardShadow = "none" | "sm" | "md" | "lg";
export type HeroType = "image" | "video" | "slider";
export type TimeFormat = "12h" | "24h";

// Helper types (defined first for use in main interface)
export interface ButtonVariant {
  backgroundColor: string | null;
  textColor: string | null;
  hoverBackgroundColor: string | null;
  borderColor: string | null;
}

export interface BadgeStyle {
  backgroundColor: string | null;
  textColor: string | null;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
}

export interface ToastStyle {
  backgroundColor: string | null;
  textColor: string | null;
  iconColor: string | null;
}

// Quick Filters Navbar Mode Style
export interface QuickFiltersNavbarModeStyle {
  buttonPaddingX?: number;        // px-3.5 (14px)
  buttonPaddingY?: number;        // py-1.5 (6px)
  buttonFontSize?: "xs" | "sm" | "base";
  buttonFontWeight?: "normal" | "medium" | "semibold" | "bold";
  buttonBorderRadius?: "none" | "sm" | "md" | "lg" | "full";
  buttonGap?: number;             // gap-2 (8px)
  groupLabelFontSize?: "xs" | "sm";
  groupLabelPaddingX?: number;    // px-2 (8px)
  groupLabelPaddingY?: number;    // py-1 (4px)
  separatorWidth?: number;        // w-px (1px)
  separatorHeight?: number;       // h-6 (24px)
  containerPaddingY?: number;     // py-2.5 (10px)
  backgroundColor?: string | null;
  borderTopColor?: string | null;
  borderBottomColor?: string | null;
  shadowColor?: string | null;
}

// Quick Filters Style
export interface QuickFiltersStyle {
  cardWidth: number;
  cardHeight: number;
  cardGap: number;
  titleFontSize: "xs" | "sm" | "base" | "lg" | "xl";
  titleFontWeight: "normal" | "medium" | "semibold" | "bold";
  arrowSize: number;
  arrowIconSize: number;
  // Color customization
  titleColor: string | null;
  valueColor: string | null;
  activeValueColor: string | null;
  // Shop All button style
  shopAllButtonBackgroundColor: string | null;
  shopAllButtonTextColor: string | null;
  shopAllButtonHoverBackgroundColor: string | null;
  shopAllButtonBorderColor: string | null;
  // Navbar mode (sticky) styling
  navbarMode?: QuickFiltersNavbarModeStyle;
}

// Active Filters Tags Style
export interface ActiveFiltersTagsStyle {
  containerBackgroundColor?: string | null;
  containerBorderColor?: string | null;
  containerBorderRadius?: "none" | "sm" | "md" | "lg";
  containerPadding?: number;
  containerShadow?: "none" | "sm" | "md" | "lg";
  titleFontSize?: "xs" | "sm" | "base" | "lg";
  titleFontWeight?: "normal" | "medium" | "semibold" | "bold";
  titleColor?: string | null;
  clearAllButtonFontSize?: "xs" | "sm" | "base";
  clearAllButtonFontWeight?: "normal" | "medium" | "semibold" | "bold";
  clearAllButtonColor?: string | null;
  clearAllButtonHoverColor?: string | null;
  tagBackgroundColor?: string | null;
  tagBorderColor?: string | null;
  tagTextColor?: string | null;
  tagHoverBackgroundColor?: string | null;
  tagHoverBorderColor?: string | null;
  tagBorderRadius?: "none" | "sm" | "md" | "lg" | "full";
  tagPaddingX?: number;
  tagPaddingY?: number;
  tagFontSize?: "xs" | "sm" | "base";
  tagFontWeight?: "normal" | "medium" | "semibold" | "bold";
  tagGap?: number;
  removeButtonSize?: number;
  removeButtonColor?: string | null;
  removeButtonHoverBackgroundColor?: string | null;
  removeButtonHoverColor?: string | null;
  removeButtonBorderRadius?: "none" | "sm" | "md" | "lg" | "full";
}

// Filters/Sort/Product List Text
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

  // Sort dropdown
  sortByLabel: string;
  filtersButtonText: string;
  searchForText: string;  // Text between count and search query (e.g., "for")
  resultsText: string;

  // Empty/loading states
  noProductsTitle: string;
  noProductsWithFilters: string;
  noProductsEmpty: string;
  filteringProducts: string;
  loadingMore: string;
  seenAllProducts: string;
  tryAdjustingFilters: string;

  // Search
  searchPlaceholder: string;
  searchProductsTitle: string;
  searchResultsTitle: string;
  resultsCountText: string;
  noResultsMessage: string;

  // Results
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

// Product Detail Page Text
export interface ProductDetailText {
  // Trust badges
  freeShipping: string;
  securePayment: string;
  easyReturns: string;

  // Tab labels
  descriptionTab: string;
  shippingTab: string;
  reviewsTab: string;
  noDescriptionAvailable: string;

  // Product info
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

  // Reviews section
  noReviewsYet: string;
  writeReviewTitle: string;

  // Review form
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

  // Review display
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

// Account Dashboard Text
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

// Orders Page Text
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

// Addresses Page Text
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
  // Form and actions
  addNewAddressTitle: string;
  addAddressDescription: string;
  editButton: string;
  deleteButton: string;
  continueShoppingButton: string;
  startShopping: string;
  cancel: string;
}

// Wishlist Page Text
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
  removeFromWishlistTooltip: string;
  moveToCart: string;
}

// Settings Page Text
export interface SettingsText {
  // Page header
  accountSettings: string;
  settingsSubtitle: string;

  // Profile section
  profileInformation: string;
  updatePersonalDetails: string;
  saveChangesButton: string;
  savingChanges: string;
  changesSaved: string;

  // Password section
  changePassword: string;
  passwordSecurityNote: string;
  currentPassword: string;
  newPasswordLabel: string;
  confirmNewPassword: string;
  updatePasswordButton: string;
  passwordUpdated: string;

  // Notifications section
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

  // Danger zone
  dangerZone: string;
  deleteAccountWarning: string;
  deleteAccountButton: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
}

// Footer Text
export interface FooterText {
  // Legal links
  privacyPolicyLink: string;
  termsOfServiceLink: string;
  shippingLink: string;
  returnPolicyLink: string;

  // Other footer text
  allRightsReserved: string;
  madeWith: string;
  inLocation: string;

  // Contact section
  contactUs: string;
  customerService: string;

  // Navigation sections
  shopTitle: string;
  companyTitle: string;
  supportTitle: string;
  followUsTitle: string;
}

// Navbar Text
export interface NavbarText {
  selectChannel: string;
  searchPlaceholder: string;
  cartLabel: string;
  accountLabel: string;
  menuLabel: string;
  // Mobile navigation
  homeLabel: string;
  shopLabel: string;
}

// Error Page Text
export interface ErrorText {
  title: string;
  description: string;
  errorDetails: string;
  tryAgainButton: string;
  backToHomeButton: string;
  needHelpText: string;
  contactSupportLink: string;
}

// 404 Not Found Page Text
export interface NotFoundText {
  title: string;
  description: string;
  backToHomeButton: string;
  browseProductsButton: string;
  helpfulLinksText: string;
}

export interface StorefrontControlConfig {
  version: number;
  channelSlug: string;

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

  branding: {
    logo: string;
    logoAlt: string;
    favicon: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      success: string;
      warning: string;
      error: string;
    };
    typography: {
      fontHeading: string;
      fontBody: string;
      fontMono: string;
      fontSize?: {
        h1?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        h2?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        h3?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        h4?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        body?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        small?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        button?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
        caption?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
      };
    };
    style: {
      borderRadius: BorderRadius;
      buttonStyle: ButtonStyle;
      cardShadow: CardShadow;
    };
  };

  features: {
    wishlist: boolean;
    compareProducts: boolean;
    productReviews: boolean;
    recentlyViewed: boolean;
    scrollToTop?: boolean;
    guestCheckout: boolean;
    expressCheckout: boolean;
    savePaymentMethods: boolean;
    digitalDownloads: boolean;
    subscriptions: boolean;
    giftCards: boolean;
    productBundles: boolean;
    newsletter: boolean;
    promotionalBanners: boolean;
    abandonedCartEmails: boolean;
    socialLogin: boolean;
    shareButtons: boolean;
    instagramFeed: boolean;
  };

  ecommerce: {
    currency: { default: string; supported: string[] };
    shipping: {
      enabled: boolean;
      freeShippingThreshold: number | null;
      showEstimatedDelivery: boolean;
      deliverySlots: boolean;
    };
    tax: { showPricesWithTax: boolean; taxIncludedInPrice: boolean };
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

  header: {
    banner: {
      enabled: boolean;
      text: string;
      backgroundColor: string | null;
      textColor: string | null;
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
      manualItems?: Array<{ id: string; text: string; link?: string | null; icon?: string | null }>;
      autoScrollIntervalSeconds?: number;
      useGradient?: boolean;
      gradientFrom?: string | null;
      gradientTo?: string | null;
      dismissible?: boolean;
    };
    showStoreName: boolean;
    logoPosition: "left" | "center";
  };

  footer: {
    showBrand: boolean;
    showMenu: boolean;
    showContactInfo: boolean;
    showFooterEmail?: boolean;
    showFooterPhone?: boolean;
    showFooterAddress?: boolean;
    showFooterContactButton?: boolean;
    showNewsletter: boolean;
    showSocialLinks: boolean;
    copyrightText: string | null;
    legalLinks?: {
      trackOrder: { enabled: boolean; url: string };
      privacyPolicy: { enabled: boolean; url: string };
      termsOfService: { enabled: boolean; url: string };
      shippingPolicy: { enabled: boolean; url: string };
      returnPolicy: { enabled: boolean; url: string };
      accessibilityStatement?: { enabled: boolean; url: string };
    };
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
    accessibilityPageTitle?: string;
    accessibilityHeader?: string;
    accessibilityContent?: string;
    accessibilityDefaultContent?: string;
    accessibilityFooter?: string;
    vatStatement?: string;
    showVatStatement?: boolean;
    showBusinessInfo?: boolean;
  };

  homepage: {
    sections: {
      hero: {
        enabled: boolean;
        type: HeroType;
        // Extended content fields
        title?: string;
        subtitle?: string;
        ctaText?: string;
        ctaLink?: string;
        imageUrl?: string | null;
        videoUrl?: string | null;
        overlayOpacity?: number;
        textAlignment?: "left" | "center" | "right";
        slides?: Array<{
          imageUrl: string;
          title: string;
          subtitle: string;
          ctaText: string;
          ctaLink: string;
        }>;
      };
      featuredCategories: {
        enabled: boolean;
        limit: number;
        background?: SectionBackgroundConfig;
      };
      newArrivals: {
        enabled: boolean;
        limit: number;
        background?: SectionBackgroundConfig;
      };
      bestSellers: {
        enabled: boolean;
        limit: number;
        background?: SectionBackgroundConfig;
      };
      onSale: {
        enabled: boolean;
        limit: number;
        background?: SectionBackgroundConfig;
      };
      featuredBrands: {
        enabled: boolean;
        background?: SectionBackgroundConfig;
      };
      testimonials: {
        enabled: boolean;
        background?: SectionBackgroundConfig;
        starColor?: string | null;
        starEmptyColor?: string | null;
        starSize?: "xs" | "sm" | "base" | "lg" | "xl";
        loadingReviewsText?: string | null;
        verifiedPurchaseLabel?: string | null;
        customerLabel?: string | null;
        card?: {
          backgroundColor?: string | null;
          borderColor?: string | null;
          borderRadius?: string | null;
          padding?: string | null;
          shadow?: string | null;
          hoverShadow?: string | null;
          hoverTransform?: string | null;
        };
        trustBadges?: {
          showAverageRating?: boolean;
          showCustomerCount?: boolean;
          showSatisfactionRate?: boolean;
          showOrdersDelivered?: boolean;
          borderColor?: string | null;
          textColor?: string | null;
        };
      };
      newsletter: {
        enabled: boolean;
        background?: SectionBackgroundConfig;
      };
      instagramFeed: {
        enabled: boolean;
        username: string | null;
        background?: SectionBackgroundConfig;
      };
    };
    sectionOrder?: Array<"hero" | "featuredCategories" | "newArrivals" | "bestSellers" | "onSale" | "featuredBrands" | "testimonials" | "newsletter" | "instagramFeed">;
  };

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

  seo: {
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultImage: string;
    twitterHandle: string | null;
  };

  localization: {
    defaultLocale: string;
    supportedLocales: string[];
    dateFormat: string;
    timeFormat: TimeFormat;
    direction?: "ltr" | "rtl" | "auto";
    rtlLocales?: string[];
    drawerSideOverride?: "auto" | "left" | "right";
  };

  darkMode?: {
    enabled: boolean;
    auto: boolean;
    colors?: {
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      border?: string;
      primary?: string;
      secondary?: string;
      accent?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
  };

  filters: {
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

  quickFilters: {
    enabled: boolean;
    showCategories: boolean;
    showCollections: boolean;
    showBrands: boolean;
    categoryLimit: number;
    collectionLimit: number;
    brandLimit: number;
    style?: QuickFiltersStyle;
  };

  promoPopup: {
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
  };

  ui: {
    activeFiltersTags?: ActiveFiltersTagsStyle;
    buttons: {
      borderRadius: BorderRadius;
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
      borderRadius: "none" | "sm" | "md" | "lg";
      borderColor: string | null;
      focusBorderColor: string | null;
      focusRingColor: string | null;
      backgroundColor: string | null;
      placeholderColor: string | null;
    };
    checkbox: {
      checkedBackgroundColor: string | null;
      borderRadius: "none" | "sm" | "md" | "full";
    };
    productCard: {
      borderRadius: "none" | "sm" | "md" | "lg" | "xl";
      shadow: CardShadow;
      hoverShadow: CardShadow | "xl";
      showQuickView: boolean;
      showWishlistButton: boolean;
      showAddToCart: boolean;
      imageAspectRatio: "square" | "portrait" | "landscape";
    };
    toasts: {
      position: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
      borderRadius: "none" | "sm" | "md" | "lg";
      success: ToastStyle;
      error: ToastStyle;
      warning: ToastStyle;
      info: ToastStyle;
    };
    icons: {
      style: "outline" | "solid" | "duotone";
      defaultColor: string | null;
      activeColor: string | null;
    };
  };

  // Storefront UX configuration
  storefront?: {
    cart?: {
      displayMode: 'page' | 'drawer';
    };
  };

  content: {
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
      shippingNote: string;
      viewCartButton: string;
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
      viewAllCategoriesButton: string;
      brandsTitle: string;
      brandsSubtitle: string;
      testimonialsTitle: string;
      testimonialsSubtitle: string;
      // Trust badges labels
      averageRatingLabel: string;
      happyCustomersLabel: string;
      satisfactionRateLabel: string;
      ordersDeliveredLabel: string;
      // Testimonials labels
      verifiedPurchaseLabel: string;
      loadingReviewsText: string;
      noReviewsAvailableText: string;
      noReviewsSubtext: string;
      noApprovedReviewsText: string;
      heroCtaText: string;
      heroSecondaryCtaText: string;
      // Category cards
      shopNowButton: string;
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
      // Footer links (optional for backward compatibility)
      privacyPolicyLinkText?: string;
      termsOfServiceLinkText?: string;
      sslEncryptionMessage?: string;
    };
    filters: FiltersText;
    productDetail: ProductDetailText;
    dashboard: AccountDashboardText;
    orders: OrdersText;
    addresses: AddressesText;
    wishlist: WishlistText;
    settings: SettingsText;
    footer: FooterText;
    navbar: NavbarText;
  };
}
