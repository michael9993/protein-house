import { z } from "zod";
import { ThemeColor } from "./primitives";

// ============================================
// FILTERS SCHEMA
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
// QUICK FILTERS SCHEMA
// ============================================

export const QuickFiltersStyleSchema = z.object({
  cardWidth: z.number(),
  cardHeight: z.number(),
  cardGap: z.number(),
  titleFontSize: z.enum(["xs", "sm", "base", "lg", "xl"]),
  titleFontWeight: z.enum(["normal", "medium", "semibold", "bold"]),
  arrowSize: z.number(),
  arrowIconSize: z.number(),
  titleColor: ThemeColor,
  valueColor: ThemeColor,
  activeValueColor: ThemeColor,
  shopAllButtonBackgroundColor: ThemeColor,
  shopAllButtonTextColor: ThemeColor,
  shopAllButtonHoverBackgroundColor: ThemeColor,
  shopAllButtonBorderColor: ThemeColor,
  navbarMode: z.object({
    buttonPaddingX: z.number().optional(),
    buttonPaddingY: z.number().optional(),
    buttonFontSize: z.enum(["xs", "sm", "base"]).optional(),
    buttonFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
    buttonBorderRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional(),
    buttonGap: z.number().optional(),
    groupLabelFontSize: z.enum(["xs", "sm"]).optional(),
    groupLabelPaddingX: z.number().optional(),
    groupLabelPaddingY: z.number().optional(),
    separatorWidth: z.number().optional(),
    separatorHeight: z.number().optional(),
    containerPaddingY: z.number().optional(),
    backgroundColor: ThemeColor.optional(),
    borderTopColor: ThemeColor.optional(),
    borderBottomColor: ThemeColor.optional(),
    shadowColor: ThemeColor.optional(),
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
  style: QuickFiltersStyleSchema.optional(),
});
