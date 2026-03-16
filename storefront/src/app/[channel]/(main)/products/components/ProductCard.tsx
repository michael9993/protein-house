"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoneyRange, formatMoney } from "@/lib/utils";
import type { ProductListItemFragment } from "@/gql/graphql";
import {
  useBranding,
  useFeature,
  useProductCardConfig,
  useContentConfig,
  useBadgeStyle,
  useStoreInfo,
  useEcommerceSettings,
  useProductDetailText,
  useComponentStyle,
  useComponentClasses,
} from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { getProductShippingEstimate, formatEstimate } from "@/lib/shipping";
import { useWishlist } from "@/lib/wishlist";
import { useQuickView } from "@/providers/QuickViewProvider";
import { t } from "@/lib/language";
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
  const val = attribute?.values?.[0];
  const value = val ? ((val as any).translation?.name || val.name) : null;
  const collectionName = product.collections?.[0] ? ((product.collections[0] as any).translation?.name || product.collections[0].name) : null;
  const categoryName = product.category ? ((product.category as any).translation?.name || product.category.name) : null;
  return value || collectionName || categoryName || fallback;
}

export function ProductCard({
  product,
  loading = "lazy",
  priority = false,
  featured = false,
  displayMode = 4,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { channel } = useParams<{ channel?: string }>();

  // Layout configuration based on display mode
  const isCompactMode = displayMode === 4;
  const isSingleColumn = displayMode === 1;

  // Storefront Control hooks
  const branding = useBranding();
  const storeInfo = useStoreInfo();
  const wishlistEnabled = useFeature("wishlist");
  const reviewsEnabled = useFeature("productReviews");
  const cardConfig = useProductCardConfig("plp");
  const content = useContentConfig();
  const ecommerce = useEcommerceSettings();
  const saleBadgeStyle = useBadgeStyle("sale");
  const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
  const lowStockBadgeStyle = useBadgeStyle("lowStock");
  const cdStyle = useComponentStyle("plp.productCard");
  const cdClasses = useComponentClasses("plp.productCard");

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
  const lowStockText = content.product?.lowStockText || "Only {count} left";

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

  // Stock status — use configurable threshold
  const lowStockThreshold = ecommerce.inventory?.lowStockThreshold ?? 5;
  const totalStock =
    product.variants?.reduce((sum, v) => sum + (v.quantityAvailable || 0), 0) ??
    0;
  const isInStock = totalStock > 0;
  const isLowStock = totalStock > 0 && totalStock <= lowStockThreshold;

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
        name: t(product),
        slug: product.slug,
        price: product.pricing?.priceRange?.start?.gross?.amount || 0,
        originalPrice:
          product.pricing?.priceRangeUndiscounted?.start?.gross?.amount,
        currency: product.pricing?.priceRange?.start?.gross?.currency || "USD",
        image: product.thumbnail?.url || "",
        imageAlt: product.thumbnail?.alt || t(product),
        category: product.category ? t(product.category) : undefined,
        inStock: isInStock,
        channel: channel || undefined,
        metadata: product.metadata ?? undefined,
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
      data-cd="plp-productCard"
      className={`v7-card group relative flex h-full overflow-hidden bg-white ${
        featured ? "v7-card-featured" : ""
      } ${isSingleColumn
        ? "flex-row"
        : "flex-col"
      } ${
        cardConfig.borderRadius === "none" ? "rounded-none"
          : cardConfig.borderRadius === "sm" ? "rounded-sm"
          : cardConfig.borderRadius === "md" ? "rounded-md"
          : cardConfig.borderRadius === "lg" ? "rounded-lg"
          : cardConfig.borderRadius === "xl" ? "rounded-xl"
          : cardConfig.borderRadius === "full" ? "rounded-full"
          : "rounded-2xl sm:rounded-3xl"
      } ${cdClasses}`}
      style={{
        boxShadow: "var(--v7-shadow-card)",
        ...buildComponentStyle("plp.productCard", cdStyle),
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
                ? "w-36 shrink-0 sm:w-48"
                : ""
          } ${!featured ? (
            cardConfig.imageAspectRatio === "portrait" ? "aspect-[3/4]"
              : cardConfig.imageAspectRatio === "landscape" ? "aspect-[4/3]"
              : "aspect-square"
          ) : ""}`}
          style={{
            background: `linear-gradient(145deg, #f8f8f8 0%, #ffffff 50%, #f5f5f5 100%)`,
          }}
        >
          {/* Product Image */}
          {product.thumbnail?.url && !imageError ? (
            <Image
              src={product.thumbnail.url}
              alt={product.thumbnail.alt || t(product)}
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
              className={`absolute z-20 inline-flex items-center gap-1 rounded ${
                isCompactMode
                  ? "start-2 top-2 px-1.5 py-0.5"
                  : "start-3 top-3 px-2 py-1 sm:start-4 sm:top-4"
              }`}
              style={{
                backgroundColor: lowStockBadgeStyle.backgroundColor || "#f59e0b",
                color: lowStockBadgeStyle.color || "#ffffff",
              }}
            >
              <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
              <span className={`font-semibold leading-none ${
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
            {wishlistEnabled && (cardConfig.showWishlistButton ?? true) && (
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
              productName={t(product)}
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
              {t(product.category)}
            </div>
          )}

          {/* Product Name */}
          <h3
            className={`leading-tight ${
              isCompactMode
                ? "line-clamp-2 min-h-[2.25rem] text-sm sm:min-h-[2.5rem] sm:text-base"
                : isSingleColumn
                  ? "line-clamp-2 text-base sm:text-lg"
                  : "line-clamp-2 min-h-[2.5rem] text-sm sm:min-h-[2.75rem] sm:text-base"
            }`}
            style={{
              fontWeight: cardConfig.textStyles?.name?.fontWeight === "extrabold" ? 800
                : cardConfig.textStyles?.name?.fontWeight === "semibold" ? 600
                : cardConfig.textStyles?.name?.fontWeight === "medium" ? 500
                : cardConfig.textStyles?.name?.fontWeight === "normal" ? 400
                : 700,
              color: cardConfig.textStyles?.name?.color || branding.colors.text || "#171717",
            }}
          >
            <span className="v7-name-underline">{t(product)}</span>
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
                        ? "fill-warning-400 text-warning-400"
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

          {/* Delivery Estimate Badge — above price so it doesn't shift the button position */}
          <CardDeliveryBadge metadata={product.metadata} compact={isCompactMode} />

          {/* Price Row — mt-auto pins to card bottom so the button is always in the same spot */}
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
                  className={`relative tracking-tight ${
                    isCompactMode
                      ? "text-base sm:text-lg"
                      : isSingleColumn
                        ? "text-xl"
                        : "text-lg sm:text-xl"
                  }`}
                  style={{
                    color: cardConfig.textStyles?.price?.color || branding.colors.primary,
                    fontWeight: cardConfig.textStyles?.price?.fontWeight === "extrabold" ? 800
                      : cardConfig.textStyles?.price?.fontWeight === "semibold" ? 600
                      : cardConfig.textStyles?.price?.fontWeight === "medium" ? 500
                      : cardConfig.textStyles?.price?.fontWeight === "normal" ? 400
                      : 900,
                  }}
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
              className={`flex shrink-0 items-center justify-center rounded-full shadow-lg sm:hidden ${
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
                className="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-xs font-bold uppercase tracking-wide text-white shadow-lg sm:flex"
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

function CardDeliveryBadge({ metadata, compact }: { metadata?: Array<{ key: string; value: string }> | null; compact?: boolean }) {
  const ecommerce = useEcommerceSettings();
  const pdText = useProductDetailText();
  if (!ecommerce.shipping?.showEstimatedDelivery) return null;
  const est = getProductShippingEstimate(metadata);
  if (!est) return null;
  const days = formatEstimate(est, ecommerce.shipping.estimatedDeliveryFormat ?? "range");
  const label = pdText.deliveryEstimateLabel?.replace("{days}", days) ?? `Ships in ${days} days`;
  return (
    <p className={`mt-1 truncate text-neutral-500 ${compact ? "text-[10px]" : "text-xs"}`}>
      {label}
    </p>
  );
}
