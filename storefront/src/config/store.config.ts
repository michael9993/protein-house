/**
 * STORE CONFIGURATION
 * ====================
 * Types imported from @saleor/apps-storefront-config (shared package).
 * This file contains runtime defaults, presets, and helper functions.
 */

// Import types from shared package (single source of truth)
import type {
  StorefrontConfig,
  StoreType as StoreTypeImport,
  HomepageSectionId as HomepageSectionIdImport,
  FiltersText,
  ProductDetailText,
  AccountDashboardText,
  OrdersText,
  OrderTrackingText,
  ContactText,
  AddressesText,
  WishlistText,
  SettingsText,
  FooterText,
  NavbarText,
  ErrorText,
  NotFoundText,
} from "@saleor/apps-storefront-config";

// Import and re-export runtime constants
import {
  DEFAULT_SECTION_ORDER,
  DEFAULT_RTL_LOCALES,
} from "@saleor/apps-storefront-config";
export { DEFAULT_SECTION_ORDER, DEFAULT_RTL_LOCALES };

// Backward-compatible alias: storefront code uses 'StoreConfig' everywhere
export type StoreConfig = StorefrontConfig;
export type StoreType = StoreTypeImport;
export type HomepageSectionId = HomepageSectionIdImport;

// Re-export text types so existing imports keep working
export type {
  FiltersText,
  ProductDetailText,
  AccountDashboardText,
  OrdersText,
  OrderTrackingText,
  ContactText,
  AddressesText,
  WishlistText,
  SettingsText,
  FooterText,
  NavbarText,
  ErrorText,
  NotFoundText,
};

// ============================================
// DESIGN TOKEN PRESETS
// ============================================

export const ANIMATION_PRESETS = {
  none:     { cardHoverDuration: 0,   cardHoverLift: 0, imageZoomScale: 1.0,  imageZoomDuration: 0,    buttonHoverScale: 1.0,  sectionRevealDuration: 0,    marqueeSpeed: 32, heroAutoRotate: 0 },
  subtle:   { cardHoverDuration: 200, cardHoverLift: 1, imageZoomScale: 1.03, imageZoomDuration: 500,  buttonHoverScale: 1.02, sectionRevealDuration: 500,  marqueeSpeed: 40, heroAutoRotate: 6 },
  moderate: { cardHoverDuration: 300, cardHoverLift: 2, imageZoomScale: 1.05, imageZoomDuration: 700,  buttonHoverScale: 1.05, sectionRevealDuration: 700,  marqueeSpeed: 32, heroAutoRotate: 4 },
  dramatic: { cardHoverDuration: 500, cardHoverLift: 4, imageZoomScale: 1.10, imageZoomDuration: 1000, buttonHoverScale: 1.08, sectionRevealDuration: 1000, marqueeSpeed: 24, heroAutoRotate: 3 },
} as const;

export const SPACING_PRESETS = {
  compact:  { sectionPaddingY: '3rem' },   // py-12
  normal:   { sectionPaddingY: '5rem' },   // py-20
  spacious: { sectionPaddingY: '7rem' },   // py-28
} as const;

export const CONTAINER_PX_MAP = {
  tight:  '1rem',    // px-4
  normal: '1.5rem',  // px-6
  wide:   '3rem',    // px-12
} as const;

export const CARD_GAP_MAP = {
  tight:    '0.75rem',  // gap-3
  normal:   '1.5rem',   // gap-6
  spacious: '2rem',     // gap-8
} as const;

// Storefront-only types (not in shared schema)
export interface CardConfig {
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide';
  imageFit?: 'cover' | 'contain' | 'fill';
  textSize?: 'sm' | 'base' | 'lg' | 'xl';
  textColor?: string | null;
  textPosition?: 'center' | 'bottom-left' | 'bottom-center';
  backgroundColor?: string | null;
  opacity?: number;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

// ============================================
// DEFAULT TEXT CONSTANTS
// ============================================

export const DEFAULT_ERROR_TEXT: ErrorText = {
  title: "Something went wrong",
  description: "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
  errorDetails: "Error details",
  tryAgainButton: "Try Again",
  backToHomeButton: "Back to Home",
  needHelpText: "Need help?",
  contactSupportLink: "Contact our support team",
  contactSupportUrl: "/contact",
  errorCode: "Error",
};

export const DEFAULT_NOT_FOUND_TEXT: NotFoundText = {
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
};

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
  applyPriceFilter: "Apply",
  priceUnderLabel: "Under",
  priceAboveLabel: "+",
};

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
  deliveryEstimateLabel: "Ships in {days} business days",
  estimatedDeliveryPrefix: "Estimated delivery",
  businessDaysLabel: "business days",
  trackOrderLabel: "Track your order",
  // Dropship / extended shipping tab text
  shippingEstimatedDelivery: "Estimated delivery: {days} business days",
  shippingFreeLabel: "Free Shipping",
  shippingProcessingTime: "Processing time: 1-3 business days",
  shippingTrackingNotice: "You'll receive tracking information via email once your order ships",
  shippingWarehouseNotice: "This item ships from our international fulfillment center",
  shippingReturnPolicyNote: "Returns accepted within 30 days of delivery",
  shippingCarrierLabel: "Carrier: {carrier}",
  shippingExtendedReturnNote: "Please note: return shipping for international items may take additional time",
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
  // Specifications & Attributes
  specificationsTab: "Specifications",
  noSpecifications: "No specifications available.",
  selectAttributeLabel: "Select {attribute}",
  pleaseSelectAttribute: "Please select {attribute}",
  // Enhanced stock messages
  unlimitedStock: "In Stock",
  selectOptionsForStock: "Select options to see availability",
  maxPerCustomer: "Limit {count} per customer",
  unavailableForSelection: "Unavailable for current selection",
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
};

export const DEFAULT_ACCOUNT_DASHBOARD_TEXT: AccountDashboardText = {
  totalOrders: "Total Orders",
  wishlistItems: "Wishlist Items",
  savedAddresses: "Saved Addresses",
  memberSince: "Member Since",
  welcomeBack: "Welcome back, {name}",
  welcomeBackMessage: "Here's what's happening with your account today.",
  accountSummary: "here's what's happening with your account today",
  recentOrders: "Recent Orders",
  viewAllButton: "View All â†’",
  viewButton: "View",
  orderLabel: "Order",
  orderNumberPrefix: "Order #",
  noOrdersYet: "No orders yet",
  whenYouPlaceOrder: "When you place an order, it will appear here.",
  noRecentOrders: "No recent orders",
  startShopping: "Start Shopping",
};

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
  editAddressTitle: "Edit Address",
  deleteButton: "Delete",
  deleteConfirmTitle: "Delete address?",
  deleteConfirmMessage: "This address will be permanently removed from your account.",
  saving: "Saving…",
  saveChanges: "Save changes",
  continueShoppingButton: "Continue Shopping",
  startShopping: "Start Shopping",
  cancel: "Cancel",
};

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

export const DEFAULT_NAVBAR_TEXT: NavbarText = {
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
  mobileNavPosition: "right",
  mobileMenuStyle: "visual",
  dropdownArrowDirection: "auto",
  dropdownArrowDirectionExpanded: "down",
  subcategoriesSide: "auto",
  // Mobile navigation
  homeLabel: "Home",
  shopLabel: "Shop",
};

// ============================================
// DEFAULT CONFIGURATION
// ============================================
// This is the template default - customize for each client.
// Loosely typed: missing some Zod-only metadata fields (version, channelSlug).
// Always accessed through hooks that merge with DEFAULT_* objects.
export const defaultStoreConfig = {
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
      text: "Free shipping on orders over $50 â€¢ Fast delivery worldwide",
      backgroundColor: null,
      textColor: null,
      useSaleorPromotions: false,
      useSaleorVouchers: false,
      items: [],
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
      marquee: {
        enabled: true,
        text: "Free Shipping on All Orders | Easy Returns | Premium Quality",
        speedSeconds: 20,
        textColor: "#ffffff",
        background: {
          style: "animated-gradient",
          color: "#000000",
          secondaryColor: "#333333",
        }
      },
      feature: {
        enabled: true,
        title: "New Season Collection",
        description: "Discover our latest arrivals for the upcoming season. Hand-picked styles just for you.",
        imageUrl: null,
        imagePosition: "left",
        ctaText: "Shop Now",
        ctaLink: "/products",
        background: {
          style: "radial-gradient",
          color: "#f5f5f5",
          secondaryColor: "#e5e5e5",
        }
      },
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
      lowStockText: "Only {count} left",
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
      viewCartLink: "View Cart â†’",
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
      switchToSignIn: "Switch to Sign In â†’",
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
      allProductsLabel: "Products",
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
      viewAllCategoriesButton: "View All Categories",
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
      // Hero section stats and labels
      exploreBrandsButton: "Explore brands",
      brandsStatLabel: "Brands",
      stylesStatLabel: "Styles",
      ratingStatLabel: "Rating",
      heroDefaultTitle: "Multi-brand performance",
      heroDefaultSubtitle: "Performance footwear and sportswear curated from the world's most trusted labels.",
      watchVideoButton: "Watch Video",
      // Category cards
      shopNowButton: "Shop Collection",
      exploreText: "Explore",
      productCountText: "Products",
      // Newsletter
      newsletterEmailPlaceholder: "Enter your email",

      // V6 Homepage Section Labels
      curatedLabel: "Curated",
      viewDetailsButton: "View details",
      viewAllBrandsButton: "View all brands",
      viewAllOffersButton: "View all offers",
      allCollectionsButton: "All Collections",
      itemsText: "items",
      stylesText: "styles",
      performanceLineupText: "Performance lineup",
      brandLabel: "Brand",
      performanceFallback: "Performance",

      // Product Badge Labels
      saleBadgeLabel: "Sale",
      saleBadgeOffText: "OFF",
      newBadgeLabel: "New",
      featuredBadgeLabel: "Featured",
      outOfStockBadgeLabel: "Out of stock",
      lowStockBadgeLabel: "Low stock",

      // Flash Deals / Sale Section
      itemsOnSaleText: "{count} items on sale",
      savePercentText: "Save {discount}%",
      upToPercentOffText: "Up to {discount}% Off",

      // Customer Feedback / Testimonials
      reviewedProductLabel: "Reviewed Product",
      verifiedBuyerLabel: "Verified Buyer",
      anonymousLabel: "Anonymous",

      // Collection Mosaic
      shopCollectionButton: "Shop collection",
      featuredCollectionLabel: "Featured Collection",

      // Promotion Banner
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
      sslEncryptionMessage: "Protected by SSL encryption â€¢ Your payment info is safe",
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

  design: {
    animations: { preset: "moderate" as const },
    spacing: { sectionPaddingY: "normal" as const },
    grid: { productColumns: { sm: 2, md: 2, lg: 4 } },
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
      relatedProducts: true,
      stockAlerts: true,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD", "EUR", "GBP"] },
      shipping: {
        enabled: false,  // No shipping for digital
        freeShippingThreshold: null,
        showEstimatedDelivery: false,
        deliverySlots: false,
        defaultEstimatedMinDays: 0,
        defaultEstimatedMaxDays: 0,
        estimatedDeliveryFormat: "range" as const,
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
      relatedProducts: true,
      stockAlerts: true,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD"] },
      shipping: {
        enabled: true,
        freeShippingThreshold: 30,
        showEstimatedDelivery: true,
        deliverySlots: true,  // Time slot delivery
        defaultEstimatedMinDays: 1,
        defaultEstimatedMaxDays: 3,
        estimatedDeliveryFormat: "range" as const,
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
      relatedProducts: true,
      stockAlerts: false,
    },
    ecommerce: {
      currency: { default: "USD", supported: ["USD", "EUR"] },
      shipping: {
        enabled: false,
        freeShippingThreshold: null,
        showEstimatedDelivery: false,
        deliverySlots: true,  // Appointment slots
        defaultEstimatedMinDays: 0,
        defaultEstimatedMaxDays: 0,
        estimatedDeliveryFormat: "range" as const,
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
      relatedProducts: true,
      stockAlerts: true,
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Deep partial — makes all nested properties optional recursively. */
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Merge default config with store type preset and custom overrides
 */
export function createStoreConfig(
  storeType: StoreType,
  customConfig: DeepPartial<StoreConfig> = {}
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

    // Badge colors (from Storefront Control badge config)
    '--badge-sale-bg': config.ui?.badges?.sale?.backgroundColor || colors.error,
    '--badge-sale-text': config.ui?.badges?.sale?.textColor || '#FFFFFF',
    '--badge-new-bg': config.ui?.badges?.new?.backgroundColor || '#171717',
    '--badge-new-text': config.ui?.badges?.new?.textColor || '#FFFFFF',
    '--badge-outofstock-bg': config.ui?.badges?.outOfStock?.backgroundColor || colors.textMuted,
    '--badge-outofstock-text': config.ui?.badges?.outOfStock?.textColor || '#FFFFFF',
    '--badge-lowstock-bg': config.ui?.badges?.lowStock?.backgroundColor || colors.warning,
    '--badge-lowstock-text': config.ui?.badges?.lowStock?.textColor || '#FFFFFF',
    '--badge-featured-bg': config.ui?.badges?.featured?.backgroundColor || colors.accent,
    '--badge-featured-text': config.ui?.badges?.featured?.textColor || '#FFFFFF',

    // Design tokens (animations, spacing, grid)
    ...getDesignTokenCSSVariables(config),
  };
}

/**
 * Resolve design token CSS variables from config
 */
function getDesignTokenCSSVariables(config: StoreConfig): Record<string, string> {
  const design = config.design;
  if (!design) return {};

  const preset = ANIMATION_PRESETS[design.animations.preset] ?? ANIMATION_PRESETS.moderate;
  const anim = design.animations;
  const spacing = design.spacing;
  const grid = design.grid;

  return {
    // Animation tokens
    '--design-card-hover-duration': `${anim.cardHoverDuration ?? preset.cardHoverDuration}ms`,
    '--design-card-hover-lift': `-${anim.cardHoverLift ?? preset.cardHoverLift}px`,
    '--design-image-zoom': `${anim.imageZoomScale ?? preset.imageZoomScale}`,
    '--design-image-zoom-duration': `${anim.imageZoomDuration ?? preset.imageZoomDuration}ms`,
    '--design-btn-hover-scale': `${anim.buttonHoverScale ?? preset.buttonHoverScale}`,
    '--design-easing': anim.transitionEasing ?? 'ease-out',
    '--design-reveal-duration': `${anim.sectionRevealDuration ?? preset.sectionRevealDuration}ms`,
    '--design-marquee-speed': `${anim.marqueeSpeed ?? preset.marqueeSpeed}s`,
    '--design-hero-rotate': `${anim.heroAutoRotate ?? preset.heroAutoRotate}s`,

    // Spacing tokens
    '--design-section-py': SPACING_PRESETS[spacing.sectionPaddingY]?.sectionPaddingY ?? '5rem',
    '--design-container-max': `${spacing.containerMaxWidth ?? 1440}px`,
    '--design-container-px': CONTAINER_PX_MAP[spacing.containerPaddingX ?? 'normal'],
    '--design-card-gap': CARD_GAP_MAP[spacing.cardGap ?? 'normal'],

    // Grid tokens
    '--design-grid-sm': `${grid?.productColumns?.sm ?? 2}`,
    '--design-grid-md': `${grid?.productColumns?.md ?? 2}`,
    '--design-grid-lg': `${grid?.productColumns?.lg ?? 4}`,
  };
}
