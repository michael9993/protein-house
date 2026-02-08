import { z } from "zod";
import {
  StorefrontConfigSchema,
  StoreTypeSchema,
  BorderRadiusSchema,
  ButtonStyleSchema,
  CardShadowSchema,
  HeroTypeSchema,
  TimeFormatSchema,
  DirectionSchema,
  FontSizeSchema,
  HeroSlideSchema,
  PromoPopupSchema,
  HeaderSchema,
  HeaderBannerItemSchema,
  ManualBannerItemSchema,
  HeaderBannerSchema,
  LogoPositionSchema,
  FooterSchema,
  UiSchema,
  ContentSchema,
  ButtonsSchema,
  BadgesSchema,
  ProductCardSchema,
  ToastsSchema,
  DarkModeSchema,
  DarkModeColorsSchema,
  HomepageSectionIdSchema,
  FiltersTextSchema,
  QuickFiltersStyleSchema,
  ProductDetailTextSchema,
  AccountDashboardTextSchema,
  OrdersTextSchema,
  OrderTrackingTextSchema,
  ContactTextSchema,
  AddressesTextSchema,
  WishlistTextSchema,
  SettingsTextSchema,
  FooterTextSchema,
  ErrorTextSchema,
  NotFoundTextSchema,
  NavbarTextSchema,
  RelatedProductsSchema,
  RelatedProductsStrategySchema,
  DesignTokensSchema,
  TrustStripSectionSchema,
  BrandGridSectionSchema,
  CategoriesSectionSchema,
  TrendingSectionSchema,
  PromotionBannerSectionSchema,
  FlashDealsSectionSchema,
  CollectionMosaicSectionSchema,
  BestSellersSectionSchema,
  CustomerFeedbackSectionSchema,
  NewsletterSectionSchema,
  CtaSchema,
} from "./schema";

// ============================================
// INFERRED TYPES (Single source of truth)
// ============================================

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
export type HeaderBannerItem = z.infer<typeof HeaderBannerItemSchema>;
export type ManualBannerItem = z.infer<typeof ManualBannerItemSchema>;
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
export type RelatedProductsConfig = z.infer<typeof RelatedProductsSchema>;
export type RelatedProductsStrategy = z.infer<typeof RelatedProductsStrategySchema>;
export type DesignTokensConfig = z.infer<typeof DesignTokensSchema>;

// Homepage section types
export type TrustStripConfig = z.infer<typeof TrustStripSectionSchema>;
export type BrandGridConfig = z.infer<typeof BrandGridSectionSchema>;
export type CategoriesConfig = z.infer<typeof CategoriesSectionSchema>;
export type TrendingConfig = z.infer<typeof TrendingSectionSchema>;
export type PromotionBannerConfig = z.infer<typeof PromotionBannerSectionSchema>;
export type FlashDealsConfig = z.infer<typeof FlashDealsSectionSchema>;
export type CollectionMosaicConfig = z.infer<typeof CollectionMosaicSectionSchema>;
export type BestSellersConfig = z.infer<typeof BestSellersSectionSchema>;
export type CustomerFeedbackConfig = z.infer<typeof CustomerFeedbackSectionSchema>;
export type NewsletterConfig = z.infer<typeof NewsletterSectionSchema>;
export type CtaConfig = z.infer<typeof CtaSchema>;
