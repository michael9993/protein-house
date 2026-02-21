/**
 * Re-exports from @saleor/apps-storefront-config shared package.
 *
 * All schemas, types, and constants are now defined in the shared package
 * at apps/packages/storefront-config/src/schema/.
 *
 * This file provides backward compatibility so all existing imports
 * (e.g., `import { StorefrontConfigSchema } from "./schema"`) continue to work.
 */

// Re-export all schemas
export {
  // Primitives
  BorderRadiusSchema,
  ButtonStyleSchema,
  CardShadowSchema,
  FontSizeSchema,
  ThemeColor,
  ComponentStyleSchema,
  CtaSchema,
  StarRatingSchema,
  ButtonVariantSchema,
  SectionBackgroundStyleSchema,
  SectionBackgroundSchema,
  CardConfigSchema,

  // Store
  StoreTypeSchema,
  AddressSchema,
  StoreSchema,

  // Branding
  ColorsSchema,
  TypographySchema,
  StyleSchema,
  BrandingSchema,

  // Features
  FeaturesSchema,

  // Ecommerce
  CurrencySettingsSchema,
  ShippingSettingsSchema,
  TaxSettingsSchema,
  InventorySettingsSchema,
  CheckoutSettingsSchema,
  EcommerceSchema,

  // Homepage
  HeroTypeSchema,
  HeroSlideSchema,
  HeroSectionSchema,
  TrustStripSectionSchema,
  MarqueeSectionSchema,
  BrandGridSectionSchema,
  CategoriesSectionSchema,
  TrendingSectionSchema,
  PromotionBannerSectionSchema,
  FlashDealsSectionSchema,
  CollectionMosaicSectionSchema,
  BestSellersSectionSchema,
  CustomerFeedbackSectionSchema,
  NewsletterSectionSchema,
  LimitedSectionSchema,
  SimpleSectionSchema,
  TestimonialsSectionSchema,
  InstagramSectionSchema,
  FeatureSectionSchema,
  HomepageSectionsSchema,
  HomepageSectionIdSchema,
  DEFAULT_SECTION_ORDER,
  HomepageSchema,

  // Header
  HeaderBannerItemSchema,
  ManualBannerItemSchema,
  GradientStopSchema,
  HeaderBannerSchema,
  LogoPositionSchema,
  HeaderSchema,

  // Footer
  LegalLinkSchema,
  FooterSchema,

  // Pages
  PagesSchema,

  // Integrations
  AnalyticsIntegrationsSchema,
  MarketingIntegrationsSchema,
  SupportIntegrationsSchema,
  SocialIntegrationsSchema,
  CookieConsentSchema,
  IntegrationsSchema,

  // SEO
  SeoSchema,

  // Localization
  TimeFormatSchema,
  DirectionSchema,
  DEFAULT_RTL_LOCALES,
  LocalizationSchema,

  // Dark Mode
  DarkModeColorsSchema,
  DarkModeSchema,

  // Filters
  FilterConfigSchema,
  FiltersSchema,
  QuickFiltersStyleSchema,
  QuickFiltersSchema,

  // Promo Popup
  PromoPopupSchema,

  // UI Components
  ButtonsSchema,
  BadgeStyleSchema,
  BadgesSchema,
  InputsSchema,
  CheckboxSchema,
  ProductCardSchema,
  ToastsSchema,
  IconsSchema,
  ActiveFiltersTagsSchema,
  CartUiSchema,
  FilterSidebarSchema,
  UiSchema,

  // Content
  CartTextSchema,
  ProductTextSchema,
  AccountTextSchema,
  GeneralTextSchema,
  HomepageTextSchema,
  CheckoutTextSchema,
  FiltersTextSchema,
  ProductDetailTextSchema,
  AccountDashboardTextSchema,
  OrderTrackingTextSchema,
  FAQItemSchema,
  ContactTextSchema,
  OrdersTextSchema,
  AddressesTextSchema,
  WishlistTextSchema,
  SettingsTextSchema,
  FooterTextSchema,
  NavbarTextSchema,
  ErrorTextSchema,
  NotFoundTextSchema,
  CookieConsentTextSchema,
  ContentSchema,

  // Storefront UX
  StorefrontUXSchema,
  RelatedProductsStrategySchema,
  RelatedProductsSchema,

  // Design Tokens
  AnimationPresetSchema,
  AnimationsSchema,
  SpacingPresetSchema,
  SpacingSchema,
  GridSchema,
  DesignTokensSchema,

  // Full Config
  StorefrontConfigSchema,
} from "@saleor/apps-storefront-config";

// Re-export all types
export type {
  StorefrontConfig,
  StoreType,
  BorderRadius,
  ButtonStyle,
  CardShadow,
  HeroType,
  TimeFormat,
  Direction,
  FontSize,
  HeroSlide,
  PromoPopup,
  HeaderConfig,
  HeaderBannerItem,
  ManualBannerItem,
  HeaderBanner,
  LogoPosition,
  FooterConfig,
  UiConfig,
  ContentConfig,
  ButtonsConfig,
  BadgesConfig,
  ProductCardConfig,
  ToastsConfig,
  DarkModeConfig,
  DarkModeColors,
  HomepageSectionId,
  FiltersText,
  QuickFiltersStyle,
  ProductDetailText,
  AccountDashboardText,
  OrdersText,
  OrderTrackingText,
  ContactText,
  AddressesText,
  WishlistText,
  SettingsText,
  FooterText,
  ErrorText,
  NotFoundText,
  NavbarText,
  RelatedProductsConfig,
  RelatedProductsStrategy,
  DesignTokensConfig,
  TrustStripConfig,
  BrandGridConfig,
  CategoriesConfig,
  TrendingConfig,
  PromotionBannerConfig,
  FlashDealsConfig,
  CollectionMosaicConfig,
  BestSellersConfig,
  CustomerFeedbackConfig,
  NewsletterConfig,
  CtaConfig,
} from "@saleor/apps-storefront-config";
