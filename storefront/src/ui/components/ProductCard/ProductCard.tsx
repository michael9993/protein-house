"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoneyRange, formatMoney } from "@/lib/utils";
import type { ProductListItemFragment } from "@/gql/graphql";
import { useBranding, useFeature, useUiConfig, useContentConfig, useBadgeStyle } from "@/providers/StoreConfigProvider";
import { useWishlist } from "@/lib/wishlist";
import { useQuickView } from "@/providers/QuickViewProvider";

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

// Map aspect ratio config
const aspectRatioMap = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

export function ProductCard({ product, loading = "lazy", priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use hooks instead of direct config import
  const branding = useBranding();
  const wishlistEnabled = useFeature("wishlist");
  const reviewsEnabled = useFeature("productReviews");
  const ui = useUiConfig();
  const content = useContentConfig();
  const saleBadgeStyle = useBadgeStyle("sale");
  const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
  const lowStockBadgeStyle = useBadgeStyle("lowStock");
  
  // Product card config
  const cardConfig = ui.productCard;
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

  // Check stock
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantityAvailable || 0), 0) ?? 0;
  const isInStock = totalStock > 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;
  
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

  // Get classes from config
  const cardRadius = radiusMap[cardConfig.borderRadius] || "rounded-lg";
  const cardShadow = shadowMap[cardConfig.shadow] || "";
  const hoverShadow = shadowMap[cardConfig.hoverShadow] || "shadow-lg";
  const imageAspect = aspectRatioMap[cardConfig.imageAspectRatio] || "aspect-square";

  return (
    <article 
      className={`group relative flex flex-col ${cardRadius} overflow-hidden transition-all duration-300 ${cardShadow} hover:${hoverShadow}`}
      style={{
        border: `1px solid ${branding.colors.primary}20`,
        backgroundColor: branding.colors.surface,
        boxShadow: isHovered ? `0 10px 40px ${branding.colors.primary}15` : undefined,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LinkWithChannel href={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div 
          className={`relative ${imageAspect} overflow-hidden bg-neutral-100 transition-all duration-300`}
          style={{
            borderBottom: `3px solid ${branding.colors.primary}30`,
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
            className={`absolute inset-0 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: `linear-gradient(to top, ${branding.colors.primary}20 0%, transparent 100%)`,
            }}
          />

          {/* Quick View button - always visible on mobile, hover on desktop */}
          {showQuickView && (
            <button
              type="button"
              onTouchStart={() => prefetchQuickView(product.slug)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openQuickView(product.slug);
              }}
              className={`absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/95 shadow-lg backdrop-blur-sm transition-all duration-200 sm:bottom-3 sm:right-3 sm:h-10 sm:w-10 ${
                isHovered ? "scale-100 opacity-100" : "scale-95 opacity-100 sm:opacity-0 sm:group-hover:opacity-70"
              } hover:scale-105 hover:opacity-100 active:scale-95`}
              style={{ 
                color: branding.colors.primary,
                boxShadow: isHovered ? `0 4px 12px ${branding.colors.primary}30` : undefined,
              }}
              aria-label={quickAddLabel}
              title={quickAddLabel}
            >
              {/* Eye icon for "Quick View" */}
              <svg className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

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
                {content.product.saleBadgeText} -{discountPercent}%
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
                className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded-full"} px-2 py-0.5 text-[10px] font-medium shadow-sm sm:px-2.5 sm:py-1 sm:text-xs`}
                style={{ 
                  backgroundColor: lowStockBadgeStyle.backgroundColor,
                  color: lowStockBadgeStyle.color,
                }}
              >
                {content.product.lowStockText.replace("{count}", String(totalStock))}
              </span>
            )}
          </div>


          {/* Wishlist Button - Top Right */}
          {wishlistEnabled && cardConfig.showWishlistButton && (
            <button
              onClick={handleWishlistClick}
              className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${
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
        </div>

        {/* Product Info */}
        <div 
          className="mt-3 flex flex-col p-4 sm:mt-4 sm:p-5"
          style={{
            background: `linear-gradient(to bottom, ${branding.colors.primary}05 0%, transparent 100%)`,
          }}
        >
          {/* Product Name */}
          <h3 
            className="mt-1 line-clamp-2 text-sm font-semibold transition-colors group-hover:opacity-80"
            style={{ color: branding.colors.text }}
          >
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span 
              className="text-base font-bold"
              style={{ color: branding.colors.primary }}
            >
              {formatMoneyRange({
                start: product.pricing?.priceRange?.start?.gross,
                stop: product.pricing?.priceRange?.stop?.gross,
              })}
            </span>
            
            {hasDiscount && product.pricing?.priceRangeUndiscounted?.start?.gross && (
              <span className="text-sm text-neutral-400 line-through">
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
                <span className="ml-1 text-xs text-neutral-500">({(product as any).reviews.totalCount})</span>
              )}
            </div>
          )}
        </div>
      </LinkWithChannel>
    </article>
  );
}
