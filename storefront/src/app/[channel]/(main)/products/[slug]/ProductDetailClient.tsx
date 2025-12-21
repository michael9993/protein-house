"use client";

import Image from "next/image";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { storeConfig } from "@/config";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useWishlist } from "@/lib/wishlist";

interface ProductImage {
  url: string;
  alt: string | null;
}

interface ProductVariant {
  id: string;
  name: string;
  quantityAvailable: number;
  pricing?: {
    price?: {
      gross: {
        amount: number;
        currency: string;
      };
    } | null;
  } | null;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    categorySlug: string | null;
    price: string;
    originalPrice: string | null;
    isAvailable: boolean;
    images: ProductImage[];
    variants: ProductVariant[];
  };
  selectedVariantId?: string;
  channel: string;
  addItemAction: (formData: FormData) => Promise<void>;
}

export function ProductDetailClient({
  product,
  selectedVariantId,
  channel,
  addItemAction,
}: ProductDetailClientProps) {
  const { branding, features } = storeConfig;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = isInWishlist(product.id);
  const [activeTab, setActiveTab] = useState<"description" | "shipping" | "reviews">("description");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Check if product has variants that need selection (like size, color)
  const hasMultipleVariants = product.variants.length > 1;
  const singleVariant = product.variants.length === 1 ? product.variants[0] : null;
  
  // Auto-select variant if only one exists
  const effectiveVariantId = selectedVariantId || singleVariant?.id;
  const selectedVariant = product.variants.find(v => v.id === effectiveVariantId);
  
  // Calculate stock info
  const totalStock = product.variants.reduce((sum, v) => sum + v.quantityAvailable, 0);
  const selectedStock = selectedVariant?.quantityAvailable || 0;
  const displayStock = selectedVariant ? selectedStock : totalStock;
  const isInStock = selectedVariant ? selectedStock > 0 : totalStock > 0;
  const isLowStock = displayStock > 0 && displayStock <= 5;
  const maxQuantity = selectedVariant?.quantityAvailable || 10;
  
  // Calculate discount
  const hasDiscount = product.originalPrice !== null;
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round((1 - (parseFloat(product.price.replace(/[^0-9.]/g, '')) / 
        parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')))) * 100)
    : 0;

  // Auto-select single variant on mount
  useEffect(() => {
    if (singleVariant && !selectedVariantId) {
      const params = new URLSearchParams(window.location.search);
      params.set("variant", singleVariant.id);
      router.replace(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
    }
  }, [singleVariant, selectedVariantId, channel, product.slug, router]);

  const handleVariantChange = (variantId: string) => {
    const params = new URLSearchParams();
    params.set("variant", variantId);
    router.push(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
  };

  const handleAddToCart = async () => {
    if (!effectiveVariantId || !isInStock) return;

    const formData = new FormData();
    formData.append("variantId", effectiveVariantId);
    formData.append("quantity", quantity.toString());

    startTransition(async () => {
      await addItemAction(formData);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // Ensure we have at least one image
  const displayImages = product.images.length > 0 
    ? product.images 
    : [{ url: "/placeholder-product.jpg", alt: product.name }];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Products", href: "/products" },
            ...(product.category && product.categorySlug 
              ? [{ label: product.category, href: `/products?categories=${product.categorySlug}` }] 
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Main Image with Discount Ribbon */}
            <div className="relative">
              {/* Discount Ribbon */}
              {hasDiscount && discountPercent > 0 && (
                <div className="absolute -left-2 top-4 z-20 sm:-left-3 sm:top-6">
                  <div 
                    className="relative flex items-center px-3 py-1.5 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    <span>{discountPercent}% OFF</span>
                    {/* Ribbon tail */}
                    <div 
                      className="absolute -right-2 top-0 h-full w-2"
                      style={{
                        background: "linear-gradient(135deg, #ef4444 50%, transparent 50%)",
                      }}
                    />
                    <div 
                      className="absolute -left-1 -bottom-1 h-2 w-2"
                      style={{
                        background: "#b91c1c",
                        clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                {displayImages[selectedImageIndex]?.url ? (
                  <Image
                    src={displayImages[selectedImageIndex].url}
                    alt={displayImages[selectedImageIndex].alt || product.name}
                    fill
                    priority
                    className={`object-cover transition-transform duration-300 ${
                      isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                    }`}
                    style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg className="h-24 w-24 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Navigation Arrows - Only show if multiple images */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
                      aria-label="Previous image"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
                      aria-label="Next image"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {displayImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                    {selectedImageIndex + 1} / {displayImages.length}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails - Only show if multiple images */}
            {displayImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:gap-3">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all sm:h-20 sm:w-20 ${
                      selectedImageIndex === index
                        ? "ring-2 ring-offset-2"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={selectedImageIndex === index ? { "--tw-ring-color": branding.colors.primary } as React.CSSProperties : undefined}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="mt-8 lg:mt-0">
            {/* Category */}
            {product.category && (
              <span
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: branding.colors.primary }}
              >
                {product.category}
              </span>
            )}

            {/* Name */}
            <h1 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            {features.reviews && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${star <= 4 ? "text-amber-400" : "text-neutral-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-neutral-600">4.0 (24 reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: hasDiscount ? "#ef4444" : branding.colors.text }}
              >
                {product.price}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-neutral-400 line-through">{product.originalPrice}</span>
              )}
              {hasDiscount && discountPercent > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isInStock ? (isLowStock ? "bg-amber-500" : "bg-emerald-500") : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${isInStock ? (isLowStock ? "text-amber-600" : "text-emerald-600") : "text-red-600"}`}>
                  {isInStock 
                    ? isLowStock 
                      ? `Only ${displayStock} left!` 
                      : `In Stock (${displayStock} available)`
                    : "Out of Stock"
                  }
                </span>
              </div>
              {isLowStock && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selling fast!
                </span>
              )}
            </div>

            {/* Variants - Only show if multiple variants exist */}
            {hasMultipleVariants && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-neutral-900">
                  Select Option
                  {!selectedVariant && <span className="ml-1 text-red-500">*</span>}
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = variant.id === effectiveVariantId;
                    const isAvailable = variant.quantityAvailable > 0;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantChange(variant.id)}
                        disabled={!isAvailable}
                        className={`relative rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-transparent"
                            : isAvailable
                              ? "border-neutral-200 hover:border-neutral-300"
                              : "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-400 line-through"
                        }`}
                        style={isSelected ? {
                          backgroundColor: `${branding.colors.primary}15`,
                          borderColor: branding.colors.primary,
                          color: branding.colors.primary,
                        } : undefined}
                      >
                        {variant.name}
                        {isAvailable && variant.quantityAvailable <= 3 && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                            {variant.quantityAvailable}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!selectedVariant && hasMultipleVariants && (
                  <p className="mt-2 text-sm text-red-500">Please select an option</p>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Quantity Selector */}
                <div className="flex items-center">
                  <label className="mr-3 text-sm font-medium text-neutral-700">Qty:</label>
                  <div className="flex items-center rounded-lg border border-neutral-300">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="flex h-12 w-12 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 border-x border-neutral-300 py-3 text-center text-base font-semibold focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className="flex h-12 w-12 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!effectiveVariantId || !isInStock || isPending || (hasMultipleVariants && !selectedVariant)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
                  style={{ backgroundColor: addedToCart ? "#059669" : branding.colors.primary }}
                >
                  {isPending ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Adding...
                    </>
                  ) : addedToCart ? (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {!isInStock ? "Out of Stock" : hasMultipleVariants && !selectedVariant ? "Select Option" : "Add to Cart"}
                    </>
                  )}
                </button>

                {/* Wishlist */}
                {features.wishlist && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isWishlisted) {
                        await removeItem(product.id);
                      } else {
                        // Get price from selected variant or first variant
                        const selectedVariant = product.variants.find(v => v.id === effectiveVariantId);
                        const price = selectedVariant?.pricing?.price?.gross?.amount || 
                                     product.variants[0]?.pricing?.price?.gross?.amount || 0;
                        const currency = selectedVariant?.pricing?.price?.gross?.currency || 
                                       product.variants[0]?.pricing?.price?.gross?.currency || "USD";
                        
                        await addItem({
                          id: product.id,
                          name: product.name,
                          slug: product.slug,
                          price,
                          originalPrice: product.originalPrice ? parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')) : undefined,
                          currency,
                          image: product.images[0]?.url || "",
                          imageAlt: product.images[0]?.alt || product.name,
                          category: product.category || undefined,
                          inStock: isInStock,
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

              {/* View Cart Link */}
              {addedToCart && (
                <div className="mt-4">
                  <LinkWithChannel
                    href="/cart"
                    className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: branding.colors.primary }}
                  >
                    View Cart →
                  </LinkWithChannel>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-neutral-200 pt-8">
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
                      activeTab === tab ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
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
                    {product.description ? (
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
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
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="py-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-3 text-sm text-neutral-600">No reviews yet. Be the first!</p>
                    <button
                      className="mt-4 text-sm font-medium"
                      style={{ color: branding.colors.primary }}
                    >
                      Write a Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
