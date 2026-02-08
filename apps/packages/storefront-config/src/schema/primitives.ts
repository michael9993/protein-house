import { z } from "zod";

// ============================================
// SHARED ENUMS
// ============================================

export const BorderRadiusSchema = z.enum(["none", "sm", "md", "lg", "full"]);
export const ButtonStyleSchema = z.enum(["solid", "outline", "ghost"]);
export const CardShadowSchema = z.enum(["none", "sm", "md", "lg"]);
export const FontSizeSchema = z.enum([
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
]);

// ============================================
// SHARED STYLE PRIMITIVES
// ============================================

/**
 * ThemeColor: nullable string for color overrides.
 * null = inherit from branding/global theme defaults.
 */
export const ThemeColor = z.string().nullable();

/**
 * ComponentStyleSchema: shared by all colored components
 * (buttons, badges, banners, toasts, filter tags, etc.)
 */
export const ComponentStyleSchema = z.object({
  backgroundColor: ThemeColor.optional(),
  textColor: ThemeColor.optional(),
  borderColor: ThemeColor.optional(),
  borderRadius: BorderRadiusSchema.optional(),
});

/**
 * CtaSchema: standardized call-to-action object.
 * Replaces inconsistent ctaText/ctaLink, buttonText/link, text/url patterns.
 */
export const CtaSchema = z.object({
  text: z.string(),
  link: z.string(),
});

/**
 * StarRatingSchema: shared star rating configuration.
 * Used by CustomerFeedbackSectionSchema (consolidates duplicate in TestimonialsSectionSchema).
 */
export const StarRatingSchema = z.object({
  starColor: ThemeColor.optional(),
  starEmptyColor: ThemeColor.optional(),
  starSize: z.enum(["xs", "sm", "base", "lg", "xl"]).optional(),
});

/**
 * ButtonVariantSchema: shared by all button variant definitions
 * (primary, secondary, outline, danger, filter buttons, etc.)
 */
export const ButtonVariantSchema = z.object({
  backgroundColor: ThemeColor,
  textColor: ThemeColor,
  hoverBackgroundColor: ThemeColor,
  borderColor: ThemeColor,
});

// ============================================
// SECTION BACKGROUND (shared by all homepage sections)
// ============================================

export const SectionBackgroundStyleSchema = z.enum([
  "none",
  "solid",
  "gradient",
  "radial-gradient",
  "color-mix",
  "pattern",
  "animated-gradient",
  "glass",
  "mesh",
]);

export const SectionBackgroundSchema = z.object({
  style: SectionBackgroundStyleSchema,
  color: ThemeColor,
  secondaryColor: ThemeColor,
  mixPercentage: z.number().min(0).max(100).optional(),
  gradientDirection: z.enum([
    "to-right", "to-left", "to-bottom", "to-top", "to-bottom-right", "to-top-left", "diagonal",
  ]).optional(),
  patternType: z.enum(["grid", "dots", "lines", "waves"]).optional(),
  patternOpacity: z.number().min(0).max(100).optional(),
  animationSpeed: z.enum(["slow", "normal", "fast"]).optional(),
  glassBlur: z.number().min(0).max(20).optional(),
  glassOpacity: z.number().min(0).max(100).optional(),
  meshOpacity: z.number().min(0).max(100).optional(),
  meshGrade: z.enum(["light", "medium", "deep", "cool", "warm"]).optional(),
}).optional();

// ============================================
// CARD CONFIG (shared by sections with card overrides)
// ============================================

export const CardConfigSchema = z.object({
  aspectRatio: z.enum(["square", "portrait", "landscape", "wide"]).optional(),
  imageFit: z.enum(["cover", "contain", "fill"]).optional(),
  textSize: z.enum(["sm", "base", "lg", "xl"]).optional(),
  textColor: ThemeColor.optional(),
  textPosition: z.enum(["center", "bottom-left", "bottom-center"]).optional(),
  backgroundColor: ThemeColor.optional(),
  opacity: z.number().min(0).max(100).optional(),
  borderRadius: BorderRadiusSchema.optional(),
  shadow: CardShadowSchema.optional(),
});
