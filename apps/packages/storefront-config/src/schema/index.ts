import { z } from "zod";

// Re-export all domain schemas
export * from "./primitives";
export * from "./store";
export * from "./branding";
export * from "./features";
export * from "./ecommerce";
export * from "./homepage";
export * from "./header";
export * from "./footer";
export * from "./pages";
export * from "./integrations";
export * from "./seo";
export * from "./localization";
export * from "./dark-mode";
export * from "./filters";
export * from "./ui-components";
export * from "./promo-popup";
export * from "./content";
export * from "./storefront";
export * from "./design";
export * from "./checkout-ui";
export * from "./component-overrides";

// Import domain schemas for assembly
import { StoreSchema } from "./store";
import { BrandingSchema } from "./branding";
import { FeaturesSchema } from "./features";
import { EcommerceSchema } from "./ecommerce";
import { HomepageSchema } from "./homepage";
import { HeaderSchema } from "./header";
import { FooterSchema } from "./footer";
import { PagesSchema } from "./pages";
import { IntegrationsSchema } from "./integrations";
import { SeoSchema } from "./seo";
import { LocalizationSchema } from "./localization";
import { DarkModeSchema } from "./dark-mode";
import { FiltersSchema, QuickFiltersSchema } from "./filters";
import { UiSchema, CardOverridesSchema } from "./ui-components";
import { PromoPopupSchema } from "./promo-popup";
import { ContentSchema } from "./content";
import { StorefrontUXSchema, RelatedProductsSchema } from "./storefront";
import { DesignTokensSchema } from "./design";
import { CheckoutUiSchema } from "./checkout-ui";
import { ComponentOverridesSchema } from "./component-overrides";

// ============================================
// FULL CONFIG SCHEMA
// ============================================

export const StorefrontConfigSchema = z.object({
  version: z.number(),
  updatedAt: z.string().optional(),
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
  storefront: StorefrontUXSchema,
  relatedProducts: RelatedProductsSchema,
  design: DesignTokensSchema,
  checkoutUi: CheckoutUiSchema,
  cardOverrides: CardOverridesSchema.optional(),
  componentOverrides: ComponentOverridesSchema,
});
