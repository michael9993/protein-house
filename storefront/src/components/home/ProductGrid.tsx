"use client";

import React from "react";
import Image from "next/image";
import { useStoreConfig, useFeature, useContentConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { type ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { SectionHeader } from "./SectionHeader";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";
import { useWishlist } from "@/lib/wishlist";

type ProductGridType = "newArrivals" | "bestSellers" | "onSale" | "featured";

interface ProductGridProps {
  products: readonly ProductListItemFragment[];
  type?: ProductGridType;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  columns?: 2 | 3 | 4;
}

/**
 * ProductGrid Section
 * 
 * Versatile product grid that can be used for:
 * - New Arrivals
 * - Best Sellers
 * - On Sale
 * - Featured Products
 */
export function ProductGrid({
  products,
  type = "featured",
  title,
  subtitle,
  viewAllLink,
  columns = 4,
}: ProductGridProps) {
  const { homepage, branding, ecommerce } = useStoreConfig();
  const hasWishlist = useFeature("wishlist");
  const content = useContentConfig();
  
  // Get config for this section type
  const sectionConfig = type === "featured" 
    ? { enabled: true, limit: 8 } 
    : homepage.sections[type];

  // Don't render if disabled
  if (!sectionConfig.enabled) {
    return null;
  }

  // Limit products to config limit
  const displayProducts = products.slice(0, sectionConfig.limit);
  
  // Get titles from content config
  const getTitleFromContent = () => {
    switch (type) {
      case "newArrivals":
        return { title: content.homepage.newArrivalsTitle, subtitle: content.homepage.newArrivalsSubtitle, link: "/collections/new-arrivals" };
      case "bestSellers":
        return { title: content.homepage.bestSellersTitle, subtitle: content.homepage.bestSellersSubtitle, link: "/collections/best-sellers" };
      case "onSale":
        return { title: content.homepage.onSaleTitle, subtitle: content.homepage.onSaleSubtitle, link: "/collections/sale" };
      case "featured":
      default:
        return { title: content.homepage.featuredTitle, subtitle: content.homepage.featuredSubtitle, link: "/products" };
    }
  };
  
  const defaults = getTitleFromContent();
  const displayTitle = title || defaults.title;
  const displaySubtitle = subtitle || defaults.subtitle;
  const displayLink = viewAllLink || defaults.link;

  // Grid columns class
  const gridColsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.05, rootMargin: "0px 0px -100px 0px" });

  // Get background config for this section
  const backgroundConfig = sectionConfig.background as SectionBackgroundConfig | undefined;
  
  // Generate background styles
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  // Merge background styles with animation styles
  const sectionStyles: React.CSSProperties = {
    ...backgroundStyles,
    transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 300ms ease-out, transform 300ms ease-out',
    willChange: isVisible ? 'auto' : 'transform, opacity',
  };

  return (
    <section 
      ref={elementRef}
      className={`premium-band py-16 sm:py-20 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={sectionStyles}
    >
      {/* Pattern overlay for pattern backgrounds */}
      {patternOverlay && (
        <div className="absolute inset-0" style={{ opacity: (backgroundConfig?.patternOpacity ?? 10) / 100 }}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternOverlay.patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                {backgroundConfig?.patternType === "grid" && (
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                )}
                {backgroundConfig?.patternType === "dots" && (
                  <circle cx="10" cy="10" r="1.5" fill={branding.colors.text}/>
                )}
                {backgroundConfig?.patternType === "lines" && (
                  <path d="M 0 20 L 40 20" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                )}
                {backgroundConfig?.patternType === "waves" && (
                  <>
                    <path d="M 0 30 Q 15 20, 30 30 T 60 30" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                    <path d="M 0 40 Q 15 50, 30 40 T 60 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                  </>
                )}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternOverlay.patternId})`} />
          </svg>
        </div>
      )}
      <div className="premium-band-content relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeader
          title={displayTitle}
          subtitle={displaySubtitle}
          type={type === "onSale" ? "sale" : "products"}
          viewAllLink={displayLink}
          viewAllText={content.general.viewAllButton}
          align="left"
          showBadge={type === "onSale"}
          badgeText={content.product.saleBadgeText}
        />

        {/* Products Grid */}
        <div className={`mt-10 grid gap-6 ${gridColsClass}`}>
          {displayProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={index}
              showWishlist={hasWishlist}
              showSaleBadge={type === "onSale"}
              branding={branding}
              ecommerce={ecommerce}
              content={content}
            />
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center sm:hidden">
          <LinkWithChannel
            href={displayLink}
            className="inline-flex items-center gap-2 font-medium"
            style={{ color: branding.colors.primary }}
          >
            {content.general.viewAllButton}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </LinkWithChannel>
        </div>
      </div>
    </section>
  );
}

/**
 * Individual Product Card
 */
interface ProductCardProps {
  product: ProductListItemFragment;
  index: number;
  showWishlist: boolean;
  showSaleBadge: boolean;
  branding: any;
  ecommerce: any;
  content: any;
}

function ProductCard({ 
  product, 
  index, 
  showWishlist, 
  showSaleBadge,
  branding,
  ecommerce: _ecommerce,
  content,
}: ProductCardProps) {
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  
  const priceRange = formatMoneyRange({
    start: product.pricing?.priceRange?.start?.gross,
    stop: product.pricing?.priceRange?.stop?.gross,
  });

  // Check if product is on sale (compare start and stop prices)
  const priceStart = product.pricing?.priceRange?.start?.gross?.amount;
  const priceStop = product.pricing?.priceRange?.stop?.gross?.amount;
  const isOnSale = priceStart && priceStop && priceStart < priceStop;
  
  // Check stock
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantityAvailable || 0), 0) ?? 0;
  const isInStock = totalStock > 0;
  
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      await removeItem(product.id);
    } else {
      await addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.pricing?.priceRange?.start?.gross?.amount || 0,
        originalPrice: product.pricing?.priceRangeUndiscounted?.start?.gross?.amount,
        currency: product.pricing?.priceRange?.start?.gross?.currency || "USD",
        image: product.thumbnail?.url || "",
        imageAlt: product.thumbnail?.alt || product.name,
        category: product.category?.name || undefined,
        inStock: isInStock,
      });
    }
  };
  
  // Use a simple fade-in with stagger for product cards
  // Cards appear quickly after section is visible
  return (
    <div 
      className="group"
      style={{ 
        opacity: 1,
        animation: `fadeInUp 400ms ease-out ${index * 40}ms both`,
        willChange: 'transform, opacity',
      }}
    >
      <LinkWithChannel href={`/products/${product.slug}`}>
        <div
          className="relative overflow-hidden border border-neutral-200/50 bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
          style={{
            borderRadius: `var(--store-radius)`,
            boxShadow: `0 4px 16px -4px ${branding.colors.primary}15`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.primary}08, transparent 60%)`,
            }}
          />
          {/* Product Image */}
          {product.thumbnail?.url && (
            <div className="aspect-square overflow-hidden bg-neutral-100">
              <Image
                src={product.thumbnail.url}
                alt={product.thumbnail.alt || product.name}
                width={400}
                height={400}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading={index < 4 ? "eager" : "lazy"}
              />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {(showSaleBadge || isOnSale) && (
              <span 
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                style={{ 
                  backgroundColor: branding.colors.error,
                  boxShadow: `0 8px 20px ${branding.colors.error}55`,
                }}
              >
                {content.product.saleBadgeText}
              </span>
            )}
            {index < 2 && (
              <span 
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                style={{ 
                  backgroundColor: branding.colors.primary,
                  boxShadow: `0 8px 20px ${branding.colors.primary}55`,
                }}
              >
                {content.product.newBadgeText}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          {showWishlist && (
            <button 
              className="absolute right-3 top-3 z-10 rounded-full border border-neutral-200/60 bg-white/90 p-2 shadow-md backdrop-blur transition-all hover:bg-white hover:opacity-100"
              onClick={handleWishlistClick}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{ 
                color: isWishlisted ? branding.colors.error : branding.colors.text,
                opacity: isWishlisted ? 1 : 0.7,
              }}
            >
              <svg 
                className="h-5 w-5" 
                fill={isWishlisted ? "currentColor" : "none"}
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={isWishlisted ? 0 : 2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-4 p-4">
          <h3 className="font-semibold text-store-text transition-colors group-hover:text-store-primary">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-store-text-muted">
            {product.category?.name}
          </p>
          <p className="mt-2 font-semibold text-store-text">
            {priceRange}
          </p>
        </div>
      </LinkWithChannel>
    </div>
  );
}

/**
 * Server Component wrapper for fetching products
 */
export async function ProductGridServer({
  type,
  collectionSlug,
  channel,
  ...props
}: ProductGridProps & { collectionSlug?: string; channel: string }) {
  // This would fetch from GraphQL
  // For now, we'll use the client component directly
  return <ProductGrid type={type} {...props} products={[]} />;
}

