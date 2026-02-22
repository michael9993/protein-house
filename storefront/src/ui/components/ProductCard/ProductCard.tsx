"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoneyRange, formatMoney } from "@/lib/utils";
import type { ProductListItemFragment } from "@/gql/graphql";
import { t } from "@/lib/language";
import { useBranding, useFeature, useUiConfig, useContentConfig, useBadgeStyle, useEcommerceSettings, useProductDetailText } from "@/providers/StoreConfigProvider";
import { getProductShippingEstimate, formatEstimate } from "@/lib/shipping";
import { useWishlist } from "@/lib/wishlist";
import { useQuickView } from "@/providers/QuickViewProvider";
import { ShareButton } from "@/ui/components/ProductSharing";

interface ProductCardProps {
  product: ProductListItemFragment;
  loading?: "eager" | "lazy";
  priority?: boolean;
}

// Map border radius config to Tailwind classes
const radiusMap: Record<"none" | "sm" | "md" | "lg" | "xl" | "full", string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

// Map shadow config to Tailwind classes
const shadowMap = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

// Map font size config to Tailwind classes
const fontSizeMap: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

// Map font weight config to Tailwind classes
const fontWeightMap: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

// Map aspect ratio config
const aspectRatioMap = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

export function ProductCard({ product, loading = "lazy", priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { channel } = useParams<{ channel?: string }>();

  // Use hooks instead of direct config import
  const branding = useBranding();
  const wishlistEnabled = useFeature("wishlist");
  const reviewsEnabled = useFeature("productReviews");
  const ui = useUiConfig();
  const content = useContentConfig();
  const ecommerce = useEcommerceSettings();
  const saleBadgeStyle = useBadgeStyle("sale");
  const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
  const lowStockBadgeStyle = useBadgeStyle("lowStock");

  // Product card config
  const cardConfig = ui.productCard;
  const ts = cardConfig.textStyles;
  const showQuickView = cardConfig.showQuickView ?? false;
  const quickAddLabel = (content.product as { quickAddButton?: string })?.quickAddButton ?? "Quick add";

  const { openQuickView, prefetchQuickView } = useQuickView();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce prefetch on hover (desktop) so we don't fetch for every card when moving mouse quickly
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!showQuickView) return;
    prefetchTimeoutRef.current = setTimeout(() => prefetchQuickView(product.slug), 120);
  }, [showQuickView, product.slug, prefetchQuickView]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  // Calculate discount if available
  const hasDiscount = product.pricing?.priceRange?.start?.gross &&
    product.pricing?.priceRangeUndiscounted?.start?.gross &&
    product.pricing.priceRange.start.gross.amount <
    product.pricing.priceRangeUndiscounted.start.gross.amount;

  const discountPercent = hasDiscount
    ? Math.round((1 - (product.pricing!.priceRange!.start!.gross.amount /
        product.pricing!.priceRangeUndiscounted!.start!.gross.amount)) * 100)
    : 0;

  // Check stock — use configurable threshold
  const lowStockThreshold = ecommerce.inventory?.lowStockThreshold ?? 5;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantityAvailable || 0), 0) ?? 0;
  const isInStock = totalStock > 0;
  const isLowStock = totalStock > 0 && totalStock <= lowStockThreshold;
  
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
        originalPrice: product.pricing?.priceRangeUndiscounted?.start?.gross?.amount,
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

  // Get classes from config
  const cardRadius = radiusMap[cardConfig.borderRadius] || "rounded-lg";
  const cardShadow = shadowMap[cardConfig.shadow] || "";
  const hoverShadow = shadowMap[cardConfig.hoverShadow] || "shadow-lg";
  const imageAspect = aspectRatioMap[cardConfig.imageAspectRatio] || "aspect-square";

  return (
    <article 
      className={`group relative flex flex-col ${cardRadius} overflow-hidden bg-white transition-all duration-300 ${cardShadow} hover:${hoverShadow}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LinkWithChannel href={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div 
          className={`relative ${imageAspect} overflow-hidden bg-neutral-100 transition-all duration-300`}
        >
          {/* Product Image */}
          {product.thumbnail?.url && !imageError ? (
            <Image
              src={product.thumbnail.url}
              alt={product.thumbnail.alt || t(product)}
              fill
              loading={loading}
              priority={priority}
              className={`object-cover transition-transform duration-500 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-200">
              <svg className="h-12 w-12 text-neutral-400 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Overlay gradient on hover with brand color */}
          <div 
            className={`absolute inset-0 bg-black/5 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Quick View button - always visible on mobile, hover on desktop */}
          {/* Quick View Button - Always visible, slightly larger */}
          {/* Quick View Button - Always visible, slightly larger, Brand Color */}
          <button
            type="button"
            onTouchStart={() => prefetchQuickView(product.slug)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickView(product.slug);
            }}
            className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-2 shadow-md transition-all duration-200 hover:scale-110 active:scale-95 bg-white/90"
            style={{ 
              borderColor: "white", 
              color: "var(--store-primary)" 
            }}
            aria-label={quickAddLabel}
            title={quickAddLabel}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Badges - Top Left */}
          <div className="absolute left-2 top-2 flex flex-col gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
            {hasDiscount && discountPercent > 0 && (
              <span 
                className={`${radiusMap[saleBadgeStyle.borderRadius] || "rounded"} px-2 py-1 text-xs font-bold shadow-sm`}
                style={{ 
                  backgroundColor: saleBadgeStyle.backgroundColor,
                  color: saleBadgeStyle.color,
                }}
              >
                -{discountPercent}%
              </span>
            )}
            {!isInStock && (
              <span 
                className={`${radiusMap[outOfStockBadgeStyle.borderRadius] || "rounded-full"} px-2 py-0.5 text-[10px] font-medium shadow-sm sm:px-2.5 sm:py-1 sm:text-xs`}
                style={{ 
                  backgroundColor: outOfStockBadgeStyle.backgroundColor,
                  color: outOfStockBadgeStyle.color,
                }}
              >
                {content.product.outOfStockText}
              </span>
            )}
            {isLowStock && (
              <span
                className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded"} inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold leading-none`}
                style={{
                  backgroundColor: lowStockBadgeStyle.backgroundColor,
                  color: lowStockBadgeStyle.color,
                }}
              >
                <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                {content.product.lowStockText.replace("{count}", String(totalStock))}
              </span>
            )}
          </div>


          {/* Action Buttons - Top Right (Wishlist + Share) */}
          <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 sm:right-3 sm:top-3">
            {wishlistEnabled && cardConfig.showWishlistButton && (
              <button
                onClick={handleWishlistClick}
                className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 sm:h-9 sm:w-9 ${
                  isWishlisted ? "text-red-500 opacity-100" : "text-neutral-400 opacity-70 hover:text-red-500 hover:opacity-100"
                }`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill={isWishlisted ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            <ShareButton
              variant="icon"
              productName={t(product)}
              productSlug={product.slug}
              productImage={product.thumbnail?.url || null}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md text-neutral-400 opacity-70 transition-all duration-200 hover:text-neutral-600 hover:opacity-100 sm:h-9 sm:w-9"
              iconClassName="h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-3 flex flex-col p-4 sm:mt-4 sm:p-5">
          {/* Product Name */}
          <h3
            className={`mt-1 line-clamp-2 ${fontSizeMap[ts?.name?.fontSize || "sm"]} ${fontWeightMap[ts?.name?.fontWeight || "semibold"]} transition-colors group-hover:opacity-80`}
            style={{ color: ts?.name?.color || branding.colors.text }}
          >
            {t(product)}
          </h3>
          
          {/* Price */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`${fontSizeMap[ts?.price?.fontSize || "base"]} ${fontWeightMap[ts?.price?.fontWeight || "bold"]}`}
              style={{ color: ts?.price?.color || branding.colors.primary }}
            >
              {formatMoneyRange({
                start: product.pricing?.priceRange?.start?.gross,
                stop: product.pricing?.priceRange?.stop?.gross,
              })}
            </span>
            
            {hasDiscount && product.pricing?.priceRangeUndiscounted?.start?.gross && (
              <span
                className={`${fontSizeMap[ts?.originalPrice?.fontSize || "sm"]} ${fontWeightMap[ts?.originalPrice?.fontWeight || "normal"]} line-through ${!ts?.originalPrice?.color ? "text-neutral-400" : ""}`}
                style={ts?.originalPrice?.color ? { color: ts.originalPrice.color } : undefined}
              >
                {formatMoney(
                  product.pricing.priceRangeUndiscounted.start.gross.amount,
                  product.pricing.priceRangeUndiscounted.start.gross.currency
                )}
              </span>
            )}
          </div>

          {/* Rating */}
          {reviewsEnabled && (product as any).rating !== null && (product as any).rating !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round((product as any).rating || 0) ? "text-amber-400" : "text-neutral-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              {(product as any).reviews?.totalCount !== null && (product as any).reviews?.totalCount !== undefined && (
                <span
                  className={`ml-1 ${fontSizeMap[ts?.reviewCount?.fontSize || "xs"]} ${fontWeightMap[ts?.reviewCount?.fontWeight || "normal"]} ${!ts?.reviewCount?.color ? "text-neutral-500" : ""}`}
                  style={ts?.reviewCount?.color ? { color: ts.reviewCount.color } : undefined}
                >({(product as any).reviews.totalCount})</span>
              )}
            </div>
          )}

          {/* Delivery Estimate */}
          <UiCardDeliveryBadge metadata={product.metadata} />
        </div>
      </LinkWithChannel>
    </article>
  );
}

function UiCardDeliveryBadge({ metadata }: { metadata?: Array<{ key: string; value: string }> | null }) {
  const ecommerce = useEcommerceSettings();
  const pdText = useProductDetailText();
  if (!ecommerce.shipping?.showEstimatedDelivery) return null;
  const est = getProductShippingEstimate(metadata);
  if (!est) return null;
  const days = formatEstimate(est, ecommerce.shipping.estimatedDeliveryFormat ?? "range");
  const label = pdText.deliveryEstimateLabel?.replace("{days}", days) ?? `Ships in ${days} days`;
  return <p className="mt-1 truncate text-xs text-neutral-500">{label}</p>;
}
