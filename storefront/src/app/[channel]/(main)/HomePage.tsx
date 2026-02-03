"use client";

import { type ProductListItemFragment } from "@/gql/graphql";
import {
  HeroSection,
  FeaturedCategories,
  ProductGrid,
  FeaturedBrands,
  Testimonials,
  NewsletterSignup,
  InstagramFeed,
  MarqueeSection,
  FeatureSection,
  placeholderCategories,
} from "@/components/home";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { type HeroBannerConfig, type Testimonial, type FeaturedBrand } from "@/lib/cms";
import { useHomepageConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { DEFAULT_SECTION_ORDER, type HomepageSectionId } from "@/config";
import React from "react";

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
  /** Channel slug */
  channel: string;
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
 */
export function HomePage({
  channel,
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

      case 'marquee':
        if (!sections.marquee?.enabled) return null;
        return <MarqueeSection key="marquee" />;

      case 'featuredCategories':
        if (!sections.featuredCategories.enabled) return null;
        return (
          <RevealOnScroll key="featuredCategories">
            <FeaturedCategories 
              categories={displayCategories}
              title={homepageContent.categoriesTitle}
              subtitle={homepageContent.categoriesSubtitle}
            />
          </RevealOnScroll>
        );

      case 'newArrivals':
        if (!sections.newArrivals.enabled || newArrivals.length === 0) return null;
        return (
          <RevealOnScroll key="newArrivals">
            <ProductGrid 
              products={newArrivals}
              type="newArrivals"
              title={homepageContent.newArrivalsTitle}
              subtitle={homepageContent.newArrivalsSubtitle}
            />
          </RevealOnScroll>
        );

      case 'bestSellers':
        if (!sections.bestSellers.enabled || bestSellers.length === 0) return null;
        return (
          <RevealOnScroll key="bestSellers">
            <ProductGrid 
              products={bestSellers}
              type="bestSellers"
              title={homepageContent.bestSellersTitle}
              subtitle={homepageContent.bestSellersSubtitle}
            />
          </RevealOnScroll>
        );

      case 'feature':
        if (!sections.feature?.enabled) return null;
        return <FeatureSection key="feature" />;

      case 'onSale':
        if (!sections.onSale.enabled || saleProducts.length === 0) return null;
        return (
          <RevealOnScroll key="onSale">
            <ProductGrid 
              products={saleProducts}
              type="onSale"
              title={homepageContent.onSaleTitle}
              subtitle={homepageContent.onSaleSubtitle}
            />
          </RevealOnScroll>
        );

      case 'featuredBrands':
        if (!sections.featuredBrands.enabled) return null;
        return (
          <RevealOnScroll key="featuredBrands">
            <FeaturedBrands cmsBrands={brands} />
          </RevealOnScroll>
        );

      case 'testimonials':
        return (
          <RevealOnScroll key="testimonials">
            <Testimonials channel={channel} cmsTestimonials={testimonials} />
          </RevealOnScroll>
        );

      case 'newsletter':
        if (!sections.newsletter.enabled) return null;
        return (
          <RevealOnScroll key="newsletter">
            <NewsletterSignup 
              title={contentConfig.general.newsletterTitle}
              subtitle={contentConfig.general.newsletterDescription}
              buttonText={contentConfig.general.newsletterButton}
              channel={channel}
            />
          </RevealOnScroll>
        );

      case 'instagramFeed':
        if (!sections.instagramFeed.enabled) return null;
        return (
          <RevealOnScroll key="instagramFeed">
            <InstagramFeed 
              username={sections.instagramFeed.username || undefined}
            />
          </RevealOnScroll>
        );

      default:
        return null;
    }
  };

  return (
    <main className="space-y-0 overflow-x-hidden">
      {sectionOrder.map((sectionId) => (
        <div key={sectionId}>
          {renderSection(sectionId)}
        </div>
      ))}
    </main>
  );
}
