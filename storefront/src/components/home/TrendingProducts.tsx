"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useCallback } from "react";
import { Heart } from "lucide-react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";
import { useBranding, useStoreInfo, useContentConfig, useTrendingConfig, useFeature, useUiConfig } from "@/providers/StoreConfigProvider";
import { useQuickView } from "@/providers/QuickViewProvider";
import { ShareButton } from "@/ui/components/ProductSharing";
import {
  getProductImage,
  getProductAlt,
  getProductBrand,
  getProductBadgeWithLabels,
  badgeToneClasses,
  getBadgePositionClasses,
  getCardHoverClasses,
  type BadgeLabels,
  type ProductCardConfig,
} from "./utils";

interface TrendingProductsProps {
  products: readonly ProductListItemFragment[];
  channel: string;
  title?: string;
  subtitle?: string;
}

// Default values when config is not available
const DEFAULTS = {
  enabled: true,
  title: "Trending now",
  subtitle: "Community favorites and fresh drops",
  maxProducts: 4,
};

/**
 * ProductCard - V6-style product card with badges and hover effects
 * Uses Quick View for the "View details" button
 */
function ProductCard({
  product,
  channel,
  storeName,
  accent,
  badgeLabels,
  viewDetailsText,
  performanceFallback,
  onQuickView,
  onPrefetch,
  wishlistEnabled,
  isWishlisted,
  onWishlistToggle,
  cardConfig,
}: {
  product: ProductListItemFragment;
  channel: string;
  storeName: string;
  accent: string;
  badgeLabels: BadgeLabels;
  viewDetailsText: string;
  performanceFallback: string;
  onQuickView: (slug: string) => void;
  onPrefetch: (slug: string) => void;
  wishlistEnabled: boolean;
  isWishlisted: boolean;
  onWishlistToggle: (product: ProductListItemFragment) => void;
  cardConfig: ProductCardConfig;
}) {
  const image = getProductImage(product);
  const badge = getProductBadgeWithLabels(product, badgeLabels);
  const brand = getProductBrand(product, storeName);
  const priceRange = formatMoneyRange({
    start: product.pricing?.priceRange?.start?.gross,
    stop: product.pricing?.priceRange?.stop?.gross,
  });
  const originalRange = formatMoneyRange({
    start: product.pricing?.priceRangeUndiscounted?.start?.gross,
    stop: product.pricing?.priceRangeUndiscounted?.stop?.gross,
  });
  const hasDiscount = priceRange && originalRange && priceRange !== originalRange;
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    prefetchTimeoutRef.current = setTimeout(() => onPrefetch(product.slug), 120);
  }, [product.slug, onPrefetch]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product.slug);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlistToggle(product);
  };

  return (
    <Link
      href={`/${encodeURIComponent(channel)}/products/${product.slug}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 ${getCardHoverClasses(cardConfig.hoverEffect)}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-square bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <span
          className={`absolute ${getBadgePositionClasses(cardConfig.badgePosition)} z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] ${badgeToneClasses[badge.tone]}`}
        >
          {badge.label}
        </span>
        {cardConfig.showBrandLabel !== false && (
          <span className="absolute end-4 top-4 z-10 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
            {brand}
          </span>
        )}
        {/* Wishlist + Share buttons */}
        <div className="absolute end-4 top-14 z-10 flex flex-col gap-2">
          {wishlistEnabled && (
            <button
              type="button"
              onClick={handleWishlistClick}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={16}
                className={isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-500"}
              />
            </button>
          )}
          <ShareButton
            variant="icon"
            productName={product.name}
            productSlug={product.slug}
            productImage={getProductImage(product) || null}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm text-neutral-500 transition-all duration-200 hover:scale-110 hover:shadow-md hover:text-neutral-700"
            iconClassName="h-4 w-4"
          />
        </div>
        {image ? (
          <Image
            src={image}
            alt={getProductAlt(product)}
            fill
            className={`${cardConfig.imageFit === "contain" ? "object-contain" : "object-cover"} transition duration-700 group-hover:scale-105`}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-6 rounded-2xl border border-dashed border-neutral-200" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleQuickViewClick}
          onTouchStart={() => onPrefetch(product.slug)}
          className="absolute bottom-6 start-0 end-0 flex translate-y-3 justify-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <span
            className="rounded-full px-6 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: accent }}
          >
            {viewDetailsText}
          </span>
        </button>
      </div>
      <div className="border-t border-neutral-100 px-5 pb-5 pt-4">
        <h3 className="line-clamp-2 text-sm font-black uppercase tracking-tight text-neutral-900">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
              {product.category?.name ?? performanceFallback}
            </div>
            <div className="mt-2 text-lg font-black" style={{ color: accent }}>
              {priceRange || "N/A"}
            </div>
            {hasDiscount && (
              <div className="text-xs text-neutral-400 line-through">{originalRange}</div>
            )}
          </div>
          {cardConfig.showRating !== false && (
            <div className="text-end text-xs font-semibold text-neutral-500">
              {(product.rating ?? 4.8).toFixed(1)} / 5
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * TrendingProducts - V6-style trending/new arrivals section
 * Features centered heading with accent dot and product grid.
 * Configurable via Storefront Control.
 */
export function TrendingProducts({ products, channel, title, subtitle }: TrendingProductsProps) {
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const contentConfig = useContentConfig();
  const config = useTrendingConfig();
  const { openQuickView, prefetchQuickView } = useQuickView();
  const wishlistEnabled = useFeature("wishlist");
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const ui = useUiConfig();
  const cardConfig: ProductCardConfig = ui.productCard;

  // Wishlist toggle handler
  const handleWishlistToggle = useCallback((product: ProductListItemFragment) => {
    const productId = product.id;
    if (isInWishlist(productId)) {
      removeItem(productId);
    } else {
      const price = product.pricing?.priceRange?.start?.gross;
      const originalPrice = product.pricing?.priceRangeUndiscounted?.start?.gross;
      const image = product.thumbnail?.url || product.media?.[0]?.url;
      addItem({
        id: productId,
        name: product.name,
        slug: product.slug,
        price: price?.amount || 0,
        originalPrice: originalPrice?.amount,
        currency: price?.currency || "USD",
        image: image || "",
        imageAlt: product.thumbnail?.alt || product.name,
        category: product.category?.name || undefined,
        inStock: (product.variants?.some(v => (v.quantityAvailable ?? 0) > 0)) ?? true,
      });
    }
  }, [addItem, removeItem, isInWishlist]);

  // Use config values with defaults fallback
  const enabled = config?.enabled ?? DEFAULTS.enabled;
  const maxProducts = config?.maxProducts ?? DEFAULTS.maxProducts;

  // Priority: props > config > content config > defaults
  const displayTitle = title || config?.title || contentConfig.homepage.newArrivalsTitle || DEFAULTS.title;
  const displaySubtitle = subtitle || config?.subtitle || contentConfig.homepage.newArrivalsSubtitle || DEFAULTS.subtitle;

  const storeName = storeInfo.name || "Mansour Shoes";

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const viewDetailsText = homepageContent.viewDetailsButton || "View details";
  const performanceFallback = homepageContent.performanceFallback || "Performance";

  // Badge labels for translation
  const badgeLabels: BadgeLabels = {
    outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
    sale: homepageContent.saleBadgeLabel || "Sale",
    lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
    new: homepageContent.newBadgeLabel || "New",
    featured: homepageContent.featuredBadgeLabel || "Featured",
  };

  // Hide if explicitly disabled or no products
  if (!enabled || products.length === 0) return null;

  const displayProducts = products.slice(0, maxProducts);

  return (
    <section className="bg-white py-20" aria-label="Trending products">
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* V6-style centered header with accent dot */}
        <div className="mb-16 flex flex-col items-center justify-center text-center">
          <h2 className="flex items-center gap-4 text-5xl font-black uppercase italic tracking-tighter text-neutral-900 md:text-6xl">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colors.accent }}
              aria-hidden="true"
            />
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p className="mt-4 font-medium tracking-wide text-neutral-500">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {displayProducts.map((product) => (
            <div key={product.id} className="h-auto sm:h-[520px]">
              <ProductCard
                product={product}
                channel={channel}
                storeName={storeName}
                accent={colors.primary}
                badgeLabels={badgeLabels}
                viewDetailsText={viewDetailsText}
                performanceFallback={performanceFallback}
                onQuickView={openQuickView}
                onPrefetch={prefetchQuickView}
                wishlistEnabled={wishlistEnabled}
                isWishlisted={isInWishlist(product.id)}
                onWishlistToggle={handleWishlistToggle}
                cardConfig={cardConfig}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
