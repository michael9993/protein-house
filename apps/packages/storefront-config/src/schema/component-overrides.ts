import { z } from "zod";
import { ThemeColor, BorderRadiusSchema, CardShadowSchema, FontSizeSchema } from "./primitives";

// ============================================
// COMPONENT STYLE OVERRIDE
// ============================================

/**
 * Schema for a single component's style overrides.
 * All fields are optional — only overridden properties are stored.
 * These generate CSS custom properties (--cd-{key}-{prop}) on the storefront.
 */
export const ComponentStyleOverrideSchema = z.object({
  // Visual
  backgroundColor: ThemeColor.optional(),
  textColor: ThemeColor.optional(),
  borderColor: ThemeColor.optional(),
  borderWidth: z.number().min(0).max(8).optional(),
  borderRadius: BorderRadiusSchema.optional(),
  shadow: CardShadowSchema.optional(),
  opacity: z.number().min(0).max(100).optional(),

  // Gradient support
  backgroundStyle: z.enum(["solid", "gradient", "radial-gradient"]).optional(),
  backgroundSecondaryColor: ThemeColor.optional(),
  gradientDirection: z.enum([
    "to-right", "to-left", "to-bottom", "to-top",
    "to-bottom-right", "to-top-left", "diagonal",
  ]).optional(),

  // Typography
  fontFamily: z.enum(["heading", "body", "mono"]).optional(),
  fontSize: FontSizeSchema.optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold", "extrabold"]).optional(),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),

  // Layout
  padding: z.string().max(50).optional(),
  margin: z.string().max(50).optional(),
  gap: z.string().max(50).optional(),

  // Hover states
  hoverBackgroundColor: ThemeColor.optional(),
  hoverTextColor: ThemeColor.optional(),
  hoverShadow: CardShadowSchema.optional(),

  // Raw Tailwind class override (sanitized via regex)
  customClasses: z.string().max(500).regex(/^[a-zA-Z0-9\s\-:/[\]_.!]*$/).optional(),
});

// ============================================
// COMPONENT OVERRIDES MAP
// ============================================

/**
 * Sparse record: only overridden components exist in the map.
 * Key format: "page.component" (e.g., "homepage.hero", "plp.filterSidebar")
 * Adding new components = registry entry only, no schema changes.
 */
export const ComponentOverridesSchema = z.record(
  z.string(),
  ComponentStyleOverrideSchema
).optional();
