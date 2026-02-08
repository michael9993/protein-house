"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoneyRange, formatMoney } from "@/lib/utils";
import type { ProductListItemFragment } from "@/gql/graphql";
import {
  useBranding,
  useFeature,
  useContentConfig,
  useBadgeStyle,
  useStoreInfo,
} from "@/providers/StoreConfigProvider";
import { useWishlist } from "@/lib/wishlist";
import { useQuickView } from "@/providers/QuickViewProvider";
import { ShareButton } from "@/ui/components/ProductSharing";
import type { DisplayMode } from "./DisplayModeToggle";

/**
 * ProductCard - Premium Athletic E-Commerce Card
 *
 * Design Philosophy:
 * - Bold, dramatic hover states that feel "fast"
 * - Premium materials: glass effects, dramatic shadows
 * - Athletic typography: condensed, bold, uppercase
 * - Action-oriented: Quick View + Add to Cart on hover
 * - High contrast, memorable design
 *
 * Display Mode Adaptations:
 * - Mode 1: Horizontal layout, all details visible
 * - Mode 2: Compact vertical, essential info only
 * - Mode 4: Dense grid, minimal info on mobile
 */

interface ProductCardProps {
  product: ProductListItemFragment;
  loading?: "eager" | "lazy";
  priority?: boolean;
  featured?: boolean;
  displayMode?: DisplayMode;
}

const BRAND_ATTRIBUTE_SLUGS = ["brand", "vendor", "manufacturer", "label"];

function getProductBrand(
  product: ProductListItemFragment,
  fallback: string
): string {
  const attribute = product.attributes?.find((entry) =>
    entry.attribute?.slug
      ? BRAND_ATTRIBUTE_SLUGS.includes(entry.attribute.slug.toLowerCase())
      : false
  );
  const value = attribute?.values?.[0]?.name;
  return (
    value || product.collections?.[0]?.name || product.category?.name || fallback
  );
}

export function ProductCard({
  product,
  loading = "lazy",
  priority = false,
  featured = false,
  displayMode = 4,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Layout configuration based on display mode
  const isCompactMode = displayMode === 4;
  const isSingleColumn = displayMode === 1;

  // Storefront Control hooks
  const branding = useBranding();
  const storeInfo = useStoreInfo();
  const wishlistEnabled = useFeature("wishlist");
  const reviewsEnabled = useFeature("productReviews");
  const content = useContentConfig();
  const saleBadgeStyle = useBadgeStyle("sale");
  const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
  const lowStockBadgeStyle = useBadgeStyle("lowStock");

  const { openQuickView, prefetchQuickView } = useQuickView();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brandName = getProductBrand(product, storeInfo.name || "");

  // Content text
  const quickViewText =
    (content.product as { quickAddButton?: string })?.quickAddButton ||
    "Quick View";
  const saleBadgeText = content.product?.saleBadgeText || "SALE";
  const outOfStockText = content.product?.outOfStockText || "SOLD OUT";
  const lowStockText = content.product?.lowStockText || "LAST {count}";

  // Calculate discount
  const hasDiscount =
    product.pricing?.priceRange?.start?.gross &&
    product.pricing?.priceRangeUndiscounted?.start?.gross &&
    product.pricing.priceRange.start.gross.amount <
      product.pricing.priceRangeUndiscounted.start.gross.amount;

  const discountPercent = hasDiscount
    ? Math.round(
        (1 -
          product.pricing!.priceRange!.start!.gross.amount /
            product.pricing!.priceRangeUndiscounted!.start!.gross.amount) *
          100
      )
    : 0;

  // Stock status
  const totalStock =
    product.variants?.reduce((sum, v) => sum + (v.quantityAvailable || 0), 0) ??
    0;
  const isInStock = totalStock > 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    prefetchTimeoutRef.current = setTimeout(
      () => prefetchQuickView(product.slug),
      100
    );
  }, [product.slug, prefetchQuickView]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  // Wishlist handler
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
        originalPrice:
          product.pricing?.priceRangeUndiscounted?.start?.gross?.amount,
        currency: product.pricing?.priceRange?.start?.gross?.currency || "USD",
        image: product.thumbnail?.url || "",
        imageAlt: product.thumbnail?.alt || product.name,
        category: product.category?.name || undefined,
        inStock: isInStock,
      });
    }
  };

  // Quick View handler
  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product.slug);
  };

  const productRating = (product as any).rating;
  const hasRating =
    reviewsEnabled && productRating !== null && productRating !== undefined;

  return (
    <article
      className={`v7-card group relative flex h-full overflow-hidden bg-white ${
        featured ? "v7-card-featured" : ""
      } ${isSingleColumn
        ? "flex-row rounded-2xl"
        : "flex-col rounded-2xl sm:rounded-3xl"
      }`}
      style={{
        boxShadow: "var(--v7-shadow-card)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LinkWithChannel
        href={`/products/${product.slug}`}
        className={`flex h-full ${isSingleColumn ? "flex-row" : "flex-col"}`}
      >
        {/* Image Container */}
        <div
          className={`v7-card-image-container relative overflow-hidden ${
            featured
              ? "min-h-[320px] sm:min-h-[400px]"
              : isSingleColumn
                ? "aspect-square w-36 shrink-0 sm:w-48"
                : isCompactMode
                  ? "aspect-square"
                  : "aspect-square"
          }`}
          style={{
            background: `linear-gradient(145deg, #f8f8f8 0%, #ffffff 50%, #f5f5f5 100%)`,
          }}
        >
          {/* Product Image */}
          {product.thumbnail?.url && !imageError ? (
            <Image
              src={product.thumbnail.url}
              alt={product.thumbnail.alt || product.name}
              fill
              loading={loading}
              priority={priority}
              className="v7-card-image object-cover"
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 50vw"
                  : isSingleColumn
                    ? "200px"
                    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              }
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag className={`text-neutral-200 ${isCompactMode ? "h-10 w-10" : "h-16 w-16"}`} strokeWidth={1} />
            </div>
          )}

          {/* === BADGES === */}
          {/* Sale Badge - Top Left, Bold */}
          {hasDiscount && discountPercent > 0 && (
            <div
              className={`v7-badge-sale absolute z-20 flex items-center gap-1 rounded-full ${
                isCompactMode
                  ? "start-2 top-2 px-2 py-1"
                  : "start-3 top-3 px-3 py-1.5 sm:start-4 sm:top-4"
              }`}
              style={{
                backgroundColor: saleBadgeStyle.backgroundColor || "#ef4444",
                color: saleBadgeStyle.color || "#ffffff",
              }}
            >
              <span className={`font-black uppercase tracking-wide ${
                isCompactMode ? "text-[10px]" : "text-[10px] sm:text-xs"
              }`}>
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Out of Stock Badge */}
          {!isInStock && (
            <div
              className={`absolute z-20 rounded-full ${
                isCompactMode
                  ? "start-2 top-2 px-2 py-1"
                  : "start-3 top-3 px-3 py-1.5 sm:start-4 sm:top-4"
              }`}
              style={{
                backgroundColor: outOfStockBadgeStyle.backgroundColor || "#18181b",
                color: outOfStockBadgeStyle.color || "#ffffff",
              }}
            >
              <span className={`font-black uppercase tracking-wide ${
                isCompactMode ? "text-[10px]" : "text-[10px] sm:text-xs"
              }`}>
                {outOfStockText}
              </span>
            </div>
          )}

          {/* Low Stock Badge */}
          {isLowStock && !hasDiscount && (
            <div
              className={`absolute z-20 rounded-full ${
                isCompactMode
                  ? "start-2 top-2 px-2 py-1"
                  : "start-3 top-3 px-3 py-1.5 sm:start-4 sm:top-4"
              }`}
              style={{
                backgroundColor: lowStockBadgeStyle.backgroundColor || "#f59e0b",
                color: lowStockBadgeStyle.color || "#ffffff",
              }}
            >
              <span className={`font-black uppercase tracking-wide ${
                isCompactMode ? "text-[10px]" : "text-[10px] sm:text-xs"
              }`}>
                {lowStockText.replace("{count}", String(totalStock))}
              </span>
            </div>
          )}

          {/* === TOP RIGHT ACTIONS === */}
          <div className={`absolute z-20 flex flex-col gap-2 ${
            isCompactMode
              ? "end-2 top-2"
              : "end-3 top-3 sm:end-4 sm:top-4"
          }`}>
            {/* Wishlist Button */}
            {wishlistEnabled && (
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`v7-heart v7-action-btn flex items-center justify-center rounded-full shadow-lg ${
                  isCompactMode ? "h-9 w-9" : "h-10 w-10 sm:h-11 sm:w-11"
                } ${
                  isWishlisted
                    ? "v7-heart-filled bg-red-500 text-white"
                    : "v7-glass border border-white/50 text-neutral-600 hover:bg-red-500 hover:text-white"
                }`}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  className={isCompactMode ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"}
                  fill={isWishlisted ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            )}
            {/* Share Button */}
            <ShareButton
              variant="icon"
              productName={product.name}
              productSlug={product.slug}
              productImage={product.thumbnail?.url || null}
              className={`v7-action-btn flex items-center justify-center rounded-full shadow-lg v7-glass border border-white/50 text-neutral-600 hover:text-neutral-800 ${
                isCompactMode ? "h-9 w-9" : "h-10 w-10 sm:h-11 sm:w-11"
              }`}
              iconClassName={isCompactMode ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"}
            />
          </div>

          {/* === BRAND BADGE === */}
          {brandName && (
            <div className={`v7-brand-badge absolute z-20 ${
              isCompactMode
                ? "bottom-2 start-2"
                : "bottom-3 start-3 sm:bottom-4 sm:start-4"
            }`}>
              <span
                className={`v7-glass inline-flex items-center rounded-full border border-white/60 font-black uppercase text-neutral-700 shadow-md ${
                  isCompactMode
                    ? "px-2 py-0.5 text-[8px] tracking-[0.1em]"
                    : "px-2.5 py-1 text-[9px] tracking-[0.12em] sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.15em]"
                }`}
              >
                {brandName}
              </span>
            </div>
          )}

          {/* === HOVER OVERLAY - Dark gradient with actions === */}
          <div className="v7-overlay-gradient pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* === ACTION BAR - Slides up on hover (hidden on mobile) === */}
          <div className={`v7-action-bar absolute inset-x-0 bottom-0 z-30 hidden items-center justify-center gap-3 px-4 pb-6 pt-12 sm:flex ${
            isSingleColumn ? "sm:hidden" : ""
          }`}>
            {/* Quick View Button */}
            <button
              type="button"
              onClick={handleQuickView}
              onTouchStart={() => prefetchQuickView(product.slug)}
              className="v7-action-btn flex h-12 items-center justify-center gap-2 rounded-full px-6 font-bold uppercase tracking-wide text-white shadow-xl"
              style={{
                backgroundColor: branding.colors.primary,
                fontSize: "11px",
              }}
            >
              <Eye className="h-4 w-4" strokeWidth={2.5} />
              <span>{quickViewText}</span>
            </button>
          </div>
        </div>

        {/* === CONTENT AREA === */}
        <div className={`flex flex-1 flex-col ${
          isCompactMode
            ? "p-3 sm:p-4"
            : isSingleColumn
              ? "justify-center p-4 sm:p-5"
              : "p-3 sm:p-5"
        }`}>
          {/* Category Label */}
          {product.category?.name && (
            <div className={`v7-category text-neutral-400 ${
              isCompactMode ? "mb-0.5 text-[10px]" : "mb-1 sm:mb-2"
            }`}>
              {product.category.name}
            </div>
          )}

          {/* Product Name */}
          <h3 className={`font-bold leading-tight text-neutral-900 ${
            isCompactMode
              ? "line-clamp-2 min-h-[2.25rem] text-sm sm:min-h-[2.5rem] sm:text-base"
              : isSingleColumn
                ? "line-clamp-2 text-base sm:text-lg"
                : "line-clamp-2 min-h-[2.5rem] text-sm sm:min-h-[2.75rem] sm:text-base"
          }`}>
            <span className="v7-name-underline">{product.name}</span>
          </h3>

          {/* Rating */}
          {hasRating && (
            <div className={`flex items-center ${
              isCompactMode ? "mt-1 gap-1" : "mt-1.5 gap-1.5 sm:mt-2"
            }`}>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`${
                      isCompactMode ? "h-2.5 w-2.5" : "h-3 w-3 sm:h-3.5 sm:w-3.5"
                    } ${
                      star <= Math.round(productRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-neutral-200 text-neutral-200"
                    }`}
                    strokeWidth={0}
                  />
                ))}
              </div>
              <span className={`font-medium text-neutral-500 ${
                isCompactMode ? "text-[10px]" : "text-xs"
              }`}>
                {productRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Price Row */}
          <div className={`mt-auto flex items-end justify-between gap-2 ${
            isCompactMode ? "pt-2" : "pt-3 sm:pt-4"
          }`}>
            <div className="flex flex-col">
              {hasDiscount &&
                product.pricing?.priceRangeUndiscounted?.start?.gross && (
                  <span className={`font-medium text-neutral-400 line-through ${
                    isCompactMode ? "text-[10px] sm:text-xs" : "text-xs"
                  }`}>
                    {formatMoney(
                      product.pricing.priceRangeUndiscounted.start.gross.amount,
                      product.pricing.priceRangeUndiscounted.start.gross.currency
                    )}
                  </span>
                )}
              <span className="v7-price relative">
                <span className="v7-price-highlight" />
                <span
                  className={`relative font-black tracking-tight ${
                    isCompactMode
                      ? "text-base sm:text-lg"
                      : isSingleColumn
                        ? "text-xl"
                        : "text-lg sm:text-xl"
                  }`}
                  style={{ color: branding.colors.primary }}
                >
                  {formatMoneyRange({
                    start: product.pricing?.priceRange?.start?.gross,
                    stop: product.pricing?.priceRange?.stop?.gross,
                  })}
                </span>
              </span>
            </div>

            {/* Quick View Icon Button - Always visible on mobile, hidden on desktop */}
            <button
              type="button"
              onClick={handleQuickView}
              className={`flex items-center justify-center rounded-full shadow-lg sm:hidden ${
                isCompactMode ? "h-9 w-9" : "h-10 w-10"
              }`}
              style={{
                backgroundColor: branding.colors.primary,
                color: "#ffffff",
              }}
              aria-label={quickViewText}
            >
              <Eye className={isCompactMode ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
            </button>

            {/* Quick View Button for Single Column Mode - Always visible */}
            {isSingleColumn && (
              <button
                type="button"
                onClick={handleQuickView}
                className="hidden h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-bold uppercase tracking-wide text-white shadow-lg sm:flex"
                style={{
                  backgroundColor: branding.colors.primary,
                }}
              >
                <Eye className="h-4 w-4" strokeWidth={2.5} />
                <span>{quickViewText}</span>
              </button>
            )}
          </div>
        </div>
      </LinkWithChannel>
    </article>
  );
}
