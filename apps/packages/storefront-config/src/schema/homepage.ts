import { z } from "zod";
import {
  CardConfigSchema,
  CtaSchema,
  SectionBackgroundSchema,
  StarRatingSchema,
  ThemeColor,
} from "./primitives";

// ============================================
// HERO SECTION
// ============================================

export const HeroTypeSchema = z.enum(["image", "video", "slider"]);

export const HeroSlideSchema = z.object({
  imageUrl: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  ctaLink: z.string(),
});

export const HeroSectionSchema = z.object({
  enabled: z.boolean(),
  type: HeroTypeSchema,
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  ctaLink: z.string(),
  badgeText: z.string().nullable().optional(),
  imageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  slides: z.array(HeroSlideSchema).optional(),
  overlayOpacity: z.number().min(0).max(100),
  textAlignment: z.enum(["left", "center", "right", "start", "end"]),
  autoRotateSeconds: z.number().min(0).max(15).optional(),
  showProgressBar: z.boolean().optional(),
  showNavDots: z.boolean().optional(),
});

// ============================================
// TRUST STRIP SECTION
// ============================================

export const TrustStripSectionSchema = z.object({
  enabled: z.boolean(),
  freeShippingText: z.string().nullable(),
  easyReturnsText: z.string().nullable(),
  secureCheckoutText: z.string().nullable(),
  supportText: z.string().nullable(),
  background: SectionBackgroundSchema,
});

// ============================================
// MARQUEE SECTION
// ============================================

export const MarqueeSectionSchema = z.object({
  enabled: z.boolean(),
  text: z.string(),
  speedSeconds: z.number().min(2).max(120).default(20),
  textColor: ThemeColor.optional(),
  background: SectionBackgroundSchema,
});

// ============================================
// BRAND GRID SECTION
// ============================================

export const BrandGridSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  maxBrands: z.number().min(4).max(20),
  showLogos: z.boolean(),
  layout: z.enum(["grid", "marquee"]),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// CATEGORIES SECTION
// ============================================

export const CategoriesSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  maxCategories: z.number().min(4).max(12),
  showProductCount: z.boolean(),
  showSubcategories: z.boolean(),
  layoutStyle: z.enum(["mosaic", "grid", "carousel"]),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// TRENDING SECTION
// ============================================

export const TrendingSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  collectionSlug: z.string(),
  fallbackToNewest: z.boolean(),
  maxProducts: z.number().min(4).max(12),
  layout: z.enum(["grid", "carousel"]),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// PROMOTION BANNER SECTION
// ============================================

export const PromotionBannerSectionSchema = z.object({
  enabled: z.boolean(),
  badgeText: z.string(),
  title: z.string(),
  highlight: z.string(),
  description: z.string(),
  primaryCta: CtaSchema,
  secondaryCta: CtaSchema.optional(),
  autoDetectDiscount: z.boolean(),
  background: SectionBackgroundSchema,
});

// ============================================
// FLASH DEALS SECTION
// ============================================

export const FlashDealsSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  badgeTemplate: z.string(),
  collectionSlug: z.string(),
  maxProducts: z.number().min(4).max(12),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// COLLECTION MOSAIC SECTION
// ============================================

export const CollectionMosaicSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  maxCollections: z.number().min(3).max(8),
  excludeSlugs: z.array(z.string()),
  layoutStyle: z.enum(["mosaic", "grid"]),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// BEST SELLERS SECTION
// ============================================

export const BestSellersSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  collectionSlug: z.string(),
  fallbackToTopRated: z.boolean(),
  maxProducts: z.number().min(4).max(12),
  layout: z.enum(["grid", "carousel", "horizontal-scroll"]),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// CUSTOMER FEEDBACK SECTION (consolidates TestimonialsSectionSchema)
// ============================================

export const CustomerFeedbackSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  maxReviews: z.number().min(1).max(6),
  minRating: z.number().min(1).max(5),
  showProductName: z.boolean(),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
  ...StarRatingSchema.shape,
});

// ============================================
// NEWSLETTER SECTION
// ============================================

export const NewsletterSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  buttonText: z.string().nullable(),
  placeholder: z.string().nullable(),
  layout: z.enum(["inline", "stacked", "split"]),
  background: SectionBackgroundSchema,
});

// ============================================
// LEGACY SECTION SCHEMAS (kept for migration parsing)
// ============================================

export const LimitedSectionSchema = z.object({
  enabled: z.boolean(),
  limit: z.number().min(1).max(20),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

export const SimpleSectionSchema = z.object({
  enabled: z.boolean(),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

export const TestimonialsSectionSchema = z.object({
  enabled: z.boolean(),
  background: SectionBackgroundSchema,
  starColor: ThemeColor.optional(),
  starEmptyColor: ThemeColor.optional(),
  starSize: z.enum(["xs", "sm", "base", "lg", "xl"]).optional(),
  loadingReviewsText: z.string().nullable().optional(),
  verifiedPurchaseLabel: z.string().nullable().optional(),
  customerLabel: z.string().nullable().optional(),
  card: z.object({
    backgroundColor: ThemeColor.optional(),
    borderColor: ThemeColor.optional(),
    borderRadius: z.string().nullable().optional(),
    padding: z.string().nullable().optional(),
    shadow: z.string().nullable().optional(),
    hoverShadow: z.string().nullable().optional(),
    hoverTransform: z.string().nullable().optional(),
  }).optional(),
  trustBadges: z.object({
    showAverageRating: z.boolean().optional(),
    showCustomerCount: z.boolean().optional(),
    showSatisfactionRate: z.boolean().optional(),
    showOrdersDelivered: z.boolean().optional(),
    borderColor: ThemeColor.optional(),
    textColor: ThemeColor.optional(),
  }).optional(),
});

export const InstagramSectionSchema = z.object({
  enabled: z.boolean(),
  username: z.string().nullable(),
  background: SectionBackgroundSchema,
});

export const FeatureSectionSchema = z.object({
  enabled: z.boolean(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  imagePosition: z.enum(["left", "right"]).default("left"),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  background: SectionBackgroundSchema,
  card: CardConfigSchema.optional(),
});

// ============================================
// HOMEPAGE SECTIONS ASSEMBLY
// ============================================

export const HomepageSectionsSchema = z.object({
  // Core sections
  hero: HeroSectionSchema,
  trustStrip: TrustStripSectionSchema,
  marquee: MarqueeSectionSchema,
  brandGrid: BrandGridSectionSchema,
  categories: CategoriesSectionSchema,
  trending: TrendingSectionSchema,
  promotionBanner: PromotionBannerSectionSchema,
  flashDeals: FlashDealsSectionSchema,
  collectionMosaic: CollectionMosaicSectionSchema,
  bestSellers: BestSellersSectionSchema,
  customerFeedback: CustomerFeedbackSectionSchema,
  newsletter: NewsletterSectionSchema,
  recentlyViewed: SimpleSectionSchema.optional(),
  // Legacy sections (kept for backward-compatible parsing, will be migrated)
  featuredCategories: LimitedSectionSchema.optional(),
  newArrivals: LimitedSectionSchema.optional(),
  feature: FeatureSectionSchema.optional(),
  onSale: LimitedSectionSchema.optional(),
  featuredBrands: SimpleSectionSchema.optional(),
  testimonials: TestimonialsSectionSchema.optional(),
  instagramFeed: InstagramSectionSchema.optional(),
});

export const HomepageSectionIdSchema = z.enum([
  "hero",
  "trustStrip",
  "marquee",
  "brandGrid",
  "categories",
  "trending",
  "promotionBanner",
  "flashDeals",
  "collectionMosaic",
  "bestSellers",
  "customerFeedback",
  "newsletter",
  "recentlyViewed",
  // Legacy IDs (for backward-compatible parsing)
  "featuredCategories",
  "newArrivals",
  "feature",
  "onSale",
  "featuredBrands",
  "testimonials",
  "instagramFeed",
]);

export const DEFAULT_SECTION_ORDER: z.infer<typeof HomepageSectionIdSchema>[] = [
  "hero",
  "trustStrip",
  "marquee",
  "brandGrid",
  "categories",
  "trending",
  "promotionBanner",
  "flashDeals",
  "collectionMosaic",
  "bestSellers",
  "customerFeedback",
  "newsletter",
  "recentlyViewed",
];

export const HomepageSchema = z.object({
  sections: HomepageSectionsSchema,
  sectionOrder: z.array(HomepageSectionIdSchema).optional(),
});
