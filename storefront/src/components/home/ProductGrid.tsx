"use client";

import Image from "next/image";
import { useStoreConfig, useFeature } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { type ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";

type ProductGridType = "newArrivals" | "bestSellers" | "onSale" | "featured";

interface ProductGridProps {
  products: readonly ProductListItemFragment[];
  type?: ProductGridType;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  columns?: 2 | 3 | 4;
}

const defaultTitles: Record<ProductGridType, { title: string; subtitle: string; link: string }> = {
  newArrivals: {
    title: "New Arrivals",
    subtitle: "Just dropped - the latest additions to our collection",
    link: "/collections/new-arrivals",
  },
  bestSellers: {
    title: "Best Sellers",
    subtitle: "Our most popular products loved by customers",
    link: "/collections/best-sellers",
  },
  onSale: {
    title: "On Sale",
    subtitle: "Don't miss these amazing deals",
    link: "/collections/sale",
  },
  featured: {
    title: "Featured Products",
    subtitle: "Hand-picked for you",
    link: "/products",
  },
};

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
  
  // Get default titles
  const defaults = defaultTitles[type];
  const displayTitle = title || defaults.title;
  const displaySubtitle = subtitle || defaults.subtitle;
  const displayLink = viewAllLink || defaults.link;

  // Grid columns class
  const gridColsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <section 
      className="py-16 sm:py-20"
      style={{ backgroundColor: type === "onSale" ? branding.colors.surface : "transparent" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 
              className="heading text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: branding.colors.text }}
            >
              {displayTitle}
              {type === "onSale" && (
                <span 
                  className="ml-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                  style={{ 
                    backgroundColor: branding.colors.error,
                    color: "white",
                  }}
                >
                  Sale
                </span>
              )}
            </h2>
            <p 
              className="mt-2 text-lg"
              style={{ color: branding.colors.textMuted }}
            >
              {displaySubtitle}
            </p>
          </div>
          
          <LinkWithChannel
            href={displayLink}
            className="hidden items-center gap-2 font-medium transition-all hover:gap-3 sm:inline-flex"
            style={{ color: branding.colors.primary }}
          >
            View All
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </LinkWithChannel>
        </div>

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
            View All
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
}

function ProductCard({ 
  product, 
  index, 
  showWishlist, 
  showSaleBadge,
  branding,
  ecommerce: _ecommerce,
}: ProductCardProps) {
  const priceRange = formatMoneyRange({
    start: product.pricing?.priceRange?.start?.gross,
    stop: product.pricing?.priceRange?.stop?.gross,
  });

  // Check if product is on sale (compare start and stop prices)
  const priceStart = product.pricing?.priceRange?.start?.gross?.amount;
  const priceStop = product.pricing?.priceRange?.stop?.gross?.amount;
  const isOnSale = priceStart && priceStop && priceStart < priceStop;
  
  return (
    <div 
      className="group animate-fade-in-up"
      style={{ 
        animationDelay: `${index * 50}ms`,
        animationFillMode: "both",
      }}
    >
      <LinkWithChannel href={`/products/${product.slug}`}>
        <div 
          className="relative overflow-hidden"
          style={{ borderRadius: `var(--store-radius)` }}
        >
          {/* Product Image */}
          {product.thumbnail?.url && (
            <div className="aspect-square overflow-hidden bg-neutral-100">
              <Image
                src={product.thumbnail.url}
                alt={product.thumbnail.alt || product.name}
                width={400}
                height={400}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading={index < 4 ? "eager" : "lazy"}
              />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {(showSaleBadge || isOnSale) && (
              <span 
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: branding.colors.error }}
              >
                Sale
              </span>
            )}
            {index < 2 && (
              <span 
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: branding.colors.primary }}
              >
                New
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          {showWishlist && (
            <button 
              className="absolute right-3 top-3 rounded-full bg-white/90 p-2 opacity-0 shadow-md transition-all hover:bg-white group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to wishlist
              }}
              aria-label="Add to wishlist"
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ color: branding.colors.text }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}

          {/* Quick Add Button */}
          <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <button 
              className="w-full rounded-full py-3 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: branding.colors.primary }}
              onClick={(e) => {
                e.preventDefault();
                // TODO: Quick add to cart
              }}
            >
              Quick Add
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-4">
          <h3 
            className="font-medium transition-colors group-hover:underline"
            style={{ color: branding.colors.text }}
          >
            {product.name}
          </h3>
          <p 
            className="mt-1 text-sm"
            style={{ color: branding.colors.textMuted }}
          >
            {product.category?.name}
          </p>
          <p 
            className="mt-2 font-semibold"
            style={{ color: branding.colors.text }}
          >
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

