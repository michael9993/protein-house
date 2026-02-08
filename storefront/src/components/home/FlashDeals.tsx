"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useCallback } from "react";
import { ArrowRight, Heart } from "lucide-react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";
import { useBranding, useStoreInfo, useFlashDealsConfig, useContentConfig, useUiConfig, useFeature } from "@/providers/StoreConfigProvider";
import { useQuickView } from "@/providers/QuickViewProvider";
import { ShareButton } from "@/ui/components/ProductSharing";
import {
  getProductImage,
  getProductAlt,
  getProductBrand,
  getDiscountPercent,
  getCardHoverClasses,
  type ProductCardConfig,
} from "./utils";

interface FlashDealsProps {
  products: readonly ProductListItemFragment[];
  channel: string;
  maxDiscount: number;
}

// Default values when config is not available
const DEFAULTS = {
  enabled: true,
  title: "Flash Deals",
  subtitle: "Limited time offers",
  badgeTemplate: "Up to {discount}% OFF",
  collectionSlug: "sale",
  maxProducts: 8,
};

interface FlashDealCardProps {
  product: ProductListItemFragment;
  channel: string;
  storeName: string;
  accent: string;
  saleBadgeLabel: string;
  viewDetailsText: string;
  onQuickView: (slug: string) => void;
  onPrefetch: (slug: string) => void;
  wishlistEnabled: boolean;
  isWishlisted: boolean;
  onWishlistToggle: (product: ProductListItemFragment) => void;
  cardConfig: ProductCardConfig;
}

/**
 * ProductCard — Flash deals card with prominent discount badge.
 */
function ProductCard({
  product,
  channel,
  storeName,
  accent,
  saleBadgeLabel,
  viewDetailsText,
  onQuickView,
  onPrefetch,
  wishlistEnabled,
  isWishlisted,
  onWishlistToggle,
  cardConfig,
}: FlashDealCardProps) {
  const image = getProductImage(product);
  const brand = getProductBrand(product, storeName);
  const discountPercent = getDiscountPercent(product);
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
        {/* Sale discount badge — prominent red with percentage */}
        {discountPercent > 0 && (
          <span className="absolute start-4 top-4 z-10 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}
        {/* Brand */}
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
        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        {/* Quick View button */}
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
      {/* Product info */}
      <div className="border-t border-neutral-100 px-5 pb-5 pt-4">
        <h3 className="line-clamp-2 text-sm font-black uppercase tracking-tight text-neutral-900">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
              {product.category?.name ?? saleBadgeLabel}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-black" style={{ color: accent }}>
                {priceRange || "N/A"}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">{originalRange}</span>
              )}
            </div>
          </div>
          {cardConfig.showRating !== false && product.rating != null && product.rating > 0 && (
            <div className="text-end text-xs font-semibold text-neutral-500">
              {product.rating.toFixed(1)} / 5
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * FlashDeals - Sale products showcase with discount badges
 * Configurable via Storefront Control.
 */
export function FlashDeals({ products, channel, maxDiscount }: FlashDealsProps) {
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const config = useFlashDealsConfig();
  const contentConfig = useContentConfig();
  const ui = useUiConfig();
  const cardConfig: ProductCardConfig = ui.productCard;
  const { openQuickView, prefetchQuickView } = useQuickView();
  const wishlistEnabled = useFeature("wishlist");
  const { addItem, removeItem, isInWishlist } = useWishlist();

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
  const title = config?.title ?? contentConfig.homepage.onSaleTitle ?? DEFAULTS.title;
  const subtitle = config?.subtitle ?? contentConfig.homepage.onSaleSubtitle ?? DEFAULTS.subtitle;
  const badgeTemplate = config?.badgeTemplate ?? contentConfig.homepage.upToPercentOffText ?? DEFAULTS.badgeTemplate;
  const collectionSlug = config?.collectionSlug ?? DEFAULTS.collectionSlug;
  const maxProducts = config?.maxProducts ?? DEFAULTS.maxProducts;

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const viewAllOffersText = homepageContent.viewAllOffersButton || "View all offers";
  const viewDetailsText = homepageContent.viewDetailsButton || "View details";
  const saleBadgeLabel = homepageContent.saleBadgeLabel || "Sale";
  const itemsText = homepageContent.itemsText || "items";

  // Hide if explicitly disabled or no products
  if (!enabled || products.length === 0) return null;

  const storeName = storeInfo.name || "Store";
  const saleItems = products.slice(0, maxProducts);

  // Format badge with actual discount
  const badgeText = badgeTemplate.replace("{discount}", String(maxDiscount));

  return (
    <section className="border-b border-neutral-100 bg-white py-20" aria-label="Flash deals section">
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            {/* Discount badge */}
            {maxDiscount > 0 && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {badgeText} &bull; {products.length} {itemsText}
              </span>
            )}
            <h2 className="mt-2 text-4xl font-black uppercase italic tracking-tighter text-neutral-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm font-medium text-neutral-500">{subtitle}</p>
            )}
          </div>
          <Link
            href={`/${encodeURIComponent(channel)}/products?collections=${collectionSlug}`}
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900"
          >
            {viewAllOffersText}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {saleItems.map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                channel={channel}
                storeName={storeName}
                accent={colors.primary}
                saleBadgeLabel={saleBadgeLabel}
                viewDetailsText={viewDetailsText}
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
