"use client";

import { useState } from "react";
import { storeConfig } from "@/config";
import { useWishlist } from "@/lib/wishlist";
import { ReviewList, ReviewForm, RatingStars } from "../ProductReviews";

interface ProductInfoProps {
  productId: string;
  productSlug: string;
  productImage?: string | null;
  productImageAlt?: string | null;
  name: string;
  description?: string | null;
  price: string;
  originalPrice?: string | null;
  isAvailable: boolean;
  category?: string | null;
  variants?: Array<{
    id: string;
    name: string;
    quantityAvailable?: number | null;
  }>;
  selectedVariantId?: string;
  onVariantSelect: (variantId: string) => void;
  onAddToCart: () => void;
  isAddingToCart?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
}

export function ProductInfo({
  productId,
  productSlug,
  productImage,
  productImageAlt,
  name,
  description,
  price,
  originalPrice,
  isAvailable,
  category,
  variants,
  selectedVariantId,
  onVariantSelect,
  onAddToCart,
  isAddingToCart = false,
  rating = null,
  reviewCount = null,
}: ProductInfoProps) {
  const { branding, features } = storeConfig;
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = isInWishlist(productId);
  const [activeTab, setActiveTab] = useState<"description" | "shipping" | "reviews">("description");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  const selectedVariant = variants?.find(v => v.id === selectedVariantId);
  const isSelectedInStock = selectedVariant?.quantityAvailable ? selectedVariant.quantityAvailable > 0 : isAvailable;

  return (
    <div className="flex flex-col">
      {/* Category */}
      {category && (
        <span 
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: branding.colors.primary }}
        >
          {category}
        </span>
      )}

      {/* Product Name */}
      <h1 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl">
        {name}
      </h1>

      {/* Rating */}
      {features.productReviews && rating !== null && rating !== undefined && rating > 0 && (
        <div className="mt-3">
          <RatingStars rating={rating} size="md" showValue />
          {reviewCount !== null && reviewCount !== undefined && reviewCount > 0 && (
            <span className="ml-2 text-sm text-neutral-600">({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
          )}
        </div>
      )}

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-3">
        <span 
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: originalPrice ? "#ef4444" : branding.colors.text }}
        >
          {price}
        </span>
        {originalPrice && (
          <span className="text-lg text-neutral-400 line-through">
            {originalPrice}
          </span>
        )}
      </div>

      {/* Availability */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`flex h-2.5 w-2.5 rounded-full ${isSelectedInStock ? "bg-emerald-500" : "bg-red-500"}`} />
        <span className={`text-sm font-medium ${isSelectedInStock ? "text-emerald-600" : "text-red-600"}`}>
          {isSelectedInStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Variants */}
      {variants && variants.length > 1 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-neutral-700">
            Select Option
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const isAvailable = variant.quantityAvailable && variant.quantityAvailable > 0;
              
              return (
                <button
                  key={variant.id}
                  onClick={() => onVariantSelect(variant.id)}
                  disabled={!isAvailable}
                  className={`relative rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-transparent ring-2"
                      : isAvailable
                        ? "border-neutral-300 hover:border-neutral-400"
                        : "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                  }`}
                  style={isSelected ? { 
                    backgroundColor: `${branding.colors.primary}10`,
                    "--tw-ring-color": branding.colors.primary,
                  } as React.CSSProperties : undefined}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        {/* Quantity Selector */}
        <div className="flex items-center rounded-lg border border-neutral-300">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-12 w-12 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-12 text-center text-base font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-12 w-12 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={onAddToCart}
          disabled={!selectedVariantId || !isSelectedInStock || isAddingToCart}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
          style={{ backgroundColor: branding.colors.primary }}
        >
          {isAddingToCart ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add to Cart
            </>
          )}
        </button>

        {/* Wishlist Button */}
        {features.wishlist && (
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isWishlisted) {
                await removeItem(productId);
              } else {
                // Parse price from string
                const priceMatch = price.match(/[\d.]+/);
                const priceValue = priceMatch ? parseFloat(priceMatch[0]) : 0;
                const currencyMatch = price.match(/[A-Z]{3}/);
                const currency = currencyMatch ? currencyMatch[0] : "USD";
                
                const originalPriceValue = originalPrice ? parseFloat(originalPrice.replace(/[^0-9.]/g, '')) : undefined;
                
                await addItem({
                  id: productId,
                  name,
                  slug: productSlug,
                  price: priceValue,
                  originalPrice: originalPriceValue,
                  currency,
                  image: productImage || "",
                  imageAlt: productImageAlt || name,
                  category: category || undefined,
                  inStock: isAvailable,
                });
              }
            }}
            className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
              isWishlisted 
                ? "border-red-200 bg-red-50 text-red-500" 
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg 
              className="h-5 w-5" 
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

      {/* Trust Badges */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-neutral-200 pt-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          <span className="text-xs font-medium text-neutral-600">Free Shipping</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-medium text-neutral-600">Secure Payment</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs font-medium text-neutral-600">Easy Returns</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-t border-neutral-200 pt-8">
        <div className="flex gap-8 border-b border-neutral-200">
          {(["description", "shipping", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-4 text-sm font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? "text-neutral-900" 
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span 
                  className="absolute bottom-0 left-0 h-0.5 w-full"
                  style={{ backgroundColor: branding.colors.primary }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "description" && (
            <div className="prose prose-sm max-w-none text-neutral-600">
              {description ? (
                <div dangerouslySetInnerHTML={{ __html: description }} />
              ) : (
                <p>No description available for this product.</p>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-4 text-sm text-neutral-600">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-neutral-900">Free Standard Shipping</p>
                  <p>On orders over $75. Delivery in 5-7 business days.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-neutral-900">Express Shipping</p>
                  <p>$12.99. Delivery in 2-3 business days.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-neutral-900">International Shipping</p>
                  <p>Available to select countries. Rates calculated at checkout.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              {showReviewForm ? (
                <div className="mb-6">
                  <ReviewForm
                    productId={productId}
                    onSuccess={() => {
                      setShowReviewForm(false);
                      // Trigger review list refresh
                      setReviewRefreshKey((prev) => prev + 1);
                    }}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              ) : (
                <div className="mb-6 text-center">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: branding.colors.primary }}
                  >
                    Write a Review
                  </button>
                </div>
              )}
              <ReviewList
                key={reviewRefreshKey}
                productId={productId}
                averageRating={rating || 0}
                reviewCount={reviewCount || 0}
                onReviewSubmit={() => {
                  setShowReviewForm(false);
                  // This will trigger useEffect in ReviewList to reload
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

