"use client";

import Image from "next/image";
import { useState } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoneyRange, formatMoney } from "@/lib/utils";
import type { ProductListItemFragment } from "@/gql/graphql";
import { storeConfig } from "@/config";
import { useWishlist } from "@/lib/wishlist";

interface ProductCardProps {
  product: ProductListItemFragment;
  loading?: "eager" | "lazy";
  priority?: boolean;
}

export function ProductCard({ product, loading = "lazy", priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { branding, features } = storeConfig;
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  
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
  
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeItem(product.id);
    } else {
      addItem({
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

  return (
    <article 
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <LinkWithChannel href={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
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
          
          {/* Overlay gradient on hover */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Badges - Top Left */}
          <div className="absolute left-2 top-2 flex flex-col gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
            {hasDiscount && discountPercent > 0 && (
              <span 
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-xs"
                style={{ backgroundColor: "#ef4444" }}
              >
                -{discountPercent}%
              </span>
            )}
            {!isInStock && (
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-xs">
                Out of Stock
              </span>
            )}
            {isLowStock && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-xs">
                Only {totalStock} left
              </span>
            )}
          </div>

          {/* Wishlist Button - Top Right */}
          {features.wishlist && (
            <button
              onClick={handleWishlistClick}
              className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${
                isWishlisted ? "text-red-500" : "text-neutral-400 hover:text-red-500"
              } ${isHovered || isWishlisted ? "opacity-100" : "opacity-0"}`}
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
        <div className="mt-3 flex flex-col sm:mt-4">
          {/* Category */}
          {product.category?.name && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 sm:text-xs">
              {product.category.name}
            </span>
          )}
          
          {/* Product Name */}
          <h3 className="mt-1 line-clamp-2 text-xs font-semibold text-neutral-900 transition-colors group-hover:text-neutral-700 sm:text-sm">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
            <span 
              className="text-sm font-bold sm:text-base"
              style={{ color: hasDiscount ? "#ef4444" : branding.colors.text }}
            >
              {formatMoneyRange({
                start: product.pricing?.priceRange?.start?.gross,
                stop: product.pricing?.priceRange?.stop?.gross,
              })}
            </span>
            
            {hasDiscount && product.pricing?.priceRangeUndiscounted?.start?.gross && (
              <span className="text-xs text-neutral-400 line-through sm:text-sm">
                {formatMoney(
                  product.pricing.priceRangeUndiscounted.start.gross.amount,
                  product.pricing.priceRangeUndiscounted.start.gross.currency
                )}
              </span>
            )}
          </div>

          {/* Rating placeholder */}
          {features.reviews && (
            <div className="mt-1.5 flex items-center gap-0.5 sm:mt-2 sm:gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${star <= 4 ? "text-amber-400" : "text-neutral-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-0.5 text-[10px] text-neutral-500 sm:ml-1 sm:text-xs">(24)</span>
            </div>
          )}
        </div>
      </LinkWithChannel>
    </article>
  );
}
