"use client";

import React, { useMemo, useCallback } from "react";
import { type ProductListItemFragment } from "@/gql/graphql";
import {
  Hero,
  TrustStrip,
  Marquee,
  BrandGrid,
  Categories,
  TrendingProducts,
  BestSellersSection,
  PromotionBanner,
  FlashDeals,
  CollectionMosaic,
  CustomerFeedback,
  NewsletterSignup,
  BackgroundSection,
  getDiscountPercent,
  uniqueBy,
  getProductBrand,
  getProductBrandInfo,
} from "@/components/home";
import type { SectionBackgroundConfig } from "@/lib/section-backgrounds";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";
import { type HeroBannerConfig, type Testimonial, type FeaturedBrand } from "@/lib/cms";
import {
  useHomepageConfig,
  useContentConfig,
  useStoreInfo,
  useBranding,
} from "@/providers/StoreConfigProvider";
import { useDirection } from "@/providers/DirectionProvider";
import { DEFAULT_SECTION_ORDER, type HomepageSectionId } from "@/config";

/**
 * Category data from Dashboard
 */
interface DashboardCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  imageAlt?: string;
  productCount: number;
  featuredImage?: string;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount: number;
    image?: string;
    imageAlt?: string;
  }>;
}

/** Collection item for CollectionMosaic */
interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  backgroundImage?: {
    url: string;
    alt?: string | null;
  } | null;
  products?: {
    totalCount?: number | null;
    edges: Array<{
      node: {
        id: string;
        name: string;
        slug: string;
        thumbnail?: { url: string; alt?: string | null } | null;
        media?: Array<{ url: string; alt?: string | null }> | null;
      };
    }>;
  } | null;
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
  /** Sale collection metadata for PromotionBanner */
  saleCollectionInfo?: {
    name: string;
    description: string;
    backgroundImage: string | null;
    promotionName: string;
    saleEndDate: string | null;
  } | null;
  /** Hero banner config from "hero-banner" collection metadata */
  heroBanner?: HeroBannerConfig | null;
  /** Testimonials from "testimonials" collection metadata */
  testimonials?: Testimonial[];
  /** Featured brands from "brands" collection metadata */
  brands?: FeaturedBrand[];
  /** Brand name → logo URL from Brand pages (brand-logo attribute) */
  brandLogos?: Record<string, string>;
  /** Collections for CollectionMosaic section */
  collections?: CollectionItem[];
}

/**
 * HomePage Component - V6 Design
 *
 * Clean, modern homepage with full Storefront Control integration.
 * All sections are configurable via config hooks.
 * Full RTL/LTR support using logical CSS properties.
 */
export function HomePage({
  channel,
  categories,
  featuredProducts: _featuredProducts,
  newArrivals,
  bestSellers,
  saleProducts,
  saleCollectionInfo,
  heroBanner,
  testimonials = [],
  brands = [],
  brandLogos = {},
  collections = [],
}: HomePageProps) {
  // Get config from context
  const homepageConfig = useHomepageConfig();
  const contentConfig = useContentConfig();
  const storeInfo = useStoreInfo();
  const { colors } = useBranding();
  const { direction } = useDirection();

  const { sections } = homepageConfig;
  const sectionOrder = homepageConfig.sectionOrder || DEFAULT_SECTION_ORDER;
  const homepageContent = contentConfig.homepage;
  const storeName = storeInfo.name || "";

  // Use Dashboard categories (empty array when none exist)
  const displayCategories = useMemo(() =>
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      imageAlt: cat.imageAlt,
      productCount: cat.productCount,
      featuredImage: cat.featuredImage,
      children: cat.children,
    })),
    [categories],
  );

  // Build brand name → { slug, image } mapping from products
  const brandDataMap = useMemo(() => {
    const map = new Map<string, { slug: string; image: string }>();
    [...newArrivals, ...bestSellers].forEach((product) => {
      const info = getProductBrandInfo(product, storeName);
      const key = info.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { slug: info.slug, image: info.image });
      } else if (info.image && !map.get(key)!.image) {
        map.set(key, { ...map.get(key)!, image: info.image });
      }
    });
    return map;
  }, [newArrivals, bestSellers, storeName]);

  // Helper: resolve logo from Pages > CMS > product attributes
  const resolveLogo = useCallback((name: string, cmsLogo?: string, productImage?: string) => {
    const key = name.toLowerCase().trim();
    return brandLogos[key] || cmsLogo || productImage || "";
  }, [brandLogos]);

  // Compute brand tiles from props or products
  const brandTiles = useMemo<FeaturedBrand[]>(() => {
    if (brands.length > 0) {
      // CMS brands: enrich with Saleor slug for filter URLs + brand logos from Pages
      return brands.map((brand) => {
        const data = brandDataMap.get(brand.name.toLowerCase().trim());
        const logo = resolveLogo(brand.name, brand.logo, data?.image);
        if (brand.url) return { ...brand, logo };
        if (data?.slug) {
          return { ...brand, logo, url: `/products?brands=${encodeURIComponent(data.slug)}` };
        }
        return { ...brand, logo };
      });
    }

    // Derive brands from products with proper Saleor slugs and brand logos from Pages
    const allProducts = [...newArrivals, ...bestSellers];
    const seen = new Set<string>();
    const brandInfos: Array<{ name: string; slug: string; image: string }> = [];
    for (const product of allProducts) {
      const info = getProductBrandInfo(product, storeName);
      const key = info.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        brandInfos.push(info);
      } else if (info.image) {
        const existing = brandInfos.find((b) => b.name.toLowerCase().trim() === key);
        if (existing && !existing.image) {
          existing.image = info.image;
        }
      }
    }

    // Return API-derived brands only (no hardcoded fallback)
    return brandInfos.map((info, index) => ({
      id: `${info.slug}-${index}`,
      name: info.name,
      logo: resolveLogo(info.name, "", info.image),
      url: `/products?brands=${encodeURIComponent(info.slug)}`,
    }));
  }, [brands, newArrivals, bestSellers, storeName, brandDataMap, resolveLogo]);

  // Collect ALL discounted products across every section (not just the "sale" collection).
  // Products with active Saleor Promotions will have price < undiscountedPrice automatically.
  const allDiscountedProducts = useMemo(() => {
    const all = [..._featuredProducts, ...newArrivals, ...bestSellers, ...saleProducts];
    const discounted = all.filter((p) => getDiscountPercent(p) > 0);
    return uniqueBy(discounted, (p) => p.id);
  }, [_featuredProducts, newArrivals, bestSellers, saleProducts]);

  // Max discount across all discounted products
  const maxDiscount = useMemo(() => {
    return Math.max(0, ...allDiscountedProducts.map((p) => getDiscountPercent(p)));
  }, [allDiscountedProducts]);

  // Promo data: counts/discounts from ALL discounted products, metadata from sale collection
  const promoData = useMemo(() => {
    return {
      promotionName: saleCollectionInfo?.promotionName || saleCollectionInfo?.name || "",
      description: saleCollectionInfo?.description || "",
      maxDiscountPercent: maxDiscount,
      productCount: allDiscountedProducts.length,
      saleEndDate: saleCollectionInfo?.saleEndDate || null,
      backgroundImage: saleCollectionInfo?.backgroundImage || null,
    };
  }, [allDiscountedProducts, maxDiscount, saleCollectionInfo]);

  // Generate marquee items from brands and categories (API data only)
  const marqueeItems = useMemo(() => {
    const brandNames = brandTiles.map((b) => b.name);
    const categoryNames = categories.map((c) => c.name);
    return uniqueBy(
      [...brandNames, ...categoryNames],
      (item) => item.toLowerCase(),
    );
  }, [brandTiles, categories]);

  // Helper to get section config safely
  const getSectionConfig = <T extends keyof typeof sections>(key: T): (typeof sections)[T] | undefined => {
    return sections[key];
  };

  // Helper to get section background config
  const getSectionBackground = <T extends keyof typeof sections>(key: T): SectionBackgroundConfig | undefined => {
    const sectionConfig = sections[key];
    return (sectionConfig as { background?: SectionBackgroundConfig } | undefined)?.background;
  };

  // Section rendering map - V6 style only with background support
  const renderSection = (sectionId: HomepageSectionId): React.ReactNode => {
    switch (sectionId) {
      case "hero": {
        if (getSectionConfig("hero")?.enabled === false) return null;
        const heroBg = getSectionBackground("hero");
        return (
          <BackgroundSection key="hero" background={heroBg} ariaLabel="Hero banner">
            <Hero
              channel={channel}
              newArrivals={newArrivals}
              bestSellers={bestSellers}
              heroBanner={heroBanner}
              brandCount={brandTiles.length}
            />
          </BackgroundSection>
        );
      }

      case "trustStrip": {
        if (getSectionConfig("trustStrip")?.enabled === false) return null;
        const bg = getSectionBackground("trustStrip");
        return (
          <BackgroundSection key="trustStrip" background={bg} ariaLabel="Trust indicators">
            <TrustStrip />
          </BackgroundSection>
        );
      }

      case "marquee": {
        if (getSectionConfig("marquee")?.enabled === false) return null;
        if (marqueeItems.length === 0) return null;
        const bg = getSectionBackground("marquee");
        return (
          <BackgroundSection key="marquee" background={bg} ariaLabel="Brand marquee">
            <Marquee items={marqueeItems} />
          </BackgroundSection>
        );
      }

      case "brandGrid": {
        if (getSectionConfig("brandGrid")?.enabled === false || brandTiles.length === 0) return null;
        const bg = getSectionBackground("brandGrid");
        return (
          <BackgroundSection key="brandGrid" background={bg} ariaLabel="Featured brands">
            <RevealOnScroll>
              <BrandGrid brands={brandTiles} channel={channel} />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "categories":
      case "featuredCategories": {
        if (getSectionConfig("categories")?.enabled === false && getSectionConfig("featuredCategories")?.enabled === false) return null;
        const bg = getSectionBackground("categories");
        const config = getSectionConfig("categories");
        return (
          <BackgroundSection key="categories" background={bg} ariaLabel="Shop by category">
            <RevealOnScroll>
              <Categories
                categories={displayCategories}
                channel={channel}
                title={config?.title ?? homepageContent.categoriesTitle}
                subtitle={config?.subtitle ?? homepageContent.categoriesSubtitle}
              />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "trending":
      case "newArrivals": {
        if (getSectionConfig("trending")?.enabled === false && getSectionConfig("newArrivals")?.enabled === false) return null;
        if (newArrivals.length === 0) return null;
        const bg = getSectionBackground("trending");
        const config = getSectionConfig("trending");
        return (
          <BackgroundSection key="trending" background={bg} ariaLabel="Trending products">
            <RevealOnScroll>
              <TrendingProducts
                products={newArrivals}
                channel={channel}
                title={config?.title ?? homepageContent.newArrivalsTitle}
                subtitle={config?.subtitle ?? homepageContent.newArrivalsSubtitle}
              />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "promotionBanner": {
        if (getSectionConfig("promotionBanner")?.enabled === false) return null;
        if (allDiscountedProducts.length === 0) return null;
        const bg = getSectionBackground("promotionBanner");
        return (
          <BackgroundSection key="promotionBanner" background={bg} ariaLabel="Promotional banner">
            <PromotionBanner channel={channel} promoData={promoData} />
          </BackgroundSection>
        );
      }

      case "flashDeals":
      case "onSale": {
        if (getSectionConfig("flashDeals")?.enabled === false && getSectionConfig("onSale")?.enabled === false) return null;
        if (allDiscountedProducts.length === 0) return null;
        const bg = getSectionBackground("flashDeals");
        return (
          <BackgroundSection key="flashDeals" background={bg} ariaLabel="Flash deals">
            <RevealOnScroll>
              <FlashDeals products={allDiscountedProducts} channel={channel} maxDiscount={maxDiscount} saleEndDate={promoData.saleEndDate} />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "collectionMosaic": {
        if (getSectionConfig("collectionMosaic")?.enabled === false || collections.length === 0) return null;
        const bg = getSectionBackground("collectionMosaic");
        return (
          <BackgroundSection key="collectionMosaic" background={bg} ariaLabel="Collections">
            <RevealOnScroll>
              <CollectionMosaic collections={collections} channel={channel} />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "bestSellers": {
        if (getSectionConfig("bestSellers")?.enabled === false || bestSellers.length === 0) return null;
        const bg = getSectionBackground("bestSellers");
        const config = getSectionConfig("bestSellers") as { enabled: boolean; title?: string | null; subtitle?: string | null } | undefined;
        return (
          <BackgroundSection key="bestSellers" background={bg} ariaLabel="Best sellers">
            <RevealOnScroll>
              <BestSellersSection
                products={bestSellers}
                channel={channel}
                title={config?.title ?? homepageContent.bestSellersTitle}
                subtitle={config?.subtitle ?? homepageContent.bestSellersSubtitle}
              />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "customerFeedback":
      case "testimonials": {
        if (getSectionConfig("customerFeedback")?.enabled === false && getSectionConfig("testimonials")?.enabled === false) return null;
        const bg = getSectionBackground("customerFeedback");
        return (
          <BackgroundSection key="customerFeedback" background={bg} ariaLabel="Customer feedback">
            <RevealOnScroll>
              <CustomerFeedback channel={channel} cmsTestimonials={testimonials} />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "newsletter": {
        if (getSectionConfig("newsletter")?.enabled === false) return null;
        const bg = getSectionBackground("newsletter");
        const config = getSectionConfig("newsletter") as { enabled: boolean; title?: string | null; subtitle?: string | null; buttonText?: string | null } | undefined;
        return (
          <BackgroundSection key="newsletter" background={bg} ariaLabel="Newsletter signup">
            <RevealOnScroll>
              <NewsletterSignup
                title={config?.title ?? contentConfig.general.newsletterTitle}
                subtitle={config?.subtitle ?? contentConfig.general.newsletterDescription}
                buttonText={config?.buttonText ?? contentConfig.general.newsletterButton}
                channel={channel}
              />
            </RevealOnScroll>
          </BackgroundSection>
        );
      }

      case "recentlyViewed": {
        if (getSectionConfig("recentlyViewed")?.enabled === false) return null;
        return <RecentlyViewedProducts channel={channel} />;
      }

      default:
        // Skip other legacy sections silently
        return null;
    }
  };

  return (
    <main className="bg-white text-neutral-900" dir={direction}>
      {sectionOrder.map((sectionId) => {
        const element = renderSection(sectionId);
        return element ? <div key={sectionId}>{element}</div> : null;
      })}
    </main>
  );
}
