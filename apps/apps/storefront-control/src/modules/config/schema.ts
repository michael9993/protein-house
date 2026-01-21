import { z } from "zod";

// ============================================
// STORE INFO SCHEMA
// ============================================
export const StoreTypeSchema = z.enum(["physical", "digital", "food", "services", "mixed"]);

export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
});

export const StoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  tagline: z.string(),
  type: StoreTypeSchema,
  description: z.string(),
  email: z.string().email("Invalid email"),
  phone: z.string(),
  address: AddressSchema.optional(),
});

// ============================================
// BRANDING SCHEMA
// ============================================
export const ColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
  success: z.string(),
  warning: z.string(),
  error: z.string(),
});

// Font size options (matching Tailwind CSS sizes)
export const FontSizeSchema = z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"]);

export const TypographySchema = z.object({
  fontHeading: z.string(),
  fontBody: z.string(),
  fontMono: z.string(),
  // Font sizes for different text elements (RTL-aware)
  fontSize: z.object({
    h1: FontSizeSchema.optional(),        // Main headings
    h2: FontSizeSchema.optional(),        // Section headings
    h3: FontSizeSchema.optional(),        // Subsection headings
    h4: FontSizeSchema.optional(),         // Card titles
    body: FontSizeSchema.optional(),       // Body text
    small: FontSizeSchema.optional(),       // Small text
    button: FontSizeSchema.optional(),       // Button text
    caption: FontSizeSchema.optional(),    // Captions/labels
  }).optional(),
});

export const BorderRadiusSchema = z.enum(["none", "sm", "md", "lg", "full"]);
export const ButtonStyleSchema = z.enum(["solid", "outline", "ghost"]);
export const CardShadowSchema = z.enum(["none", "sm", "md", "lg"]);

export const StyleSchema = z.object({
  borderRadius: BorderRadiusSchema,
  buttonStyle: ButtonStyleSchema,
  cardShadow: CardShadowSchema,
});

export const BrandingSchema = z.object({
  logo: z.string(),
  logoAlt: z.string(),
  favicon: z.string(),
  colors: ColorsSchema,
  typography: TypographySchema,
  style: StyleSchema,
});

// ============================================
// FEATURES SCHEMA
// ============================================
export const FeaturesSchema = z.object({
  wishlist: z.boolean(),
  compareProducts: z.boolean(),
  productReviews: z.boolean(),
  recentlyViewed: z.boolean(),
  guestCheckout: z.boolean(),
  expressCheckout: z.boolean(),
  savePaymentMethods: z.boolean(),
  digitalDownloads: z.boolean(),
  subscriptions: z.boolean(),
  giftCards: z.boolean(),
  productBundles: z.boolean(),
  newsletter: z.boolean(),
  promotionalBanners: z.boolean(),
  abandonedCartEmails: z.boolean(),
  socialLogin: z.boolean(),
  shareButtons: z.boolean(),
  instagramFeed: z.boolean(),
});

// ============================================
// ECOMMERCE SCHEMA
// ============================================
export const CurrencySettingsSchema = z.object({
  default: z.string(),
  supported: z.array(z.string()),
});

export const ShippingSettingsSchema = z.object({
  enabled: z.boolean(),
  freeShippingThreshold: z.number().nullable(),
  showEstimatedDelivery: z.boolean(),
  deliverySlots: z.boolean(),
});

export const TaxSettingsSchema = z.object({
  showPricesWithTax: z.boolean(),
  taxIncludedInPrice: z.boolean(),
});

export const InventorySettingsSchema = z.object({
  showStockLevel: z.boolean(),
  lowStockThreshold: z.number(),
  allowBackorders: z.boolean(),
});

export const CheckoutSettingsSchema = z.object({
  minOrderAmount: z.number().nullable(),
  maxOrderAmount: z.number().nullable(),
  termsRequired: z.boolean(),
});

export const EcommerceSchema = z.object({
  currency: CurrencySettingsSchema,
  shipping: ShippingSettingsSchema,
  tax: TaxSettingsSchema,
  inventory: InventorySettingsSchema,
  checkout: CheckoutSettingsSchema,
});

// ============================================
// HOMEPAGE SECTIONS SCHEMA
// ============================================
export const HeroTypeSchema = z.enum(["image", "video", "slider"]);

// Hero slide for slider mode
export const HeroSlideSchema = z.object({
  imageUrl: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  ctaLink: z.string(),
});

// Enhanced hero section with content
export const HeroSectionSchema = z.object({
  enabled: z.boolean(),
  type: HeroTypeSchema,
  // Content fields
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  ctaLink: z.string(),
  badgeText: z.string().nullable().optional(), // "New Season Collection" or null to hide badge
  // Media fields
  imageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  // Slider mode
  slides: z.array(HeroSlideSchema).optional(),
  // Overlay settings
  overlayOpacity: z.number().min(0).max(100),
  textAlignment: z.enum(["left", "center", "right", "start", "end"]), // "start"/"end" are RTL-aware
});

// Section background style types
export const SectionBackgroundStyleSchema = z.enum([
  "none",           // No background (transparent)
  "solid",          // Solid color
  "gradient",       // Linear gradient
  "radial-gradient", // Radial gradient
  "color-mix",      // Color mix (like sale section)
  "pattern",        // Pattern overlay (grid, dots, etc.)
  "animated-gradient", // Animated gradient
  "glass",          // Glass morphism effect
]);

// Section background configuration
export const SectionBackgroundSchema = z.object({
  style: SectionBackgroundStyleSchema,
  // For solid, gradient, color-mix
  color: z.string().nullable(), // null = use primary color
  secondaryColor: z.string().nullable(), // For gradients/color-mix
  // For color-mix
  mixPercentage: z.number().min(0).max(100).optional(), // Percentage of primary color in mix (default: 8)
  // For gradients
  gradientDirection: z.enum(["to-right", "to-left", "to-bottom", "to-top", "to-bottom-right", "to-top-left", "diagonal"]).optional(),
  // For patterns
  patternType: z.enum(["grid", "dots", "lines", "waves"]).optional(),
  patternOpacity: z.number().min(0).max(100).optional(), // 0-100 (default: 10)
  // For animated-gradient
  animationSpeed: z.enum(["slow", "normal", "fast"]).optional(), // Animation speed
  // For glass
  glassBlur: z.number().min(0).max(20).optional(), // Blur amount (default: 10)
  glassOpacity: z.number().min(0).max(100).optional(), // Opacity (default: 80)
}).optional();

export const LimitedSectionSchema = z.object({
  enabled: z.boolean(),
  limit: z.number().min(1).max(20),
  background: SectionBackgroundSchema,
});

export const SimpleSectionSchema = z.object({
  enabled: z.boolean(),
  background: SectionBackgroundSchema,
});

// Testimonials section with star color and card styling
export const TestimonialsSectionSchema = z.object({
  enabled: z.boolean(),
  background: SectionBackgroundSchema,
  // Star rating styling
  starColor: z.string().nullable().optional(), // null = use gold (#FFD700)
  starEmptyColor: z.string().nullable().optional(), // null = use textMuted with 30% opacity
  starSize: z.enum(["xs", "sm", "base", "lg", "xl"]).optional(), // Default: base (h-5 w-5)
  // Text labels
  loadingReviewsText: z.string().nullable().optional(), // null = "Loading reviews..."
  verifiedPurchaseLabel: z.string().nullable().optional(), // null = "Verified Purchase"
  customerLabel: z.string().nullable().optional(), // null = "Customer"
  // Review card styling
  card: z.object({
    backgroundColor: z.string().nullable().optional(), // null = white
    borderColor: z.string().nullable().optional(), // null = neutral-200/50
    borderRadius: z.string().nullable().optional(), // null = use --store-radius
    padding: z.string().nullable().optional(), // null = p-6
    shadow: z.string().nullable().optional(), // null = use primary color with 15% opacity
    hoverShadow: z.string().nullable().optional(), // null = default hover shadow
    hoverTransform: z.string().nullable().optional(), // null = translateY(-4px)
  }).optional(),
  // Trust badges styling
  trustBadges: z.object({
    showAverageRating: z.boolean().optional(),
    showCustomerCount: z.boolean().optional(),
    showSatisfactionRate: z.boolean().optional(),
    showOrdersDelivered: z.boolean().optional(),
    borderColor: z.string().nullable().optional(), // null = neutral-200
    textColor: z.string().nullable().optional(), // null = use text colors from branding
  }).optional(),
});

export const InstagramSectionSchema = z.object({
  enabled: z.boolean(),
  username: z.string().nullable(),
  background: SectionBackgroundSchema,
});

export const HomepageSectionsSchema = z.object({
  hero: HeroSectionSchema,
  featuredCategories: LimitedSectionSchema,
  newArrivals: LimitedSectionSchema,
  bestSellers: LimitedSectionSchema,
  onSale: LimitedSectionSchema,
  featuredBrands: SimpleSectionSchema,
  testimonials: TestimonialsSectionSchema,
  newsletter: SimpleSectionSchema,
  instagramFeed: InstagramSectionSchema,
});

// Section IDs for ordering
export const HomepageSectionIdSchema = z.enum([
  "hero",
  "featuredCategories",
  "newArrivals",
  "bestSellers",
  "onSale",
  "featuredBrands",
  "testimonials",
  "newsletter",
  "instagramFeed",
]);

// Default section order
export const DEFAULT_SECTION_ORDER: z.infer<typeof HomepageSectionIdSchema>[] = [
  "hero",
  "featuredCategories",
  "newArrivals",
  "bestSellers",
  "onSale",
  "featuredBrands",
  "testimonials",
  "newsletter",
  "instagramFeed",
];

export const HomepageSchema = z.object({
  sections: HomepageSectionsSchema,
  sectionOrder: z.array(HomepageSectionIdSchema).optional(), // Order of sections, defaults to DEFAULT_SECTION_ORDER
});

// ============================================
// PROMO POPUP SCHEMA
// ============================================
export const PromoPopupSchema = z.object({
  enabled: z.boolean(),
  // Content
  title: z.string(),
  body: z.string(),
  badge: z.string().nullable(),
  // Media
  imageUrl: z.string().nullable(),
  backgroundImageUrl: z.string().nullable(),
  // CTA
  ctaText: z.string(),
  ctaLink: z.string(),
  // Text labels
  itemsOnSaleText: z.string(),            // "{count} items on sale" (for auto-detect mode)
  maybeLaterText: z.string(),             // "Maybe later" (dismiss button)
  // Behavior
  delaySeconds: z.number().min(0).max(60),
  showOncePerSession: z.boolean(),
  ttlHours: z.number().min(1).max(168), // 1 hour to 1 week
  // Exclusions
  excludeCheckout: z.boolean(),
  excludeCart: z.boolean(),
  // Auto-detect from sale collection (existing behavior)
  autoDetectSales: z.boolean(),
});

// ============================================
// HEADER SCHEMA
// ============================================
export const HeaderBannerSchema = z.object({
  enabled: z.boolean(),
  text: z.string(),
  backgroundColor: z.string().nullable(), // null = use primary color
  textColor: z.string().nullable(),       // null = white
});

export const LogoPositionSchema = z.enum(["left", "center"]);

export const HeaderSchema = z.object({
  banner: HeaderBannerSchema,
  showStoreName: z.boolean(),
  logoPosition: LogoPositionSchema,
});

// ============================================
// FOOTER SCHEMA
// ============================================
export const FooterSchema = z.object({
  showNewsletter: z.boolean(),
  showSocialLinks: z.boolean(),
  showContactInfo: z.boolean(),
  copyrightText: z.string().nullable(), // null = use default
});

// ============================================
// PAGES SCHEMA
// ============================================
export const PagesSchema = z.object({
  aboutUs: z.boolean(),
  contact: z.boolean(),
  faq: z.boolean(),
  blog: z.boolean(),
  privacyPolicy: z.boolean(),
  termsOfService: z.boolean(),
  shippingPolicy: z.boolean(),
  returnPolicy: z.boolean(),
});

// ============================================
// INTEGRATIONS SCHEMA
// ============================================
export const AnalyticsIntegrationsSchema = z.object({
  googleAnalyticsId: z.string().nullable(),
  googleTagManagerId: z.string().nullable(),
  facebookPixelId: z.string().nullable(),
  hotjarId: z.string().nullable(),
});

export const MarketingIntegrationsSchema = z.object({
  mailchimpListId: z.string().nullable(),
  klaviyoApiKey: z.string().nullable(),
});

export const SupportIntegrationsSchema = z.object({
  intercomAppId: z.string().nullable(),
  zendeskKey: z.string().nullable(),
  crispWebsiteId: z.string().nullable(),
});

export const SocialIntegrationsSchema = z.object({
  facebook: z.string().nullable(),
  instagram: z.string().nullable(),
  twitter: z.string().nullable(),
  youtube: z.string().nullable(),
  tiktok: z.string().nullable(),
  pinterest: z.string().nullable(),
});

export const IntegrationsSchema = z.object({
  analytics: AnalyticsIntegrationsSchema,
  marketing: MarketingIntegrationsSchema,
  support: SupportIntegrationsSchema,
  social: SocialIntegrationsSchema,
});

// ============================================
// SEO SCHEMA
// ============================================
export const SeoSchema = z.object({
  titleTemplate: z.string(),
  defaultTitle: z.string(),
  defaultDescription: z.string(),
  defaultImage: z.string(),
  twitterHandle: z.string().nullable(),
});

// ============================================
// LOCALIZATION SCHEMA
// ============================================
export const TimeFormatSchema = z.enum(["12h", "24h"]);
export const DirectionSchema = z.enum(["ltr", "rtl", "auto"]);

// Default RTL locales - used when direction is "auto"
export const DEFAULT_RTL_LOCALES = ["he", "ar", "fa", "ur", "yi", "ps"];

export const LocalizationSchema = z.object({
  defaultLocale: z.string(),
  supportedLocales: z.array(z.string()),
  dateFormat: z.string(),
  timeFormat: TimeFormatSchema,
  direction: DirectionSchema, // "auto" = detect from locale
  rtlLocales: z.array(z.string()).optional(), // Custom RTL locale list (defaults to DEFAULT_RTL_LOCALES)
});

// ============================================
// DARK MODE SCHEMA
// ============================================
export const DarkModeColorsSchema = z.object({
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
  border: z.string().optional(), // Border color for dark mode
  primary: z.string().optional(), // Optional override
  secondary: z.string().optional(),
  accent: z.string().optional(),
  success: z.string().optional(),
  warning: z.string().optional(),
  error: z.string().optional(),
});

export const DarkModeSchema = z.object({
  enabled: z.boolean(),
  auto: z.boolean(), // Follow system preference
  colors: DarkModeColorsSchema.optional(), // Override colors for dark mode
});

// ============================================
// FILTERS SCHEMA (NEW)
// ============================================
export const FilterConfigSchema = z.object({
  enabled: z.boolean(),
  showQuickButtons: z.boolean().optional(),
});

export const FiltersSchema = z.object({
  enabled: z.boolean(),
  priceFilter: z.object({
    enabled: z.boolean(),
    showQuickButtons: z.boolean(),
  }),
  ratingFilter: z.object({ enabled: z.boolean() }),
  brandFilter: z.object({ enabled: z.boolean() }),
  sizeFilter: z.object({ enabled: z.boolean() }),
  colorFilter: z.object({ enabled: z.boolean() }),
  categoryFilter: z.object({ enabled: z.boolean() }),
  collectionFilter: z.object({ enabled: z.boolean() }),
  stockFilter: z.object({ enabled: z.boolean() }),
});

// ============================================
// QUICK FILTERS SCHEMA (NEW)
// ============================================
// Quick Filters Style Schema (must be defined before QuickFiltersSchema)
export const QuickFiltersStyleSchema = z.object({
  cardWidth: z.number(),              // 160
  cardHeight: z.number(),             // 220
  cardGap: z.number(),                // 0.5
  titleFontSize: z.enum(["xs", "sm", "base", "lg", "xl"]),
  titleFontWeight: z.enum(["normal", "medium", "semibold", "bold"]),
  arrowSize: z.number(),              // 48
  arrowIconSize: z.number(),          // 24
  // Color customization
  titleColor: z.string().nullable(),  // Color for section titles (Categories, Brands)
  valueColor: z.string().nullable(),  // Color for filter values/buttons
  activeValueColor: z.string().nullable(), // Color when selected
  // Shop All button style
  shopAllButtonBackgroundColor: z.string().nullable(), // Background color for Shop All button
  shopAllButtonTextColor: z.string().nullable(),        // Text color for Shop All button
  shopAllButtonHoverBackgroundColor: z.string().nullable(), // Hover background color
  shopAllButtonBorderColor: z.string().nullable(),    // Border color
  // Navbar mode (sticky) styling
  navbarMode: z.object({
    buttonPaddingX: z.number().optional(),        // px-3.5 (14px)
    buttonPaddingY: z.number().optional(),        // py-1.5 (6px)
    buttonFontSize: z.enum(["xs", "sm", "base"]).optional(), // text-xs
    buttonFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(), // font-semibold
    buttonBorderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(), // rounded-full
    buttonGap: z.number().optional(),             // gap-2 (8px)
    groupLabelFontSize: z.enum(["xs", "sm"]).optional(), // text-[10px]
    groupLabelPaddingX: z.number().optional(),    // px-2 (8px)
    groupLabelPaddingY: z.number().optional(),    // py-1 (4px)
    separatorWidth: z.number().optional(),        // w-px (1px)
    separatorHeight: z.number().optional(),       // h-6 (24px)
    containerPaddingY: z.number().optional(),     // py-2.5 (10px)
    backgroundColor: z.string().nullable().optional(), // bg-white
    borderTopColor: z.string().nullable().optional(),
    borderBottomColor: z.string().nullable().optional(),
    shadowColor: z.string().nullable().optional(),
  }).optional(),
});

export const QuickFiltersSchema = z.object({
  enabled: z.boolean(),
  showCategories: z.boolean(),
  showCollections: z.boolean(),
  showBrands: z.boolean(),
  categoryLimit: z.number().min(1).max(20),
  collectionLimit: z.number().min(1).max(20),
  brandLimit: z.number().min(1).max(20),
  // Style customization
  style: QuickFiltersStyleSchema.optional(),
});

// ============================================
// UI COMPONENTS SCHEMA
// ============================================

// Button variant configuration
export const ButtonVariantSchema = z.object({
  backgroundColor: z.string().nullable(), // null = use theme color
  textColor: z.string().nullable(),
  hoverBackgroundColor: z.string().nullable(),
  borderColor: z.string().nullable(),
});

// Buttons configuration
export const ButtonsSchema = z.object({
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]),
  primary: ButtonVariantSchema,
  secondary: ButtonVariantSchema,
  outline: ButtonVariantSchema,
  danger: ButtonVariantSchema,
});

// Badge configuration
export const BadgeStyleSchema = z.object({
  backgroundColor: z.string().nullable(),
  textColor: z.string().nullable(),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]),
});

export const BadgesSchema = z.object({
  sale: BadgeStyleSchema,
  new: BadgeStyleSchema,
  outOfStock: BadgeStyleSchema,
  lowStock: BadgeStyleSchema,
  discount: BadgeStyleSchema,
  featured: BadgeStyleSchema,
});

// Form inputs configuration
export const InputsSchema = z.object({
  borderRadius: z.enum(["none", "sm", "md", "lg"]),
  borderColor: z.string().nullable(),
  focusBorderColor: z.string().nullable(), // null = use primary
  focusRingColor: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  placeholderColor: z.string().nullable(),
});

// Checkbox/toggle configuration
export const CheckboxSchema = z.object({
  checkedBackgroundColor: z.string().nullable(), // null = use primary
  borderRadius: z.enum(["none", "sm", "md", "full"]),
});

// Product card configuration
export const ProductCardSchema = z.object({
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl"]),
  shadow: z.enum(["none", "sm", "md", "lg"]),
  hoverShadow: z.enum(["none", "sm", "md", "lg", "xl"]),
  showQuickView: z.boolean(),
  showWishlistButton: z.boolean(),
  showAddToCart: z.boolean(),
  imageAspectRatio: z.enum(["square", "portrait", "landscape"]),
});

// Toast/notification configuration
export const ToastsSchema = z.object({
  position: z.enum(["top-right", "top-left", "bottom-right", "bottom-left", "top-center", "bottom-center"]),
  borderRadius: z.enum(["none", "sm", "md", "lg"]),
  success: z.object({
    backgroundColor: z.string().nullable(),
    textColor: z.string().nullable(),
    iconColor: z.string().nullable(),
  }),
  error: z.object({
    backgroundColor: z.string().nullable(),
    textColor: z.string().nullable(),
    iconColor: z.string().nullable(),
  }),
  warning: z.object({
    backgroundColor: z.string().nullable(),
    textColor: z.string().nullable(),
    iconColor: z.string().nullable(),
  }),
  info: z.object({
    backgroundColor: z.string().nullable(),
    textColor: z.string().nullable(),
    iconColor: z.string().nullable(),
  }),
});

// Icons configuration
export const IconsSchema = z.object({
  style: z.enum(["outline", "solid", "duotone"]),
  defaultColor: z.string().nullable(), // null = inherit
  activeColor: z.string().nullable(),  // null = use primary
});

// Active Filters Tags configuration
export const ActiveFiltersTagsSchema = z.object({
  // Container styling
  containerBackgroundColor: z.string().nullable().optional(), // bg-white
  containerBorderColor: z.string().nullable().optional(),     // border-neutral-200
  containerBorderRadius: z.enum(["none", "sm", "md", "lg"]).optional(), // rounded-lg
  containerPadding: z.number().optional(),                    // p-4 (16px)
  containerShadow: z.enum(["none", "sm", "md", "lg"]).optional(), // shadow-sm
  // Title styling
  titleFontSize: z.enum(["xs", "sm", "base", "lg"]).optional(), // text-sm
  titleFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(), // font-semibold
  titleColor: z.string().nullable().optional(),               // text-neutral-900
  // Clear all button styling
  clearAllButtonFontSize: z.enum(["xs", "sm", "base"]).optional(), // text-xs
  clearAllButtonFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(), // font-medium
  clearAllButtonColor: z.string().nullable().optional(),      // text-neutral-500
  clearAllButtonHoverColor: z.string().nullable().optional(), // hover:text-neutral-700
  // Tag styling
  tagBackgroundColor: z.string().nullable().optional(),       // bg-neutral-50
  tagBorderColor: z.string().nullable().optional(),           // border-neutral-200
  tagTextColor: z.string().nullable().optional(),             // text-neutral-700
  tagHoverBackgroundColor: z.string().nullable().optional(),  // hover:bg-neutral-100
  tagHoverBorderColor: z.string().nullable().optional(),      // hover:border-neutral-300
  tagBorderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(), // rounded-full
  tagPaddingX: z.number().optional(),                         // px-3 (12px)
  tagPaddingY: z.number().optional(),                         // py-1.5 (6px)
  tagFontSize: z.enum(["xs", "sm", "base"]).optional(),      // text-xs
  tagFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(), // font-medium
  tagGap: z.number().optional(),                              // gap-2 (8px)
  // Remove button (X) styling
  removeButtonSize: z.number().optional(),                    // h-4 w-4 (16px)
  removeButtonColor: z.string().nullable().optional(),        // text-neutral-400
  removeButtonHoverBackgroundColor: z.string().nullable().optional(), // hover:bg-neutral-200
  removeButtonHoverColor: z.string().nullable().optional(),   // hover:text-neutral-600
  removeButtonBorderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(), // rounded-full
});

// Full UI schema
export const UiSchema = z.object({
  buttons: ButtonsSchema,
  badges: BadgesSchema,
  inputs: InputsSchema,
  checkbox: CheckboxSchema,
  productCard: ProductCardSchema,
  toasts: ToastsSchema,
  icons: IconsSchema,
  activeFiltersTags: ActiveFiltersTagsSchema.optional(),
});

// ============================================
// CONTENT/TEXT SCHEMA
// ============================================
export const CartTextSchema = z.object({
  emptyCartTitle: z.string(),
  emptyCartMessage: z.string(),
  cartTitle: z.string(),
  checkoutButton: z.string(),
  continueShoppingButton: z.string(),
  // Selection controls
  selectAllButton: z.string(),            // "Select All"
  deselectAllButton: z.string(),          // "Deselect All"
  selectAllItemsButton: z.string(),       // "Select all items"
  selectItemsToCheckout: z.string(),      // "Select items to proceed to checkout"
  // Free shipping message
  freeShippingMessage: z.string(),       // "Add {amount} more for free shipping" or "You qualify for free shipping!"
  freeShippingThresholdReached: z.string(), // "You've qualified for free shipping!"
  addXMoreForFreeShipping: z.string(),    // "Add {amount} more for FREE shipping!"
  unlockedFreeShipping: z.string(),       // "You've unlocked FREE shipping!"
  // Item actions
  saveForLaterButton: z.string(),         // "Save for Later"
  moveToCartButton: z.string(),           // "Move to Cart"
  deleteButton: z.string(),               // "Delete"
  // Labels and text
  itemSingular: z.string(),               // "item"
  itemPlural: z.string(),                 // "items"
  orderSummaryTitle: z.string(),          // "Order Summary"
  itemsSelectedText: z.string(),          // "{count} {singular|plural} selected"
  eachLabel: z.string(),                  // "each"
  availableLabel: z.string(),             // "available"
  outOfStockLabel: z.string(),            // "Out of stock"
  // Loading states
  loadingCheckoutTitle: z.string(),       // "Loading Checkout..."
  loadingCheckoutMessage: z.string(),     // "Please wait while we prepare your checkout"
  // Error messages
  quantityMinError: z.string(),           // "Quantity must be at least 1"
  onlyXItemsAvailable: z.string(),        // "Only {count} items available in stock"
  useDeleteButtonMessage: z.string(),     // "Use the Delete button to remove items from cart"
  failedToUpdateQuantity: z.string(),     // "Failed to update quantity"
  onlyXAvailable: z.string(),             // "Only {count} available"
  // Success messages
  quantityUpdatedSuccess: z.string(),     // "Quantity updated!"
  // Promo code section
  promoCodeLabel: z.string(),             // "Promo Code"
  promoCodePlaceholder: z.string(),       // "Enter code"
  promoCodeApplyButton: z.string(),       // "Apply"
  // Order summary
  subtotalLabel: z.string(),              // "Subtotal"
  subtotalLabelWithCount: z.string(),     // "Subtotal ({count} items)"
  shippingLabel: z.string(),              // "Shipping"
  shippingFree: z.string(),               // "FREE"
  shippingCalculatedAtCheckout: z.string(), // "Calculated at checkout"
  totalLabel: z.string(),                 // "Total"
  // Checkout button states
  selectItemsButton: z.string(),          // "Select Items"
  preparingCheckout: z.string(),          // "Preparing..."
  loadingCheckout: z.string(),            // "Loading..."
  // Trust badges
  secureCheckoutText: z.string(),         // "Secure Checkout"
  sslEncryptedText: z.string(),           // "SSL Encrypted"
  // Payment methods
  acceptedPaymentMethods: z.string(),     // "Accepted Payment Methods"
  providedByStripe: z.string(),           // "Provided by Stripe"
  // Saved for later
  itemsSavedForLater: z.string(),         // "{count} item(s) saved for later"
});

export const ProductTextSchema = z.object({
  addToCartButton: z.string(),
  buyNowButton: z.string(),
  outOfStockText: z.string(),
  lowStockText: z.string(),
  inStockText: z.string(),
  saleBadgeText: z.string(),
  newBadgeText: z.string(),
  reviewsTitle: z.string(),
  writeReviewButton: z.string(),
  noReviewsText: z.string(),
  // Button states
  addingButton: z.string(),               // "Adding..."
  addedToCartButton: z.string(),          // "Added to Cart!"
  selectOptionsButton: z.string(),        // "Select Options"
  viewCartLink: z.string(),               // "View Cart →"
});

export const AccountTextSchema = z.object({
  signInTitle: z.string(),
  signUpTitle: z.string(),
  signInButton: z.string(),
  signUpButton: z.string(),
  signOutButton: z.string(),
  forgotPasswordLink: z.string(),
  myAccountTitle: z.string(),
  ordersTitle: z.string(),
  addressesTitle: z.string(),
  wishlistTitle: z.string(),
  settingsTitle: z.string(),
  // Extended fields for account sidebar
  dashboardTitle: z.string(),
  needHelpTitle: z.string(),
  needHelpDescription: z.string(),
  contactSupportButton: z.string(),
  // Login page text
  signInSubtitle: z.string(), // "Sign in to access your orders, wishlist and personalized recommendations"
  signUpSubtitle: z.string(), // "Join us to enjoy exclusive benefits and faster checkout"
  orContinueWith: z.string(), // "or continue with"
  whyCreateAccount: z.string(), // "Why create an account?"
  benefitFasterCheckout: z.string(), // "Faster checkout with saved details"
  benefitTrackOrders: z.string(), // "Track your orders in real-time"
  benefitWishlist: z.string(), // "Save items to your wishlist"
  benefitDiscounts: z.string(), // "Exclusive member discounts & offers"
  termsAgreement: z.string(), // "By continuing, you agree to our"
  termsOfService: z.string(), // "Terms of Service"
  privacyPolicy: z.string(), // "Privacy Policy"
  emailLabel: z.string(), // "Email Address"
  emailPlaceholder: z.string(), // "you@example.com"
  passwordLabel: z.string(), // "Password"
  passwordPlaceholder: z.string(), // "Enter your password"
  confirmPasswordLabel: z.string(), // "Confirm Password"
  confirmPasswordPlaceholder: z.string(), // "Confirm your password"
  firstNameLabel: z.string(), // "First Name"
  lastNameLabel: z.string(), // "Last Name"
  createAccountButton: z.string(), // "Create Account"
  processingText: z.string(), // "Processing..."
  emailConfirmedMessage: z.string(), // "Your email has been confirmed successfully!"
  canNowSignIn: z.string(), // "You can now sign in to your account."
  switchToSignIn: z.string(), // "Switch to Sign In →"
  accountExistsMessage: z.string(), // "You already have an account with this email..."
});

export const GeneralTextSchema = z.object({
  searchPlaceholder: z.string(),
  newsletterTitle: z.string(),
  newsletterDescription: z.string(),
  newsletterButton: z.string(),
  newsletterSuccess: z.string(),
  newsletterPlaceholder: z.string(), // "Enter your email"
  newsletterNoSpam: z.string(), // "No spam, ever"
  newsletterWeeklyUpdates: z.string(), // "Weekly updates"
  newsletterExclusiveOffers: z.string(), // "Exclusive offers"
  newsletterAlreadySubscribed: z.string(), // "You're subscribed to our newsletter!"
  loadMoreButton: z.string(),
  viewAllButton: z.string(),
  backButton: z.string(),
  closeButton: z.string(),
  saveButton: z.string(),
  cancelButton: z.string(),
  confirmButton: z.string(),
  deleteButton: z.string(),
  editButton: z.string(),
  // Breadcrumbs
  homeLabel: z.string(),                // "Home" (for breadcrumbs)
});

// Homepage section titles
export const HomepageTextSchema = z.object({
  newArrivalsTitle: z.string(),
  newArrivalsSubtitle: z.string(),
  bestSellersTitle: z.string(),
  bestSellersSubtitle: z.string(),
  onSaleTitle: z.string(),
  onSaleSubtitle: z.string(),
  featuredTitle: z.string(),
  featuredSubtitle: z.string(),
  categoriesTitle: z.string(),
  categoriesSubtitle: z.string(),
  brandsTitle: z.string(),
  brandsSubtitle: z.string(),
  testimonialsTitle: z.string(),
  testimonialsSubtitle: z.string(),
  // Trust badges labels
  averageRatingLabel: z.string(),         // "Average Rating"
  happyCustomersLabel: z.string(),        // "Happy Customers"
  satisfactionRateLabel: z.string(),      // "Satisfaction Rate"
  ordersDeliveredLabel: z.string(),       // "Orders Delivered"
  // Testimonials labels
  verifiedPurchaseLabel: z.string(),      // "Verified Purchase"
  loadingReviewsText: z.string(),         // "Loading reviews..."
  noReviewsAvailableText: z.string(),     // "No reviews available yet. Be the first to review our products!"
  noReviewsSubtext: z.string(),           // "Reviews will appear here once customers start leaving feedback."
  noApprovedReviewsText: z.string(),      // "No approved reviews with 4+ stars yet. {count} review(s) pending approval."
  heroCtaText: z.string(),
  heroSecondaryCtaText: z.string(),
  watchVideoButton: z.string(),           // "Watch Video" (for hero video section)
  // Category cards
  shopNowButton: z.string(),              // "Shop Now"
  exploreText: z.string(),                // "Explore" (for category cards)
  productCountText: z.string(),           // "Products" or "{count} Products"
  // Newsletter
  newsletterEmailPlaceholder: z.string(), // "Enter your email"
});

// Checkout text
export const CheckoutTextSchema = z.object({
  secureCheckout: z.string(),
  contactDetails: z.string(),
  shippingAddress: z.string(),
  shippingMethod: z.string(),
  paymentMethod: z.string(),
  orderSummary: z.string(),
  placeOrder: z.string(),
  orderConfirmation: z.string(),
  thankYouTitle: z.string(),
  thankYouMessage: z.string(),
  // Footer links (optional for backward compatibility)
  privacyPolicyLinkText: z.string().optional(),   // "Privacy Policy"
  termsOfServiceLinkText: z.string().optional(),   // "Terms of Service"
  sslEncryptionMessage: z.string().optional(),     // "Protected by SSL encryption • Your payment info is safe"
});

// Filters/Sort/Product List Text
export const FiltersTextSchema = z.object({
  // Section titles
  sectionTitle: z.string(),           // "Filters"
  clearAllButton: z.string(),         // "Clear All Filters"
  showResultsButton: z.string(),      // "Show Results"
  filtersButtonText: z.string(),       // "Filters" (for category pages)

  // Filter headings
  categoryTitle: z.string(),          // "Category"
  collectionTitle: z.string(),        // "Collection"
  brandTitle: z.string(),             // "Brand"
  sizeTitle: z.string(),              // "Size"
  colorTitle: z.string(),             // "Color"
  priceTitle: z.string(),             // "Price"
  ratingTitle: z.string(),            // "Rating"
  availabilityTitle: z.string(),      // "Availability"

  // Sort dropdown
  sortByLabel: z.string(),            // "Sort by:" or "Sort by" (RTL-aware)
  searchForText: z.string(),          // "for" (text between count and search query)

  // Availability options
  inStockOnly: z.string(),            // "In Stock Only"
  onSale: z.string(),                 // "On Sale"

  // Active filters summary
  activeFiltersLabel: z.string(),     // "Active Filters:"
  categorySingular: z.string(),       // "category"
  categoryPlural: z.string(),         // "categories"
  collectionSingular: z.string(),     // "collection"
  collectionPlural: z.string(),       // "collections"
  brandSingular: z.string(),          // "brand"
  brandPlural: z.string(),            // "brands"
  colorSingular: z.string(),          // "color"
  colorPlural: z.string(),            // "colors"
  sizeSingular: z.string(),           // "size"
  sizePlural: z.string(),             // "sizes"

  // Sort options
  sortAtoZ: z.string(),               // "A to Z"
  sortZtoA: z.string(),               // "Z to A"
  sortPriceLowHigh: z.string(),       // "Price: Low to High"
  sortPriceHighLow: z.string(),       // "Price: High to Low"
  sortNewest: z.string(),             // "Newest"
  sortSale: z.string(),               // "Sale"

  // Empty/loading states
  noProductsTitle: z.string(),        // "No products found"
  noProductsWithFilters: z.string(),  // "Try adjusting your filters"
  noProductsEmpty: z.string(),        // "Check back later for new products"
  filteringProducts: z.string(),      // "Filtering products..."
  loadingMore: z.string(),            // "Loading more products..."
  seenAllProducts: z.string(),        // "You've seen all {count} products"
  tryAdjustingFilters: z.string(),    // "Try adjusting your filters to see more"

  // Search
  searchPlaceholder: z.string(),      // "Search Products"
  searchProductsTitle: z.string(),    // "Search Products"
  searchResultsTitle: z.string(),    // "Search Results"
  resultsCountText: z.string(),       // "Found {count} result(s)" (template, RTL-aware)
  noResultsMessage: z.string(),        // "No results found for \"{query}\""

  // Results text
  resultsText: z.string(),            // "results"
  itemsAvailable: z.string(),         // "items available"
  productsPageTitle: z.string(),      // "All Products"
  discoverProducts: z.string(),       // "Discover Products" (for empty states)

  // Quick filters
  shopAllButton: z.string(),          // "Shop All"
  quickAddButton: z.string(),         // "Quick Add"
  scrollLeftAriaLabel: z.string(),    // "Scroll left"
  scrollRightAriaLabel: z.string(),   // "Scroll right"
  checkOutOurProducts: z.string(),    // "Check Out Our Products" - title above quick filters

  // Rating filter
  minimumRating: z.string(),          // "Minimum Rating"
  starsAndUp: z.string(),             // "{count} stars & up"
  starAndUp: z.string(),              // "1 star & up"
  clearRatingFilter: z.string(),      // "Clear"

  // Price filter
  minPriceLabel: z.string(),          // "Min Price"
  maxPriceLabel: z.string(),          // "Max Price"
  quickMinLabel: z.string(),          // "Quick Min"
  quickMaxLabel: z.string(),          // "Quick Max"
  clearPriceFilter: z.string(),       // "Clear"
});

// Product Detail Page Text
export const ProductDetailTextSchema = z.object({
  // Trust badges
  freeShipping: z.string(),           // "Free Shipping"
  securePayment: z.string(),          // "Secure Payment"
  easyReturns: z.string(),            // "Easy Returns"

  // Tab labels
  descriptionTab: z.string(),         // "Description"
  shippingTab: z.string(),            // "Shipping"
  reviewsTab: z.string(),             // "Reviews"
  noDescriptionAvailable: z.string(), // "No description available for this product."

  // Product info
  qtyLabel: z.string(),               // "Qty"
  qtyLabelWithColon: z.string(),      // "Qty:"
  shareButton: z.string(),            // "Share"

  // Variant selection labels
  colorLabel: z.string(),             // "Color"
  sizeLabel: z.string(),              // "Size"
  selectOptionLabel: z.string(),      // "Select Option"
  pleaseSelectSize: z.string(),       // "Please select a size"
  pleaseSelectOption: z.string(),     // "Please select an option"

  // Stock messages
  onlyXLeft: z.string(),              // "Only {count} left!"
  inStockWithCount: z.string(),       // "In Stock ({count} available)"
  sellingFast: z.string(),            // "Selling fast!"
  savePercent: z.string(),            // "Save {percent}%"

  // Review pluralization
  reviewSingular: z.string(),         // "review"
  reviewPlural: z.string(),           // "reviews"

  // Image gallery labels
  zoomInLabel: z.string(),            // "Zoom in"
  zoomOutLabel: z.string(),           // "Zoom out"
  previousImageLabel: z.string(),     // "Previous image"
  nextImageLabel: z.string(),         // "Next image"

  // Reviews section
  noReviewsYet: z.string(),           // "No reviews yet. Be the first to review this product!"
  writeReviewTitle: z.string(),       // "Write a Review"

  // Review form
  ratingRequired: z.string(),         // "Rating *"
  reviewTitleRequired: z.string(),    // "Review Title *"
  reviewTitlePlaceholder: z.string(), // "Summarize your review"
  reviewRequired: z.string(),         // "Review *"
  reviewPlaceholder: z.string(),      // "Share your experience with this product..."
  characterCount: z.string(),         // "{count} / 2000 characters"
  imagesOptional: z.string(),         // "Images (Optional)"
  noFileChosen: z.string(),           // "No file chosen"
  uploadImagesHint: z.string(),       // "Upload up to 5 images (max 5MB each)"
  submitReviewButton: z.string(),     // "Submit Review"

  // Review display
  helpfulCount: z.string(),           // "{count} people found this helpful"
  helpfulButton: z.string(),          // "Helpful"
  helpfulButtonWithCount: z.string(), // "Helpful ({count})"
  verifiedPurchase: z.string(),       // "Verified Purchase"
  editReview: z.string(),             // "Edit"
  deleteReview: z.string(),           // "Delete"

  // Review filters
  allRatings: z.string(),             // "All Ratings"
  verifiedOnly: z.string(),           // "Verified Only"

  // Review delete modal
  deleteReviewTitle: z.string(),      // "Delete Review"
  deleteReviewMessage: z.string(),    // "Are you sure you want to delete this review? This action cannot be undone."
  cancelButton: z.string(),           // "Cancel"
  deletingButton: z.string(),         // "Deleting..."

  // Review time formatting
  justNow: z.string(),                // "just now"
  minutesAgo: z.string(),             // "{count} minutes ago"
  hoursAgo: z.string(),               // "{count} hours ago"
  daysAgo: z.string(),                // "{count} days ago"

  // Shipping information
  freeStandardShippingTitle: z.string(),      // "Free Standard Shipping"
  freeStandardShippingDescription: z.string(), // "On orders over $75. Delivery in 5-7 business days."
  expressShippingTitle: z.string(),           // "Express Shipping"
  expressShippingDescription: z.string(),     // "{price}. Delivery in 2-3 business days."

  // Review list and loading states
  loadingReviews: z.string(),                 // "Loading reviews..."
  reviewCountText: z.string(),                // "{count} review" or "{count} reviews" (handled by pluralization)
  noReviewsMatchFilters: z.string(),          // "No reviews match your filters."
  clearFilters: z.string(),                   // "Clear Filters"
  clearFiltersLowercase: z.string(),          // "Clear filters"
  tryAgain: z.string(),                       // "Try again"
  failedToLoadReviews: z.string(),            // "Failed to load reviews. Please try again."
  loadMoreReviews: z.string(),                // "Load More Reviews"
  starsLabel: z.string(),                     // "{count} Stars" or "{count} Star" (for filter dropdown)

  // Review form labels (for edit form)
  ratingLabel: z.string(),                    // "Rating"
  titleLabel: z.string(),                     // "Title"
  reviewLabel: z.string(),                    // "Review"

  // Review form states and messages
  uploadingImages: z.string(),                // "Uploading and compressing images..."
  savingButton: z.string(),                   // "Saving..."
  saveButton: z.string(),                     // "Save"
  submittingButton: z.string(),               // "Submitting..."
  thankYouMessage: z.string(),                // "Thank you for your review!"
  reviewSubmittedMessage: z.string(),         // "Your review has been submitted and will be visible after moderation."

  // Review form validation messages
  pleaseSelectRating: z.string(),             // "Please select a rating"
  pleaseEnterReviewTitle: z.string(),         // "Please enter a review title"
  pleaseEnterReviewBody: z.string(),          // "Please enter a review body"
  maxImagesError: z.string(),                 // "Maximum 5 images allowed per review"
  onlyXMoreImagesError: z.string(),           // "Only {count} more image(s) can be uploaded (max 5 total)"
  failedToSubmitReview: z.string(),           // "Failed to submit review"
  failedToSubmitReviewRetry: z.string(),      // "Failed to submit review. Please try again."
  mustBeLoggedInToReview: z.string(),         // "You must be logged in to submit a review. Please log in and try again."
  failedToUpdateReview: z.string(),           // "Failed to update review"
  failedToDeleteReview: z.string(),           // "Failed to delete review"
  failedToUploadImages: z.string(),           // "Failed to upload images"
});

// Account Dashboard Text
export const AccountDashboardTextSchema = z.object({
  totalOrders: z.string(),            // "Total Orders"
  wishlistItems: z.string(),          // "Wishlist Items"
  savedAddresses: z.string(),         // "Saved Addresses"
  memberSince: z.string(),            // "Member Since"
  welcomeBack: z.string(),            // "Welcome back, {name}"
  welcomeBackMessage: z.string(),     // "Here's what's happening with your account today."
  accountSummary: z.string(),         // "here's what's happening with your account today"
  recentOrders: z.string(),           // "Recent Orders"
  viewAllButton: z.string(),           // "View All →"
  viewButton: z.string(),             // "View"
  orderLabel: z.string(),             // "Order"
  orderNumberPrefix: z.string(),      // "Order #"
  noOrdersYet: z.string(),            // "No orders yet"
  whenYouPlaceOrder: z.string(),      // "When you place an order, it will appear here."
  noRecentOrders: z.string(),         // "No recent orders"
  startShopping: z.string(),          // "Start Shopping"
});

// Order Tracking Text (for non-logged-in users)
export const OrderTrackingTextSchema = z.object({
  title: z.string(),                           // "Track Your Order"
  description: z.string(),                     // "Enter your order number and email address..."
  orderNumberLabel: z.string(),                // "Order Number"
  orderNumberPlaceholder: z.string(),          // "e.g., 12345"
  orderNumberHelp: z.string(),                 // "You can find your order number in your confirmation email."
  emailLabel: z.string(),                      // "Email Address"
  emailPlaceholder: z.string(),                // "your@email.com"
  emailHelp: z.string(),                       // "The email address you used when placing the order."
  trackButton: z.string(),                     // "Track Order"
  trackingButton: z.string(),                  // "Tracking..."
  errorNotFound: z.string(),                   // "Order not found. Please check your order number and email address."
  errorGeneric: z.string(),                    // "An error occurred while tracking your order. Please try again."
  backToTracking: z.string(),                  // "Track Another Order"
  orderFoundTitle: z.string(),                 // "Order Details"
  createAccountTitle: z.string(),              // "Create an Account"
  createAccountDescription: z.string(),        // "Sign up to track all your orders, save your addresses, and enjoy faster checkout."
  createAccountButton: z.string(),             // "Create Account"
  needHelpText: z.string(),                    // "Need help?"
  contactSupportLink: z.string(),              // "Contact Support"
});

// FAQ Item Schema
export const FAQItemSchema = z.object({
  question: z.string(),                       // "What are your shipping times?"
  answer: z.string(),                          // "Most orders ship within 24 hours..."
});

// Contact Page Text
export const ContactTextSchema = z.object({
  heroTitle: z.string(),                       // "Get in Touch"
  heroDescription: z.string(),                 // "Have a question or need help? We're here for you. Reach out through any of the channels below or fill out the contact form."
  // Contact method labels
  emailLabel: z.string(),                      // "Email"
  phoneLabel: z.string(),                      // "Phone"
  addressLabel: z.string(),                    // "Address"
  // Contact form
  formTitle: z.string(),                       // "Send Us a Message"
  formDescription: z.string(),                 // "We'll get back to you within 24 hours."
  nameLabel: z.string(),                       // "Your Name"
  namePlaceholder: z.string(),                 // "John Doe"
  emailLabelForm: z.string(),                  // "Email Address" (for form field)
  emailPlaceholder: z.string(),                // "john@example.com"
  subjectLabel: z.string(),                    // "Subject"
  subjectPlaceholder: z.string(),              // "How can we help?"
  messageLabel: z.string(),                    // "Message"
  messagePlaceholder: z.string(),              // "Tell us more about your inquiry..."
  sendButton: z.string(),                      // "Send Message"
  sendingButton: z.string(),                   // "Sending..."
  successTitle: z.string(),                    // "Message Sent!"
  successDescription: z.string(),              // "Thank you for reaching out. We'll be in touch soon."
  sendAnotherMessage: z.string(),              // "Send another message"
  // FAQs
  faqsTitle: z.string(),                       // "Frequently Asked Questions"
  faqsDescription: z.string(),                 // "Find quick answers to common questions."
  faqs: z.array(FAQItemSchema).optional(),     // Array of FAQ items
  viewAllFaqs: z.string(),                     // "View All FAQs"
  // Social section
  followUsTitle: z.string(),                   // "Follow Us"
  followUsDescription: z.string(),             // "Stay connected for updates, tips, and exclusive offers."
});

// Orders Page Text
export const OrdersTextSchema = z.object({
  myOrdersTitle: z.string(),           // "My Orders"
  ordersPlacedCount: z.string(),       // "{count} order(s) placed"
  orderNumber: z.string(),            // "Order Number"
  orderLabel: z.string(),             // "Order"
  orderNumberPrefix: z.string(),      // "Order #"
  datePlaced: z.string(),             // "Date Placed"
  totalLabel: z.string(),             // "TOTAL"
  getInvoice: z.string(),             // "Get Invoice"
  downloadInvoice: z.string(),        // "Download Invoice"
  viewDetails: z.string(),            // "View Details"
  trackPackage: z.string(),           // "Track Package"
  buyAgain: z.string(),              // "Buy Again"
  showAllOrders: z.string(),          // "Show All Orders ({count})"
  showLess: z.string(),               // "Show Less"
  ordersPlaced: z.string(),           // "Orders Placed"
  noOrders: z.string(),               // "No orders yet"
  noOrdersMessage: z.string(),        // "When you place an order, it will appear here"
  noOrdersYetMessage: z.string(),     // "Looks like you haven't placed any orders yet. Start shopping to see your orders here!"
  orderStatus: z.string(),            // "Status"
  trackOrder: z.string(),             // "Track Order"
  qtyLabel: z.string(),               // "Qty:"
  remainingItems: z.string(),         // "+{count}"
  generatingInvoice: z.string(),      // "Generating Invoice..."
  generateDownloadInvoice: z.string(), // "Generate & Download Invoice"
  invoiceAvailable: z.string(),       // "Invoice Available"
  invoiceAvailableMessage: z.string(), // "Click below to generate and download your invoice as a PDF."
  invoicePending: z.string(),          // "Invoice Pending"
  invoicePendingMessage: z.string(),   // "Invoices are generated once payment is completed..."
  invoiceWillBeGenerated: z.string(),  // "Your invoice will be generated instantly and downloaded as a PDF."
  needInvoiceSooner: z.string(),       // "Need your invoice sooner? Please contact our support team."
  close: z.string(),                   // "Close"
  invoiceModalTitle: z.string(),       // "Invoice"
  trackingModalTitle: z.string(),      // "Track Package"
  trackingNumberLabel: z.string(),     // "Tracking Number"
  statusLabel: z.string(),             // "Status:"
  trackPackageDescription: z.string(), // "Track your package using any of the services below:"
  universalTrackers: z.string(),       // "Universal Trackers (Recommended)"
  directCarrierLinks: z.string(),      // "Direct Carrier Links"
  loading: z.string(),                 // "Loading..."
  // Order Details Page
  backToOrders: z.string(),            // "Back to Orders"
  placedOn: z.string(),                // "Placed on"
  orderItemsTitle: z.string(),         // "Order Items ({count})"
  viewProduct: z.string(),             // "View Product"
  orderSummaryTitle: z.string(),       // "Order Summary"
  subtotalLabel: z.string(),           // "Subtotal"
  shippingLabel: z.string(),           // "Shipping"
  shippingFree: z.string(),            // "Free"
  totalLabelDetails: z.string(),       // "Total"
  shippingAddressTitle: z.string(),    // "Shipping Address"
  billingAddressTitle: z.string(),     // "Billing Address"
  shipmentTrackingTitle: z.string(),   // "Shipment Tracking"
  statusLabelDetails: z.string(),      // "Status"
  trackingNumberLabelDetails: z.string(), // "Tracking #"
  invoiceTitle: z.string(),            // "Invoice"
  invoiceNumberPrefix: z.string(),     // "Invoice #"
  downloadButton: z.string(),          // "Download"
  generatingText: z.string(),          // "Generating..."
  unavailableText: z.string(),         // "Unavailable"
  quickActionsTitle: z.string(),       // "Quick Actions"
  needHelpTitle: z.string(),           // "Need Help?"
  contactSupportButton: z.string(),    // "Contact Support"
  viewFaqsButton: z.string(),          // "View FAQs"
  // Order Status Labels
  statusProcessing: z.string(),        // "Processing"
  statusPartiallyShipped: z.string(),  // "Partially Shipped"
  statusShipped: z.string(),           // "Shipped"
  statusDelivered: z.string(),         // "Delivered"
  statusCanceled: z.string(),          // "Canceled"
  statusReturned: z.string(),          // "Returned"
  // Payment Status Labels
  paymentPending: z.string(),          // "Pending"
  paymentPartiallyPaid: z.string(),    // "Partially Paid"
  paymentPaid: z.string(),             // "Paid"
  paymentPartiallyRefunded: z.string(), // "Partially Refunded"
  paymentRefunded: z.string(),         // "Refunded"
  paymentFailed: z.string(),           // "Payment Failed"
  paymentCancelled: z.string(),        // "Cancelled"
  // Reorder Button
  reorderItems: z.string(),            // "Reorder Items ({count})"
  addingToCart: z.string(),            // "Adding to Cart..."
  itemsAddedToCart: z.string(),        // "{count} item(s) added to cart!"
  redirectingToCart: z.string(),       // "Redirecting to cart..."
  tryAgain: z.string(),                // "Try Again"
});

// Addresses Page Text
export const AddressesTextSchema = z.object({
  myAddresses: z.string(),            // "My Addresses"
  addressesCount: z.string(),         // "{count} address(es) saved"
  noAddressesYet: z.string(),         // "No addresses saved yet"
  addAddressButton: z.string(),       // "Add Address"
  defaultShipping: z.string(),        // "Default Shipping"
  defaultBilling: z.string(),         // "Default Billing"
  shippingAndBilling: z.string(),     // "Shipping & Billing"
  shippingAddress: z.string(),        // "Shipping Address"
  billingAddress: z.string(),        // "Billing Address"
  savedAddress: z.string(),           // "Saved Address"
  setAsDefault: z.string(),           // "Set as Default"
  noAddresses: z.string(),            // "No addresses saved"
  noAddressesMessage: z.string(),     // "Add your first address to speed up checkout"
  noAddressesCheckoutMessage: z.string(), // "Your shipping and billing addresses will be saved here when you complete checkout."
  // Form and actions
  addNewAddressTitle: z.string(),    // "Add New Address"
  addAddressDescription: z.string(), // "Adding new addresses requires going through checkout. Your addresses will be saved automatically when you complete a purchase."
  editButton: z.string(),             // "Edit"
  deleteButton: z.string(),          // "Delete"
  continueShoppingButton: z.string(), // "Continue Shopping" (in addresses context)
  startShopping: z.string(),         // "Start Shopping"
  cancel: z.string(),                 // "Cancel"
});

// Wishlist Page Text
export const WishlistTextSchema = z.object({
  myWishlistTitle: z.string(),         // "My Wishlist"
  itemsCount: z.string(),              // "{count} item(s) saved"
  loadingWishlist: z.string(),        // "Loading wishlist..."
  emptyWishlistTitle: z.string(),     // "Your wishlist is empty"
  emptyWishlistMessage: z.string(),   // "Save items you love by clicking the heart icon on any product."
  discoverProductsButton: z.string(), // "Discover Products"
  clearAllButton: z.string(),         // "Clear All"
  itemsSaved: z.string(),             // "{count} item(s) saved"
  viewProduct: z.string(),            // "View Product"
  viewDetails: z.string(),            // "View Details" (when out of stock)
  outOfStock: z.string(),             // "Out of Stock"
  addedOn: z.string(),                // "Added {date}"
  removeFromWishlist: z.string(),     // "Remove"
  moveToCart: z.string(),             // "Add to Cart"
  removeFromWishlistTooltip: z.string(), // "Remove from wishlist"
});

// Settings Page Text
export const SettingsTextSchema = z.object({
  // Page header
  accountSettings: z.string(),         // "Account Settings"
  settingsSubtitle: z.string(),        // "Manage your profile, security, and notification preferences"

  // Profile section
  profileInformation: z.string(),      // "Profile Information"
  updatePersonalDetails: z.string(),   // "Update your personal details"
  saveChangesButton: z.string(),       // "Save Changes"
  savingChanges: z.string(),           // "Saving..."
  changesSaved: z.string(),            // "Changes saved successfully"

  // Password section
  changePassword: z.string(),          // "Change Password"
  passwordSecurityNote: z.string(),    // "Update your password to keep your account secure"
  currentPassword: z.string(),         // "Current Password"
  newPasswordLabel: z.string(),        // "New Password"
  confirmNewPassword: z.string(),      // "Confirm New Password"
  updatePasswordButton: z.string(),    // "Update Password"
  passwordUpdated: z.string(),         // "Password updated successfully"

  // Notifications section
  notificationPreferences: z.string(), // "Notification Preferences"
  notificationSubtitle: z.string(),    // "Choose how you want to receive updates"
  orderUpdates: z.string(),            // "Order Updates"
  orderUpdatesDesc: z.string(),        // "Receive notifications about your order status"
  promotionsOffers: z.string(),        // "Promotions & Offers"
  promotionsDesc: z.string(),          // "Get notified about sales and exclusive deals"
  newsletterSetting: z.string(),       // "Newsletter"
  newsletterDesc: z.string(),          // "Weekly updates about new arrivals and trends"
  smsNotifications: z.string(),        // "SMS Notifications"
  smsDesc: z.string(),                 // "Receive text messages for important updates"

  // Danger zone
  dangerZone: z.string(),              // "Danger Zone"
  deleteAccountWarning: z.string(),    // "Permanently delete your account and all associated data"
  deleteAccountButton: z.string(),     // "Delete Account"
  confirmDeleteTitle: z.string(),      // "Delete Account?"
  confirmDeleteMessage: z.string(),    // "This action cannot be undone. All your data will be permanently removed."
});

// Footer Text (including legal links)
export const FooterTextSchema = z.object({
  // Legal links
  privacyPolicyLink: z.string(),       // "Privacy Policy"
  termsOfServiceLink: z.string(),      // "Terms of Service"
  shippingLink: z.string(),            // "Shipping"
  returnPolicyLink: z.string(),        // "Return Policy"

  // Other footer text
  allRightsReserved: z.string(),       // "All rights reserved"
  madeWith: z.string(),                // "Made with"
  inLocation: z.string(),              // "in {location}"

  // Contact section
  contactUs: z.string(),               // "Contact Us"
  customerService: z.string(),         // "Customer Service"

  // Navigation sections
  shopTitle: z.string(),               // "Shop"
  companyTitle: z.string(),            // "Company"
  supportTitle: z.string(),            // "Support"
  followUsTitle: z.string(),           // "Follow Us"
  trackOrderLink: z.string().optional(), // "Track Order" (optional for backward compatibility)
});

// Navbar Text
export const NavbarTextSchema = z.object({
  selectChannel: z.string(),           // "Select channel/currency"
  searchPlaceholder: z.string(),       // "Search..."
  cartLabel: z.string(),               // "Cart"
  accountLabel: z.string(),            // "Account"
  menuLabel: z.string(),               // "Menu"
  signInText: z.string(),              // "Sign In" (for navbar login link)
  // Mobile navigation
  homeLabel: z.string(),                // "Home"
  shopLabel: z.string(),                // "Shop"
});

// Error Page Text
export const ErrorTextSchema = z.object({
  title: z.string(),                              // "Something went wrong"
  description: z.string(),                        // "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."
  errorDetails: z.string(),                        // "Error details"
  tryAgainButton: z.string(),                     // "Try Again"
  backToHomeButton: z.string(),                   // "Back to Home"
  needHelpText: z.string(),                       // "Need help?"
  contactSupportLink: z.string(),                 // "Contact our support team"
});

// 404 Not Found Page Text
export const NotFoundTextSchema = z.object({
  title: z.string(),                              // "Page Not Found"
  description: z.string(),                        // "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."
  backToHomeButton: z.string(),                   // "Back to Home"
  browseProductsButton: z.string(),               // "Browse Products"
  helpfulLinksText: z.string(),                   // "Or check out these pages:"
});

export const ContentSchema = z.object({
  cart: CartTextSchema,
  product: ProductTextSchema,
  account: AccountTextSchema,
  general: GeneralTextSchema,
  homepage: HomepageTextSchema,
  checkout: CheckoutTextSchema,
  filters: FiltersTextSchema,
  productDetail: ProductDetailTextSchema,
  dashboard: AccountDashboardTextSchema,
  orders: OrdersTextSchema,
  orderTracking: OrderTrackingTextSchema.optional(), // Optional for backward compatibility
  contact: ContactTextSchema.optional(), // Optional for backward compatibility
  addresses: AddressesTextSchema,
  wishlist: WishlistTextSchema,
  settings: SettingsTextSchema,
  footer: FooterTextSchema,
  navbar: NavbarTextSchema,
  error: ErrorTextSchema,
  notFound: NotFoundTextSchema,
});

// ============================================
// FULL CONFIG SCHEMA
// ============================================
export const StorefrontConfigSchema = z.object({
  version: z.number(),
  updatedAt: z.string().optional(), // ISO timestamp when config was last updated
  channelSlug: z.string(),
  store: StoreSchema,
  branding: BrandingSchema,
  features: FeaturesSchema,
  ecommerce: EcommerceSchema,
  header: HeaderSchema,
  footer: FooterSchema,
  homepage: HomepageSchema,
  pages: PagesSchema,
  integrations: IntegrationsSchema,
  seo: SeoSchema,
  localization: LocalizationSchema,
  filters: FiltersSchema,
  quickFilters: QuickFiltersSchema,
  promoPopup: PromoPopupSchema,
  ui: UiSchema,
  content: ContentSchema,
  darkMode: DarkModeSchema,
});

export type StorefrontConfig = z.infer<typeof StorefrontConfigSchema>;
export type StoreType = z.infer<typeof StoreTypeSchema>;
export type BorderRadius = z.infer<typeof BorderRadiusSchema>;
export type ButtonStyle = z.infer<typeof ButtonStyleSchema>;
export type CardShadow = z.infer<typeof CardShadowSchema>;
export type HeroType = z.infer<typeof HeroTypeSchema>;
export type TimeFormat = z.infer<typeof TimeFormatSchema>;
export type Direction = z.infer<typeof DirectionSchema>;
export type FontSize = z.infer<typeof FontSizeSchema>;
export type HeroSlide = z.infer<typeof HeroSlideSchema>;
export type PromoPopup = z.infer<typeof PromoPopupSchema>;
export type HeaderConfig = z.infer<typeof HeaderSchema>;
export type HeaderBanner = z.infer<typeof HeaderBannerSchema>;
export type LogoPosition = z.infer<typeof LogoPositionSchema>;
export type FooterConfig = z.infer<typeof FooterSchema>;
export type UiConfig = z.infer<typeof UiSchema>;
export type ContentConfig = z.infer<typeof ContentSchema>;
export type ButtonsConfig = z.infer<typeof ButtonsSchema>;
export type BadgesConfig = z.infer<typeof BadgesSchema>;
export type ProductCardConfig = z.infer<typeof ProductCardSchema>;
export type ToastsConfig = z.infer<typeof ToastsSchema>;
export type DarkModeConfig = z.infer<typeof DarkModeSchema>;
export type DarkModeColors = z.infer<typeof DarkModeColorsSchema>;
export type HomepageSectionId = z.infer<typeof HomepageSectionIdSchema>;
export type FiltersText = z.infer<typeof FiltersTextSchema>;
export type QuickFiltersStyle = z.infer<typeof QuickFiltersStyleSchema>;
export type ProductDetailText = z.infer<typeof ProductDetailTextSchema>;
export type AccountDashboardText = z.infer<typeof AccountDashboardTextSchema>;
export type OrdersText = z.infer<typeof OrdersTextSchema>;
export type OrderTrackingText = z.infer<typeof OrderTrackingTextSchema>;
export type ContactText = z.infer<typeof ContactTextSchema>;
export type AddressesText = z.infer<typeof AddressesTextSchema>;
export type WishlistText = z.infer<typeof WishlistTextSchema>;
export type SettingsText = z.infer<typeof SettingsTextSchema>;
export type FooterText = z.infer<typeof FooterTextSchema>;
export type ErrorText = z.infer<typeof ErrorTextSchema>;
export type NotFoundText = z.infer<typeof NotFoundTextSchema>;
export type NavbarText = z.infer<typeof NavbarTextSchema>;
