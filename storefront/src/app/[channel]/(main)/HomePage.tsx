"use client";

import { type ProductListItemFragment } from "@/gql/graphql";
import {
  HeroSection,
  FeaturedCategories,
  ProductGrid,
  FeaturedBrands,
  Testimonials,
  NewsletterSignup,
  placeholderCategories,
} from "@/components/home";
import { type HeroBannerConfig, type Testimonial, type FeaturedBrand } from "@/lib/cms";
import { useHomepageConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { DEFAULT_SECTION_ORDER, type HomepageSectionId } from "@/config";

/**
 * Category data from Dashboard
 * Created in: Dashboard > Catalog > Categories
 */
interface DashboardCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount: number;
}

interface HomePageProps {
  /** Categories from Dashboard > Catalog > Categories */
  categories: DashboardCategory[];
  /** Products from "featured-products" collection */
  featuredProducts: readonly ProductListItemFragment[];
  /** Products from "new-arrivals" collection */
  newArrivals: readonly ProductListItemFragment[];
  /** Products from "best-sellers" collection */
  bestSellers: readonly ProductListItemFragment[];
  /** Products from "sale" collection */
  saleProducts: readonly ProductListItemFragment[];
  /** Hero banner config from "hero-banner" collection metadata */
  heroBanner?: HeroBannerConfig | null;
  /** Testimonials from "testimonials" collection metadata */
  testimonials?: Testimonial[];
  /** Featured brands from "brands" collection metadata */
  brands?: FeaturedBrand[];
}

/**
 * HomePage Component
 * 
 * All content is fetched from Saleor Dashboard:
 * - Categories: Dashboard > Catalog > Categories
 * - Products: Dashboard > Catalog > Collections (by slug)
 * - Menus: Dashboard > Content > Navigation
 * - Hero Banner: Dashboard > Catalog > Collections > "hero-banner" (metadata)
 * - Testimonials: Dashboard > Catalog > Collections > "testimonials" (metadata)
 * - Brands: Dashboard > Catalog > Collections > "brands" (metadata)
 * 
 * DASHBOARD SETUP:
 * 1. Create categories with background images
 * 2. Create collections: "new-arrivals", "best-sellers", "sale", "featured-products"
 * 3. Create "hero-banner" collection with metadata for banner config
 * 4. Create "testimonials" collection with testimonials_json metadata
 * 5. Create "brands" collection with brands_json metadata
 * 6. Add products to product collections
 */
export function HomePage({
  categories,
  featuredProducts: _featuredProducts, // Reserved for future use
  newArrivals,
  bestSellers,
  saleProducts,
  heroBanner,
  testimonials = [],
  brands = [],
}: HomePageProps) {
  // Get config from context
  const homepageConfig = useHomepageConfig();
  const contentConfig = useContentConfig();
  const { sections } = homepageConfig;
  const sectionOrder = homepageConfig.sectionOrder || DEFAULT_SECTION_ORDER;
  const homepageContent = contentConfig.homepage;

  // Use Dashboard categories if available, otherwise use placeholders
  const displayCategories = categories.length > 0 
    ? categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        productCount: cat.productCount,
      }))
    : placeholderCategories;

  // Section rendering map - each section component with its enabled check
  const renderSection = (sectionId: HomepageSectionId): React.ReactNode => {
    switch (sectionId) {
      case 'hero':
        if (!sections.hero.enabled) return null;
        return <HeroSection key="hero" cmsConfig={heroBanner} />;

      case 'featuredCategories':
        if (!sections.featuredCategories.enabled) return null;
        return (
          <FeaturedCategories 
            key="featuredCategories"
            categories={displayCategories}
            title={homepageContent.categoriesTitle}
            subtitle={homepageContent.categoriesSubtitle}
          />
        );

      case 'newArrivals':
        if (!sections.newArrivals.enabled || newArrivals.length === 0) return null;
        return (
          <ProductGrid 
            key="newArrivals"
            products={newArrivals}
            type="newArrivals"
            title={homepageContent.newArrivalsTitle}
            subtitle={homepageContent.newArrivalsSubtitle}
          />
        );

      case 'bestSellers':
        if (!sections.bestSellers.enabled || bestSellers.length === 0) return null;
        return (
          <ProductGrid 
            key="bestSellers"
            products={bestSellers}
            type="bestSellers"
            title={homepageContent.bestSellersTitle}
            subtitle={homepageContent.bestSellersSubtitle}
          />
        );

      case 'onSale':
        if (!sections.onSale.enabled || saleProducts.length === 0) return null;
        return (
          <ProductGrid 
            key="onSale"
            products={saleProducts}
            type="onSale"
            title={homepageContent.onSaleTitle}
            subtitle={homepageContent.onSaleSubtitle}
          />
        );

      case 'featuredBrands':
        if (!sections.featuredBrands.enabled) return null;
        return <FeaturedBrands key="featuredBrands" cmsBrands={brands} />;

      case 'testimonials':
        if (!sections.testimonials.enabled) return null;
        return <Testimonials key="testimonials" cmsTestimonials={testimonials} />;

      case 'newsletter':
        if (!sections.newsletter.enabled) return null;
        return (
          <NewsletterSignup 
            key="newsletter"
            title={contentConfig.general.newsletterTitle}
            subtitle={contentConfig.general.newsletterDescription}
            buttonText={contentConfig.general.newsletterButton}
          />
        );

      case 'instagramFeed':
        // Instagram feed not yet implemented
        return null;

      default:
        return null;
    }
  };

  return (
    <main>
      {sectionOrder.map(sectionId => renderSection(sectionId))}
    </main>
  );
}

