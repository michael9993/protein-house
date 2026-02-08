"use client";

import Image from "next/image";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useWishlist } from "@/lib/wishlist";
import { ReviewList, ReviewForm, RatingStars } from "@/ui/components/ProductReviews";
import { StockAlertButton } from "@/ui/components/StockAlert";
import { ShareButton } from "@/ui/components/ProductSharing";
import { useBranding, useFeature, useProductDetailText, useContentConfig } from "@/providers/StoreConfigProvider";
import { useOpenCart } from "@/ui/components/CartDrawer/CartDrawerShell";
import { ProductGallery } from "@/ui/components/ProductDetails";

interface ProductImage {
  url: string;
  alt: string | null;
}

interface ProductVariant {
  id: string;
  name: string;
  quantityAvailable: number;
  attributes?: Array<{
    attribute: {
      id: string;
      name: string;
      slug: string;
    };
    values: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  }> | null;
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
    rating?: number | null;
    reviewCount?: number | null;
  };
  selectedVariantId?: string;
  channel: string;
  addItemAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  /** When set (e.g. on PDP), appended to formData for revalidatePath. Omit in Quick View. */
  productSlug?: string;
  /** When "modal", breadcrumbs are hidden and padding is reduced (e.g. Quick View). */
  mode?: "page" | "modal";
}

export function ProductDetailClient({
  product,
  selectedVariantId,
  channel,
  addItemAction,
  productSlug,
  mode = "page",
}: ProductDetailClientProps) {
  const branding = useBranding();
  const openCart = useOpenCart();
  const wishlistEnabled = useFeature("wishlist");
  const reviewsEnabled = useFeature("productReviews");
  const productDetailText = useProductDetailText();
  const content = useContentConfig();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = isInWishlist(product.id);
  const [activeTab, setActiveTab] = useState<"description" | "shipping" | "reviews">("description");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 }); // Start at center for better zoom
  const [addedToCart, setAddedToCart] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Helper functions to extract attributes from variants
  const getAttributeFromVariant = (
    variant: ProductVariant,
    attributeName: string
  ): { id: string; name: string; slug: string } | null => {
    if (!variant?.attributes) return null;
    
    for (const attr of variant.attributes) {
      const attrName = attr.attribute?.name?.trim().toLowerCase();
      const attrSlug = attr.attribute?.slug?.trim().toLowerCase();
      const searchName = attributeName.toLowerCase();
      
      if (attrName === searchName || attrSlug === searchName) {
        const value = attr.values?.[0];
        if (value) {
          return {
            id: value.id,
            name: value.name,
            slug: value.slug || value.name.toLowerCase().replace(/\s+/g, "-"),
          };
        }
      }
    }
    
    return null;
  };
  
  const getColorFromVariant = (variant: ProductVariant): { id: string; name: string; slug: string } | null => {
    return getAttributeFromVariant(variant, "color") || getAttributeFromVariant(variant, "colour");
  };
  
  const getSizeFromVariant = (variant: ProductVariant): { id: string; name: string; slug: string } | null => {
    // Try multiple size attribute names
    return getAttributeFromVariant(variant, "size") ||
           getAttributeFromVariant(variant, "shoe size") ||
           getAttributeFromVariant(variant, "clothing size");
  };
  
  // Group variants by color and extract sizes per color
  type ColorInfo = {
    id: string;
    name: string;
    slug: string;
    hex?: string; // For color swatches, we'll try to map color names to hex
  };
  
  type SizeInfo = {
    id: string;
    name: string;
    slug: string;
    variantId: string;
    quantityAvailable: number;
  };
  
  const variantsByColor = new Map<string, {
    color: ColorInfo;
    sizes: Map<string, SizeInfo>;
    variants: ProductVariant[];
  }>();
  
  // Process all variants to group by color
  product.variants.forEach((variant) => {
    const color = getColorFromVariant(variant);
    const size = getSizeFromVariant(variant);
    
    if (color) {
      if (!variantsByColor.has(color.id)) {
        variantsByColor.set(color.id, {
          color: {
            id: color.id,
            name: color.name,
            slug: color.slug,
            hex: getColorHex(color.name),
          },
          sizes: new Map(),
          variants: [],
        });
      }
      
      const colorGroup = variantsByColor.get(color.id)!;
      colorGroup.variants.push(variant);
      
      if (size) {
        if (!colorGroup.sizes.has(size.id)) {
          colorGroup.sizes.set(size.id, {
            id: size.id,
            name: size.name,
            slug: size.slug,
            variantId: variant.id,
            quantityAvailable: variant.quantityAvailable,
          });
        } else {
          // Update if this variant has more stock
          const existingSize = colorGroup.sizes.get(size.id)!;
          if (variant.quantityAvailable > existingSize.quantityAvailable) {
            existingSize.variantId = variant.id;
            existingSize.quantityAvailable = variant.quantityAvailable;
          }
        }
      }
    }
  });
  
  // Debug: Log color groups and their sizes
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductDetail] Variants grouped by color:', Array.from(variantsByColor.entries()).map(([_colorId, group]) => ({
      color: group.color.name,
      sizesCount: group.sizes.size,
      sizes: Array.from(group.sizes.values()).map(s => s.name),
    })));
  }
  
  const availableColors = Array.from(variantsByColor.values());
  const hasColors = availableColors.length > 0;
  const hasSizes = product.variants.some(v => getSizeFromVariant(v) !== null);
  const hasMultipleVariants = product.variants.length > 1;
  
  // Check if we need to show selection (has colors or sizes)
  const needsSelection = hasColors || (hasSizes && !hasColors);
  
  // State for selected color and size
  const [selectedColorId, setSelectedColorId] = useState<string | null>(() => {
    // Initialize from selected variant if available
    if (selectedVariantId) {
      const variant = product.variants.find(v => v.id === selectedVariantId);
      const color = variant ? getColorFromVariant(variant) : null;
      return color?.id || null;
    }
    // Default to first color if available
    return availableColors.length > 0 ? availableColors[0].color.id : null;
  });
  
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(() => {
    // Initialize from selected variant if available
    if (selectedVariantId) {
      const variant = product.variants.find(v => v.id === selectedVariantId);
      const size = variant ? getSizeFromVariant(variant) : null;
      return size?.id || null;
    }
    return null;
  });
  
  // Get available sizes for selected color (only in-stock sizes)
  const selectedColorGroup = selectedColorId ? variantsByColor.get(selectedColorId) : null;
  const availableSizesForColor = selectedColorGroup 
    ? Array.from(selectedColorGroup.sizes.values())
        .filter(sizeInfo => {
          // Only include sizes that have in-stock variants
          const variant = product.variants.find(v => v.id === sizeInfo.variantId);
          return variant && variant.quantityAvailable > 0;
        })
        .sort((a, b) => {
          // Sort sizes logically: XS, S, M, L, XL, XXL, then numbers
          const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"];
          const aLower = a.slug.toLowerCase();
          const bLower = b.slug.toLowerCase();
          const aIndex = sizeOrder.indexOf(aLower);
          const bIndex = sizeOrder.indexOf(bLower);
          
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          
          // For numeric sizes, sort numerically
          const aNum = parseFloat(aLower);
          const bNum = parseFloat(bLower);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          
          // Otherwise, alphabetical
          return aLower.localeCompare(bLower);
        })
    : [];
  
  // Find variant based on selected color and size
  const findVariantByColorAndSize = (colorId: string | null, sizeId: string | null): ProductVariant | null => {
    if (!colorId) return null;
    
    const colorGroup = variantsByColor.get(colorId);
    if (!colorGroup) return null;
    
    if (sizeId) {
      const sizeInfo = colorGroup.sizes.get(sizeId);
      if (sizeInfo) {
        const variant = product.variants.find(v => v.id === sizeInfo.variantId);
        // Only return variant if it's in stock
        return variant && variant.quantityAvailable > 0 ? variant : null;
      }
    }
    
    // If no size selected, return first available (in-stock) variant for this color
    return colorGroup.variants.find(v => v.quantityAvailable > 0) || null;
  };
  
  // Update effective variant based on selected color and size
  // Only use selectedVariantId if the variant is in stock
  let effectiveVariant: ProductVariant | null = null;
  if (selectedVariantId) {
    const variant = product.variants.find(v => v.id === selectedVariantId);
    // Only use if variant exists and is in stock
    if (variant && variant.quantityAvailable > 0) {
      effectiveVariant = variant;
    }
  }
  
  // If no valid variant from selectedVariantId, try to find one from color/size
  if (!effectiveVariant) {
    effectiveVariant = findVariantByColorAndSize(selectedColorId, selectedSizeId);
  }
  
  const effectiveVariantId = effectiveVariant?.id;
  
  // Helper function to convert color name to hex (basic mapping)
  function getColorHex(colorName: string): string {
    const colorMap: Record<string, string> = {
      "red": "#ef4444",
      "blue": "#3b82f6",
      "green": "#10b981",
      "yellow": "#fbbf24",
      "orange": "#f97316",
      "purple": "#a855f7",
      "pink": "#ec4899",
      "black": "#000000",
      "white": "#ffffff",
      "gray": "#6b7280",
      "grey": "#6b7280",
      "brown": "#92400e",
      "navy": "#1e3a8a",
      "beige": "#f5f5dc",
      "tan": "#d2b48c",
      "olive": "#808000",
      "maroon": "#800000",
      "teal": "#14b8a6",
      "cyan": "#06b6d4",
      "lime": "#84cc16",
      "indigo": "#6366f1",
      "violet": "#8b5cf6",
      "coral": "#ff7f50",
      "salmon": "#fa8072",
      "gold": "#ffd700",
      "silver": "#c0c0c0",
    };
    
    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || "#6b7280"; // Default gray if not found
  }
  
  // Handle color selection
  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedSizeId(null); // Reset size when color changes
    
    // Auto-select first available (in-stock) size for the new color
    const colorGroup = variantsByColor.get(colorId);
    if (colorGroup && colorGroup.sizes.size > 0) {
      // Find first in-stock size
      const firstAvailableSize = Array.from(colorGroup.sizes.values())
        .find(sizeInfo => {
          const variant = product.variants.find(v => v.id === sizeInfo.variantId);
          return variant && variant.quantityAvailable > 0;
        });
      
      if (firstAvailableSize) {
        setSelectedSizeId(firstAvailableSize.id);
        
        // Update URL with new variant
        const variant = findVariantByColorAndSize(colorId, firstAvailableSize.id);
        if (variant) {
          const params = new URLSearchParams();
          params.set("variant", variant.id);
          router.push(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
        }
      }
    } else {
      // No sizes, just select first in-stock variant for this color
      const variant = findVariantByColorAndSize(colorId, null);
      if (variant) {
        const params = new URLSearchParams();
        params.set("variant", variant.id);
        router.push(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
      }
    }
  };
  
  // Handle size selection
  const handleSizeSelect = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    
    // Find variant for selected color + size
    const variant = findVariantByColorAndSize(selectedColorId, sizeId);
    if (variant) {
      const params = new URLSearchParams();
      params.set("variant", variant.id);
      router.push(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
    }
  };
  
  // Sync selected color/size with URL variant on mount or when variant changes
  // Only sync if variant is in stock
  useEffect(() => {
    if (selectedVariantId) {
      const variant = product.variants.find(v => v.id === selectedVariantId);
      if (variant && variant.quantityAvailable > 0) {
        const color = getColorFromVariant(variant);
        const size = getSizeFromVariant(variant);
        
        if (color) setSelectedColorId(color.id);
        if (size) setSelectedSizeId(size.id);
      } else if (variant && variant.quantityAvailable === 0) {
        // Variant is out of stock, clear the selection and find an in-stock alternative
        const color = getColorFromVariant(variant);
        if (color) {
          // Try to find an in-stock variant for the same color
          const colorGroup = variantsByColor.get(color.id);
          if (colorGroup) {
            const inStockVariant = colorGroup.variants.find(v => v.quantityAvailable > 0);
            if (inStockVariant) {
              const inStockColor = getColorFromVariant(inStockVariant);
              const inStockSize = getSizeFromVariant(inStockVariant);
              if (inStockColor) setSelectedColorId(inStockColor.id);
              if (inStockSize) setSelectedSizeId(inStockSize.id);
              
              // Update URL with in-stock variant
              const params = new URLSearchParams();
              params.set("variant", inStockVariant.id);
              router.replace(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
            }
          }
        }
      }
    }
  }, [selectedVariantId, product.variants, channel, product.slug, router]);
  
  const selectedVariant = effectiveVariant;
  
  // Calculate stock info
  // IMPORTANT: Only show stock for the selected variant, not aggregated stock
  // This prevents showing "2 left" when the selected variant actually has 0 stock
  const selectedStock = effectiveVariant?.quantityAvailable || 0;
  const displayStock = selectedStock; // Always use selected variant stock, never aggregate
  const isInStock = selectedStock > 0; // Only in stock if selected variant has stock
  const isLowStock = displayStock > 0 && displayStock <= 5;
  // maxQuantity should be the actual available quantity, not a default
  const maxQuantity = selectedStock; // Use selected variant stock only

  // Debug logging
  useEffect(() => {
    console.log("[ProductDetail] Stock Debug Info:", {
      productName: product.name,
      selectedVariantId,
      selectedColorId,
      selectedSizeId,
      effectiveVariantId,
      effectiveVariant: effectiveVariant ? {
        id: effectiveVariant.id,
        name: effectiveVariant.name,
        quantityAvailable: effectiveVariant.quantityAvailable,
      } : null,
      selectedStock,
      displayStock,
      isInStock,
      maxQuantity: maxQuantity,
      quantity,
      allVariants: product.variants.map(v => ({
        id: v.id,
        name: v.name,
        quantityAvailable: v.quantityAvailable,
      })),
    });
  }, [selectedVariantId, selectedColorId, selectedSizeId, effectiveVariantId, effectiveVariant, selectedStock, displayStock, isInStock, maxQuantity, quantity, product.name, product.variants]);
  
  // Calculate discount
  const hasDiscount = product.originalPrice !== null;
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round((1 - (parseFloat(product.price.replace(/[^0-9.]/g, '')) / 
        parseFloat(product.originalPrice.replace(/[^0-9.]/g, '')))) * 100)
    : 0;

  // Auto-select single variant on mount (only if in stock)
  useEffect(() => {
    const singleVariant = product.variants.length === 1 ? product.variants[0] : null;
    if (singleVariant && singleVariant.quantityAvailable > 0 && !selectedVariantId) {
      const params = new URLSearchParams(window.location.search);
      params.set("variant", singleVariant.id);
      router.replace(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
    }
  }, [selectedVariantId, channel, product.slug, product.variants, router]);

  // Update quantity when maxQuantity changes to ensure it doesn't exceed available stock
  useEffect(() => {
    if (maxQuantity > 0 && quantity > maxQuantity) {
      setQuantity(maxQuantity);
    } else if (maxQuantity === 0 && quantity > 0) {
      setQuantity(1); // Reset to 1 if variant becomes out of stock
    }
  }, [maxQuantity, quantity]);

  const handleVariantChange = (variantId: string) => {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      const color = getColorFromVariant(variant);
      const size = getSizeFromVariant(variant);
      
      if (color) setSelectedColorId(color.id);
      if (size) setSelectedSizeId(size.id);
    }
    
    const params = new URLSearchParams();
    params.set("variant", variantId);
    router.push(`/${channel}/products/${product.slug}?${params.toString()}`, { scroll: false });
  };

  const handleAddToCart = async () => {
    console.log("[Add to Cart] Button clicked:", {
      effectiveVariantId,
      isInStock,
      quantity,
      maxQuantity,
      effectiveVariant: effectiveVariant ? {
        id: effectiveVariant.id,
        name: effectiveVariant.name,
        quantityAvailable: effectiveVariant.quantityAvailable,
      } : null,
    });

    if (!effectiveVariantId) {
      console.error("[Add to Cart] ❌ No effectiveVariantId");
      toast.error("Please select a variant");
      return;
    }

    if (!isInStock) {
      console.error("[Add to Cart] ❌ Not in stock:", {
        effectiveVariantId,
        selectedStock,
        effectiveVariant: effectiveVariant ? {
          id: effectiveVariant.id,
          name: effectiveVariant.name,
          quantityAvailable: effectiveVariant.quantityAvailable,
        } : null,
      });
      toast.error("This item is out of stock");
      return;
    }

    if (quantity > maxQuantity) {
      console.error("[Add to Cart] ❌ Quantity exceeds max:", {
        quantity,
        maxQuantity,
      });
      toast.error(`Only ${maxQuantity} items available`);
      return;
    }

    const formData = new FormData();
    formData.append("variantId", effectiveVariantId);
    formData.append("quantity", quantity.toString());
    formData.append("channel", channel);
    if (productSlug) {
      formData.append("productSlug", productSlug);
    }

    // Optimistic UI: show "Added" and bump cart badge immediately
    setAddedToCart(true);
    window.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { addQuantity: quantity } })
    );

    startTransition(async () => {
      const result = await addItemAction(formData);
      if (result.success) {
        setTimeout(() => setAddedToCart(false), 3000);
        toast.success("Item added to cart!");
        // Reconcile cart badge with server (in case of race)
        window.dispatchEvent(new CustomEvent("cart-updated"));
        router.refresh();
      } else {
        setAddedToCart(false);
        // Revert optimistic cart badge
        window.dispatchEvent(new CustomEvent("cart-updated"));
        if (result.error) {
          toast.error(result.error);
          if (result.error.includes("stock") || result.error.includes("available")) {
            setTimeout(() => router.refresh(), 2000);
          }
        } else {
          toast.error("Failed to add item to cart. Please try again.");
        }
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    // Update zoom position based on mouse position for panning when zoomed
    setZoomPosition({ x, y });
  };


  // Ensure we have at least one image
  const displayImages = product.images.length > 0 
    ? product.images 
    : [{ url: "/placeholder-product.jpg", alt: product.name }];

  const isModal = mode === "modal";

  return (
    <div className={`bg-white ${isModal ? "min-h-0" : "min-h-screen animate-fade-in"}`}>
      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${isModal ? "py-4" : "py-6"}`}>
        {!isModal && (
          <div className="animate-fade-in">
            <Breadcrumbs
              items={[
                { label: "Products", href: "/products" },
                ...(product.category && product.categorySlug
                  ? [{ label: product.category, href: `/products?categories=${product.categorySlug}` }]
                  : []),
                { label: product.name },
              ]}
            />
          </div>
        )}

        <div className={isModal ? "lg:grid lg:grid-cols-2 lg:gap-x-8" : "mt-6 lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12"}>
          {/* Image Gallery — NO sticky in modal mode (causes white/truncated scroll areas) */}
          <div
            className={isModal ? "" : "lg:sticky lg:top-24 lg:self-start animate-fade-in-up"}
            style={isModal ? undefined : {
              animationDelay: "100ms",
              animationFillMode: "both",
            }}
          >
             <ProductGallery
                images={displayImages}
                productName={product.name}
                discountPercent={discountPercent}
                allowLightbox={!isModal}
              />
          </div>

          {/* Product Info */}
          <div
            className={isModal ? "mt-6 lg:mt-0" : "mt-8 lg:mt-0 animate-fade-in-up"}
            style={isModal ? undefined : {
              animationDelay: "200ms",
              animationFillMode: "both",
            }}
          >
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
            {reviewsEnabled && product.rating !== null && product.rating !== undefined && (
              <div className="mt-3">
                <RatingStars rating={product.rating} size="md" showValue />
                {product.reviewCount !== null && product.reviewCount !== undefined && (
                  <span className="ml-2 text-sm text-neutral-600">({product.reviewCount} {product.reviewCount === 1 ? productDetailText.reviewSingular : productDetailText.reviewPlural})</span>
                )}
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
                  {productDetailText.savePercent.replace("{percent}", discountPercent.toString())}
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
                      ? productDetailText.onlyXLeft.replace("{count}", displayStock.toString())
                      : productDetailText.inStockWithCount.replace("{count}", displayStock.toString())
                    : content.product.outOfStockText
                  }
                </span>
              </div>
              {isLowStock && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {productDetailText.sellingFast}
                </span>
              )}
            </div>

            {/* Stock Alert Button - Show when out of stock */}
            {!isInStock && effectiveVariantId && (
              <div className="mt-4">
                <StockAlertButton
                  variantId={effectiveVariantId}
                  variantName={effectiveVariant?.name}
                  isOutOfStock={!isInStock}
                />
              </div>
            )}

            {/* Color Selection - Show as swatches */}
            {hasColors && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                  {productDetailText.colorLabel}
                  {!selectedColorId && <span className="ml-1 text-red-500">*</span>}
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((colorGroup) => {
                    const isSelected = selectedColorId === colorGroup.color.id;
                    const hasAvailableVariants = colorGroup.variants.some(v => v.quantityAvailable > 0);

                    return (
                      <button
                        key={colorGroup.color.id}
                        onClick={() => handleColorSelect(colorGroup.color.id)}
                        disabled={!hasAvailableVariants}
                        className={`group relative flex flex-col items-center gap-2 transition-all ${
                          !hasAvailableVariants ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        aria-label={`Select color ${colorGroup.color.name}`}
                      >
                        {/* Color Swatch Cube */}
                        <div
                          className={`relative h-12 w-12 rounded-lg border-2 transition-all shadow-sm ${
                            isSelected
                              ? "border-neutral-900 scale-110 shadow-md"
                              : "border-neutral-300 hover:border-neutral-400 hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: colorGroup.color.hex || "#6b7280",
                          }}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-white drop-shadow-lg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          {!hasAvailableVariants && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-px w-full bg-neutral-400 rotate-45" />
                            </div>
                          )}
                        </div>
                        {/* Color Name */}
                        <span className={`text-xs font-medium text-center max-w-[60px] ${
                          isSelected ? "text-neutral-900 font-semibold" : "text-neutral-600"
                        }`}>
                          {colorGroup.color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection - Filtered by selected color */}
            {hasSizes && selectedColorId && selectedColorGroup && selectedColorGroup.sizes.size > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                  {productDetailText.sizeLabel}
                  {!selectedSizeId && <span className="ml-1 text-red-500">*</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizesForColor.map((sizeInfo) => {
                    const isSelected = selectedSizeId === sizeInfo.id;
                    const isAvailable = sizeInfo.quantityAvailable > 0;

                    return (
                      <button
                        key={sizeInfo.id}
                        onClick={() => handleSizeSelect(sizeInfo.id)}
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
                        {sizeInfo.name}
                        {isAvailable && sizeInfo.quantityAvailable <= 3 && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                            {sizeInfo.quantityAvailable}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!selectedSizeId && (
                  <p className="mt-2 text-sm text-red-500">{productDetailText.pleaseSelectSize}</p>
                )}
              </div>
            )}

            {/* Fallback: Show all variants if no colors/sizes detected */}
            {!hasColors && hasMultipleVariants && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                  {productDetailText.selectOptionLabel}
                  {!selectedVariant && <span className="ml-1 text-red-500">*</span>}
                </label>
                <div className="flex flex-wrap gap-2">
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
                {!selectedVariant && (
                  <p className="mt-2 text-sm text-red-500">{productDetailText.pleaseSelectOption}</p>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Quantity Selector */}
                <div className="flex items-center">
                  <label className="mr-3 text-sm font-medium text-neutral-700">{productDetailText.qtyLabelWithColon}</label>
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
                      max={maxQuantity || 1}
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        // Clamp to available quantity
                        setQuantity(Math.min(maxQuantity || 1, Math.max(1, newQuantity)));
                      }}
                      className="w-16 border-x border-neutral-300 py-3 text-center text-base font-semibold focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity || 1, quantity + 1))}
                      disabled={quantity >= (maxQuantity || 1) || maxQuantity === 0}
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
                  disabled={!effectiveVariantId || !isInStock || isPending || (needsSelection && !selectedVariant) || maxQuantity === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
                  style={{ backgroundColor: addedToCart ? "#059669" : branding.colors.primary }}
                  onMouseEnter={() => {
                    const isDisabled = !effectiveVariantId || !isInStock || isPending || (needsSelection && !selectedVariant) || maxQuantity === 0;
                    if (isDisabled) {
                      console.log("[Add to Cart] Button disabled - Debug info:", {
                        effectiveVariantId,
                        isInStock,
                        maxQuantity,
                        quantity,
                        needsSelection,
                        selectedVariant: selectedVariant ? { 
                          id: selectedVariant.id, 
                          name: selectedVariant.name,
                          quantityAvailable: selectedVariant.quantityAvailable,
                        } : null,
                        effectiveVariant: effectiveVariant ? {
                          id: effectiveVariant.id,
                          name: effectiveVariant.name,
                          quantityAvailable: effectiveVariant.quantityAvailable,
                        } : null,
                        isPending,
                        disabledReasons: {
                          noEffectiveVariantId: !effectiveVariantId,
                          notInStock: !isInStock,
                          isPending,
                          needsSelectionButNoVariant: needsSelection && !selectedVariant,
                          maxQuantityZero: maxQuantity === 0,
                        },
                      });
                    }
                  }}
                >
                  {isPending ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {content.product.addingButton}
                    </>
                  ) : addedToCart ? (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {content.product.addedToCartButton}
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {!isInStock ? content.product.outOfStockText : needsSelection && !selectedVariant ? content.product.selectOptionsButton : content.product.addToCartButton}
                    </>
                  )}
                </button>

                {/* Wishlist + Share — always side by side */}
                <div className="flex gap-2">
                  {wishlistEnabled && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isWishlisted) {
                          await removeItem(product.id);
                        } else {
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
                  <ShareButton
                    variant="icon"
                    productName={product.name}
                    productUrl={typeof window !== "undefined" ? window.location.href : ""}
                    productImage={product.images[0]?.url || null}
                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
                    iconClassName="h-5 w-5"
                  />
                </div>
              </div>

              {/* View Cart – opens drawer or navigates to cart page per display mode */}
              {addedToCart && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={openCart}
                    className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: branding.colors.primary }}
                  >
                    {content.product.viewCartLink}
                  </button>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div
              className={`mt-8 grid grid-cols-3 gap-4 border-t border-neutral-200 pt-8 ${isModal ? "" : "animate-fade-in-up"}`}
              style={isModal ? undefined : {
                animationDelay: "250ms",
                animationFillMode: "both",
              }}
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <span className="text-xs font-medium text-neutral-600">{productDetailText.freeShipping}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-medium text-neutral-600">{productDetailText.securePayment}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium text-neutral-600">{productDetailText.easyReturns}</span>
              </div>
            </div>

            {/* Tabs */}
            <div
              className={`mt-8 border-t border-neutral-200 pt-8 ${isModal ? "" : "animate-fade-in-up"}`}
              style={isModal ? undefined : {
                animationDelay: "300ms",
                animationFillMode: "both",
              }}
            >
              <div className="flex gap-8 border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`relative pb-4 text-sm font-medium transition-colors ${
                    activeTab === "description" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {productDetailText.descriptionTab}
                  {activeTab === "description" && (
                    <span
                      className="absolute bottom-0 left-0 h-0.5 w-full"
                      style={{ backgroundColor: branding.colors.primary }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("shipping")}
                  className={`relative pb-4 text-sm font-medium transition-colors ${
                    activeTab === "shipping" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {productDetailText.shippingTab}
                  {activeTab === "shipping" && (
                    <span
                      className="absolute bottom-0 left-0 h-0.5 w-full"
                      style={{ backgroundColor: branding.colors.primary }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`relative pb-4 text-sm font-medium transition-colors ${
                    activeTab === "reviews" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {productDetailText.reviewsTab}
                  {activeTab === "reviews" && (
                    <span
                      className="absolute bottom-0 left-0 h-0.5 w-full"
                      style={{ backgroundColor: branding.colors.primary }}
                    />
                  )}
                </button>
              </div>

              <div className="mt-6">
                {activeTab === "description" && (
                  <div className="prose prose-sm max-w-none text-neutral-600">
                    {product.description ? (
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <p>{productDetailText.noDescriptionAvailable}</p>
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
                        <p className="font-medium text-neutral-900">{productDetailText.freeStandardShippingTitle}</p>
                        <p>{productDetailText.freeStandardShippingDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium text-neutral-900">{productDetailText.expressShippingTitle}</p>
                        <p>{productDetailText.expressShippingDescription.replace("{price}", "$12.99")}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    {showReviewForm ? (
                      <div className="mb-6">
                        <ReviewForm
                          productId={product.id}
                          onSuccess={() => {
                            setShowReviewForm(false);
                          }}
                          onCancel={() => setShowReviewForm(false)}
                        />
                      </div>
                    ) : (
                      <div className="mb-6 text-right">
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="rounded-md px-4 py-2 text-sm font-medium text-white"
                          style={{ backgroundColor: branding.colors.primary }}
                        >
                          {content.product.writeReviewButton}
                        </button>
                      </div>
                    )}
                    <ReviewList
                      productId={product.id}
                      averageRating={product.rating || 0}
                      reviewCount={product.reviewCount || 0}
                      onReviewSubmit={() => setShowReviewForm(false)}
                    />
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
