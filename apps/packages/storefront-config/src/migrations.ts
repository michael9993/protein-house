/**
 * Config migration functions.
 * Applied at parse time in config-manager.ts before Zod validation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Migrate V1 config (with legacy homepage sections) to V2.
 * Maps legacy section names to new equivalents and removes deprecated sections.
 */
export function migrateV1toV2(raw: Record<string, any>): Record<string, any> {
  if (!raw?.homepage?.sections) return raw;

  const sections = raw.homepage.sections as Record<string, any>;

  // Map legacy sections → new sections (only if new section doesn't already exist)
  if (sections.featuredCategories && !sections.categories) {
    sections.categories = {
      ...sections.featuredCategories,
      title: null,
      subtitle: null,
      maxCategories: sections.featuredCategories.limit ?? 6,
      showProductCount: true,
      layoutStyle: "mosaic",
    };
  }

  if (sections.testimonials && !sections.customerFeedback) {
    sections.customerFeedback = {
      enabled: sections.testimonials.enabled ?? false,
      title: null,
      subtitle: null,
      maxReviews: 3,
      minRating: 4,
      showProductName: true,
      background: sections.testimonials.background,
      starColor: sections.testimonials.starColor ?? null,
      starEmptyColor: sections.testimonials.starEmptyColor ?? null,
    };
  }

  if (sections.newArrivals && !sections.trending) {
    sections.trending = {
      enabled: sections.newArrivals.enabled ?? false,
      title: null,
      subtitle: null,
      collectionSlug: "new-arrivals",
      fallbackToNewest: true,
      maxProducts: sections.newArrivals.limit ?? 4,
      layout: "grid",
      background: sections.newArrivals.background,
    };
  }

  if (sections.featuredBrands && !sections.brandGrid) {
    sections.brandGrid = {
      enabled: sections.featuredBrands.enabled ?? false,
      title: null,
      subtitle: null,
      maxBrands: 12,
      showLogos: true,
      layout: "grid",
      background: sections.featuredBrands.background,
    };
  }

  if (sections.onSale && !sections.flashDeals) {
    sections.flashDeals = {
      enabled: sections.onSale.enabled ?? false,
      title: null,
      subtitle: null,
      badgeTemplate: "Up to {discount}% OFF",
      collectionSlug: "sale",
      maxProducts: sections.onSale.limit ?? 8,
      background: sections.onSale.background,
    };
  }

  // Remove legacy keys (they've been migrated or are deprecated)
  delete sections.featuredCategories;
  delete sections.testimonials;
  delete sections.newArrivals;
  delete sections.featuredBrands;
  delete sections.onSale;
  delete sections.instagramFeed;
  delete sections.feature;

  // Clean up section order to remove legacy IDs
  if (raw.homepage.sectionOrder) {
    const legacyIds = new Set([
      "featuredCategories", "testimonials", "newArrivals",
      "featuredBrands", "onSale", "instagramFeed", "feature",
    ]);
    raw.homepage.sectionOrder = (raw.homepage.sectionOrder as string[])
      .filter((id: string) => !legacyIds.has(id));
  }

  return raw;
}

/**
 * Apply all migrations to a raw config object.
 * Call this before Zod parsing in config-manager.ts.
 */
export function applyMigrations(raw: Record<string, any>): Record<string, any> {
  let config = raw;
  config = migrateV1toV2(config);
  return config;
}
