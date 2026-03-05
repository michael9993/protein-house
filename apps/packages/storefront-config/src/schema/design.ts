import { z } from "zod";

// ============================================
// ANIMATION PRESETS
// ============================================

export const AnimationPresetSchema = z.enum(["none", "subtle", "moderate", "dramatic"]);

export const AnimationsSchema = z.object({
  preset: AnimationPresetSchema,
  cardHoverDuration: z.number().min(0).max(1000).optional(),
  cardHoverLift: z.number().min(0).max(8).optional(),
  imageZoomScale: z.number().min(1).max(1.2).optional(),
  imageZoomDuration: z.number().min(0).max(1500).optional(),
  buttonHoverScale: z.number().min(0.95).max(1.1).optional(),
  transitionEasing: z.enum(["ease", "ease-in", "ease-out", "ease-in-out"]).optional(),
  sectionRevealDuration: z.number().min(0).max(1500).optional(),
  marqueeSpeed: z.number().min(10).max(60).optional(),
  heroAutoRotate: z.number().min(0).max(15).optional(),
  carouselCycleSeconds: z.number().min(2).max(30).optional(),
  toastDurationMs: z.number().min(1000).max(10000).optional(),
});

// ============================================
// SPACING
// ============================================

export const SpacingPresetSchema = z.enum(["compact", "normal", "spacious"]);

export const SpacingSchema = z.object({
  sectionPaddingY: SpacingPresetSchema,
  containerMaxWidth: z.number().min(1200).max(1920).optional(),
  containerPaddingX: z.enum(["tight", "normal", "wide"]).optional(),
  cardGap: z.enum(["tight", "normal", "spacious"]).optional(),
});

// ============================================
// GRID
// ============================================

export const GridSchema = z.object({
  productColumns: z.object({
    sm: z.number().min(1).max(3).optional(),
    md: z.number().min(2).max(4).optional(),
    lg: z.number().min(3).max(6).optional(),
    xl: z.number().min(3).max(6).optional(),
  }).optional(),
  productGap: z.enum(["tight", "normal", "spacious"]).optional(),
});

// ============================================
// STATUS COLORS
// ============================================

export const StatusColorsSchema = z.object({
  success: z.string().optional(),
  warning: z.string().optional(),
  error: z.string().optional(),
  info: z.string().optional(),
}).optional();

// ============================================
// FULL DESIGN TOKENS SCHEMA
// ============================================

export const DesignTokensSchema = z.object({
  animations: AnimationsSchema,
  spacing: SpacingSchema,
  grid: GridSchema.optional(),
  statusColors: StatusColorsSchema,
});
