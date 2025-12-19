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
  featuredProducts,
  newArrivals,
  bestSellers,
  saleProducts,
  heroBanner,
  testimonials = [],
  brands = [],
}: HomePageProps) {
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

  return (
    <main>
      {/* Hero Section - can be controlled via "hero-banner" collection metadata */}
      <HeroSection cmsConfig={heroBanner} />

      {/* Featured Categories - from Dashboard > Catalog > Categories */}
      <FeaturedCategories 
        categories={displayCategories}
        title="Shop by Category"
        subtitle="Find the perfect gear for your game"
      />

      {/* New Arrivals - from Dashboard > Catalog > Collections > "new-arrivals" */}
      <ProductGrid 
        products={newArrivals}
        type="newArrivals"
        title="Just Dropped"
        subtitle="Be the first to get our newest gear"
      />

      {/* Featured Brands - from "brands" collection or fallback to config */}
      <FeaturedBrands cmsBrands={brands} />

      {/* Best Sellers - from Dashboard > Catalog > Collections > "best-sellers" */}
      <ProductGrid 
        products={bestSellers}
        type="bestSellers"
        title="Fan Favorites"
        subtitle="Top-rated products our athletes love"
      />

      {/* Testimonials - from "testimonials" collection or fallback */}
      <Testimonials cmsTestimonials={testimonials} />

      {/* On Sale - from Dashboard > Catalog > Collections > "sale" */}
      {saleProducts.length > 0 && (
        <ProductGrid 
          products={saleProducts}
          type="onSale"
          title="Don't Miss Out"
          subtitle="Limited time offers on premium gear"
        />
      )}

      {/* Newsletter Signup */}
      <NewsletterSignup 
        title="Join the Team"
        subtitle="Get 15% off your first order plus exclusive access to new releases and member-only deals."
        buttonText="Sign Me Up"
      />
    </main>
  );
}

