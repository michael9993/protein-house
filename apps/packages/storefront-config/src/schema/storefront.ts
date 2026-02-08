import { z } from "zod";

// ============================================
// STOREFRONT UX SCHEMA
// ============================================
// NOTE: cart.drawerSide is duplicated in ui.cart.drawerSide (ui-components schema).
// Storefront reads from storefront.cart for UX behavior and ui.cart for styling.
// TODO: Consolidate into a single location when refactoring.

export const StorefrontUXSchema = z.object({
  cart: z.object({
    displayMode: z.enum(["drawer", "page"]).optional(),
    drawerSide: z.enum(["left", "right"]).optional(),
    showDeleteText: z.boolean().optional(),
    showSaveForLater: z.boolean().optional(),
  }).optional(),
});

// ============================================
// RELATED PRODUCTS SCHEMA
// ============================================

export const RelatedProductsStrategySchema = z.enum(["category", "collection"]);

export const RelatedProductsSchema = z.object({
  enabled: z.boolean(),
  strategy: RelatedProductsStrategySchema,
  maxItems: z.number().min(4).max(16),
  showOnMobile: z.boolean(),
  title: z.string(),
  subtitle: z.string().nullable(),
});
