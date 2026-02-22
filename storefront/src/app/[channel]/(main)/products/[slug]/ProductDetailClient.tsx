"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { useWishlist } from "@/lib/wishlist";
import { RatingStars } from "@/ui/components/ProductReviews";
import { StockAlertButton } from "@/ui/components/StockAlert";
import { ShareButton } from "@/ui/components/ProductSharing";
import {
  useBranding,
  useFeature,
  useProductDetailText,
  useContentConfig,
  useEcommerceSettings,
} from "@/providers/StoreConfigProvider";
import { getProductShippingEstimate, formatEstimate } from "@/lib/shipping";
import {
  subscribeToStockAlert,
  unsubscribeFromStockAlert,
} from "../actions";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useOpenCart } from "@/ui/components/CartDrawer/CartDrawerShell";
import {
  ProductGallery,
  useVariantSelection,
  VariantSelector,
  StockStatus,
  QuantitySelector,
  AddToCartButton,
  TrustBadges,
  ProductTabs,
} from "@/ui/components/ProductDetails";
import type { EnrichedVariant, ProductAttribute } from "@/ui/components/ProductDetails";
import { SizeGuideModal } from "@/ui/components/SizeGuideModal";
import { trackViewItem, trackAddToCart } from "@/lib/analytics";

const EMPTY_VARIANT_SELECTION_SLUGS: string[] = [];

interface ProductImage {
  url: string;
  alt: string | null;
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
    variants: EnrichedVariant[];
    productAttributes?: ProductAttribute[];
    variantSelectionSlugs?: string[];
    rating?: number | null;
    reviewCount?: number | null;
    created?: string;
    priceAmount?: number;
    priceCurrency?: string;
    originalPriceAmount?: number;
    metadata?: Array<{ key: string; value: string }>;
  };
  selectedVariantId?: string;
  channel: string;
  addItemAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  productSlug?: string;
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
  const stockAlertsEnabled = useFeature("stockAlerts");
  const productDetailText = useProductDetailText();
  const content = useContentConfig();

  const [isPending, startTransition] = useTransition();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { trackProduct } = useRecentlyViewed();

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  // Generic variant selection hook
  const {
    selectionAttributes,
    selections,
    selectValue,
    selectedVariant,
    isSelectionComplete,
    needsSelection,
  } = useVariantSelection({
    variants: product.variants,
    variantSelectionSlugs: product.variantSelectionSlugs || EMPTY_VARIANT_SELECTION_SLUGS,
    initialVariantId: selectedVariantId,
  });

  // Detect size attribute type for size guide modal default category
  // Uses selectionAttributes (computed from variant data) to detect shoe vs clothing sizes
  const sizeGuideCategory = (() => {
    const slugs = selectionAttributes.map((a) => a.attributeSlug);
    if (slugs.some((s) => s === "shoe-size" || s === "shoe_size")) return "shoes" as const;
    if (slugs.some((s) => ["apparel-size", "apparel_size", "clothing-size", "clothing_size", "size"].includes(s))) return "clothing" as const;
    return "shoes" as const;
  })();

  // Track product view
  useEffect(() => {
    // Compute brand from product attributes (used by both recently-viewed and GA4)
    const brandSlugs = ["brand", "vendor", "manufacturer", "label"];
    const brandAttr = product.productAttributes?.find(
      (a) => a.attribute.slug && brandSlugs.includes(a.attribute.slug),
    );
    const brand = brandAttr?.values?.[0]?.name || undefined;

    if (mode === "page") {
      // Compute total stock across all variants
      const totalStock = product.variants.reduce(
        (sum, v) => sum + (v.quantityAvailable || 0),
        0,
      );

      trackProduct({
        id: product.id,
        slug: product.slug,
        name: product.name,
        thumbnail: product.images[0]?.url || null,
        thumbnailAlt: product.images[0]?.alt || null,
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        categorySlug: product.categorySlug,
        isAvailable: product.isAvailable,
        priceAmount: product.priceAmount,
        priceCurrency: product.priceCurrency,
        originalPriceAmount: product.originalPriceAmount,
        brand,
        totalStock,
        rating: product.rating,
        created: product.created,
      });
    }

    // GA4 view_item event — fires in both page and modal modes
    if (product.priceAmount != null && product.priceCurrency) {
      trackViewItem({
        item_id: product.id,
        item_name: product.name,
        item_brand: brand,
        item_category: product.category ?? undefined,
        price: product.priceAmount,
        currency: product.priceCurrency,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, mode]);

  // Sync URL when variant selection resolves (no navigation — just update the address bar for shareability)
  // Skip in modal mode to avoid corrupting the URL on listing/homepage pages
  useEffect(() => {
    if (mode === "modal") return;
    if (selectedVariant && selectedVariant.id !== selectedVariantId) {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", selectedVariant.id);
      window.history.replaceState(null, "", url.toString());
    }
  }, [selectedVariant, selectedVariantId, mode]);

  // Auto-select single variant
  useEffect(() => {
    if (mode === "modal") return;
    if (
      product.variants.length === 1 &&
      product.variants[0].quantityAvailable > 0 &&
      !selectedVariantId
    ) {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", product.variants[0].id);
      window.history.replaceState(null, "", url.toString());
    }
  }, [selectedVariantId, product.variants, mode]);

  // Clamp quantity to available stock
  useEffect(() => {
    const max = getMaxQuantity();
    if (max > 0 && quantity > max) setQuantity(max);
    else if (max === 0 && quantity > 0) setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant]);

  const getMaxQuantity = useCallback(() => {
    if (!selectedVariant) return 0;
    if (!selectedVariant.trackInventory) return 99;
    const stock = selectedVariant.quantityAvailable;
    const limit = selectedVariant.quantityLimitPerCustomer;
    return limit ? Math.min(stock, limit) : stock;
  }, [selectedVariant]);

  // Price & discount — use variant price when available, fall back to product-level
  const { displayPrice, displayOriginalPrice, hasDiscount, discountPercent } = useMemo(() => {
    const variantPricing = selectedVariant?.pricing;
    const variantPrice = variantPricing?.price?.gross;
    const variantUndiscounted = variantPricing?.priceUndiscounted?.gross;

    if (variantPrice) {
      const formatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: variantPrice.currency,
      });
      const price = formatter.format(variantPrice.amount);

      const hasVarDiscount =
        variantUndiscounted != null &&
        variantUndiscounted.amount > variantPrice.amount;

      const originalPrice = hasVarDiscount
        ? formatter.format(variantUndiscounted.amount)
        : null;

      const discount = hasVarDiscount
        ? Math.round((1 - variantPrice.amount / variantUndiscounted.amount) * 100)
        : 0;

      return {
        displayPrice: price,
        displayOriginalPrice: originalPrice,
        hasDiscount: hasVarDiscount,
        discountPercent: discount,
      };
    }

    // Fallback to product-level prices
    const hasProdDiscount = product.originalPrice !== null;
    const prodDiscountPercent =
      hasProdDiscount && product.originalPrice
        ? Math.round(
            (1 -
              parseFloat(product.price.replace(/[^0-9.]/g, "")) /
                parseFloat(product.originalPrice.replace(/[^0-9.]/g, ""))) *
              100,
          )
        : 0;

    return {
      displayPrice: product.price,
      displayOriginalPrice: product.originalPrice,
      hasDiscount: hasProdDiscount,
      discountPercent: prodDiscountPercent,
    };
  }, [selectedVariant, product.price, product.originalPrice]);

  // Stock computed values
  const isInStock = selectedVariant
    ? !selectedVariant.trackInventory || selectedVariant.quantityAvailable > 0
    : false;
  const maxQuantity = getMaxQuantity();

  // Button state
  const getButtonState = () => {
    if (isPending) return "adding" as const;
    if (addedToCart) return "added" as const;
    if (needsSelection && !isSelectionComplete) return "needsSelection" as const;
    if (!isInStock) return "outOfStock" as const;
    return "ready" as const;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !isInStock) return;

    const formData = new FormData();
    formData.append("variantId", selectedVariant.id);
    formData.append("quantity", quantity.toString());
    formData.append("channel", channel);
    if (productSlug) formData.append("productSlug", productSlug);

    setAddedToCart(true);
    window.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { addQuantity: quantity } })
    );

    startTransition(async () => {
      const result = await addItemAction(formData);
      if (result.success) {
        setTimeout(() => setAddedToCart(false), 3000);
        toast.success("Item added to cart!");
        window.dispatchEvent(new CustomEvent("cart-updated"));

        // GA4 add_to_cart event
        if (product.priceAmount != null && product.priceCurrency) {
          trackAddToCart(
            {
              item_id: selectedVariant?.id || product.id,
              item_name: product.name,
              item_category: product.category ?? undefined,
              price: product.priceAmount,
              currency: product.priceCurrency,
            },
            quantity,
          );
        }
      } else {
        setAddedToCart(false);
        window.dispatchEvent(new CustomEvent("cart-updated"));
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.error("Failed to add item to cart. Please try again.");
        }
      }
    });
  };

  const handleWishlistToggle = async () => {
    if (isWishlisted) {
      await removeItem(product.id);
    } else {
      const sv = product.variants.find((v) => v.id === selectedVariant?.id);
      const price =
        sv?.pricing?.price?.gross?.amount ||
        product.variants[0]?.pricing?.price?.gross?.amount ||
        0;
      const currency =
        sv?.pricing?.price?.gross?.currency ||
        product.variants[0]?.pricing?.price?.gross?.currency ||
        "USD";
      await addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price,
        originalPrice: product.originalPrice
          ? parseFloat(product.originalPrice.replace(/[^0-9.]/g, ""))
          : undefined,
        currency,
        image: product.images[0]?.url || "",
        imageAlt: product.images[0]?.alt || product.name,
        category: product.category || undefined,
        inStock: isInStock,
        channel,
        metadata: product.metadata ?? undefined,
      });
    }
  };

  // Label generators using configurable text
  const getAttributeLabel = (attrName: string) =>
    (productDetailText.selectAttributeLabel || "Select {attribute}").replace(
      "{attribute}",
      attrName
    );
  const getValidationMessage = (attrName: string) =>
    (productDetailText.pleaseSelectAttribute || "Please select {attribute}").replace(
      "{attribute}",
      attrName
    );

  const displayImages = useMemo(() => {
    // 1. Fully resolved variant with media — highest priority
    if (selectedVariant?.media && selectedVariant.media.length > 0) {
      return selectedVariant.media.map((m) => ({ url: m.url, alt: m.alt }));
    }

    // 2. Color-only selection — show images from first variant matching selected color
    //    This lets the gallery update as soon as a color swatch is clicked, without needing size
    const colorSlugs = ["color", "colour", "color-1"];
    const selectedColorSlug = Object.keys(selections).find(
      (slug) => colorSlugs.includes(slug) && selections[slug],
    );

    if (selectedColorSlug) {
      const colorValueId = selections[selectedColorSlug];
      const matchingVariant = product.variants.find((v) => {
        if (!v.media || v.media.length === 0 || !v.attributes) return false;
        return v.attributes.some(
          (attr) =>
            colorSlugs.includes(attr.attribute.slug) &&
            attr.values.some((val) => val.id === colorValueId),
        );
      });

      if (matchingVariant?.media && matchingVariant.media.length > 0) {
        return matchingVariant.media.map((m) => ({ url: m.url, alt: m.alt }));
      }
    }

    // 3. Fallback to product images
    return product.images.length > 0
      ? product.images
      : [{ url: "/placeholder-product.jpg", alt: product.name }];
  }, [selectedVariant, selections, product.variants, product.images, product.name]);

  const isModal = mode === "modal";

  return (
    <>
      <div className={`bg-white ${isModal ? "min-h-0" : "min-h-screen animate-fade-in"}`}>
        <div
          className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${isModal ? "py-4" : "py-6"}`}
        >
          {!isModal && (
            <div className="animate-fade-in">
              <Breadcrumbs
                items={[
                  { label: content.general?.allProductsLabel || "Products", href: "/products" },
                  ...(product.category && product.categorySlug
                    ? [
                        {
                          label: product.category,
                          href: `/products?categories=${product.categorySlug}`,
                        },
                      ]
                    : []),
                  { label: product.name },
                ]}
              />
            </div>
          )}

          <div
            className={
              isModal
                ? "lg:grid lg:grid-cols-2 lg:gap-x-8"
                : "mt-6 lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12"
            }
          >
            {/* Image Gallery */}
            <div
              className={isModal ? "" : "lg:sticky lg:top-24 lg:self-start animate-fade-in-up"}
              style={
                isModal
                  ? undefined
                  : { animationDelay: "100ms", animationFillMode: "both" }
              }
            >
              <ProductGallery
                key={selectedVariant?.id || "all"}
                images={displayImages}
                productName={product.name}
                discountPercent={discountPercent}
                allowLightbox={!isModal}
              />
            </div>

            {/* Product Info */}
            <div
              className={isModal ? "mt-6 lg:mt-0" : "mt-8 lg:mt-0 animate-fade-in-up"}
              style={
                isModal
                  ? undefined
                  : { animationDelay: "200ms", animationFillMode: "both" }
              }
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
              {reviewsEnabled && product.rating != null && (
                <div className="mt-3">
                  <RatingStars rating={product.rating} size="md" showValue />
                  {product.reviewCount != null && (
                    <span className="ms-2 text-sm text-neutral-600">
                      ({product.reviewCount}{" "}
                      {product.reviewCount === 1
                        ? productDetailText.reviewSingular
                        : productDetailText.reviewPlural}
                      )
                    </span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span
                  className="text-2xl font-bold sm:text-3xl"
                  style={{ color: hasDiscount ? "#ef4444" : branding.colors.text }}
                >
                  {displayPrice}
                </span>
                {displayOriginalPrice && (
                  <span className="text-lg text-neutral-400 line-through">
                    {displayOriginalPrice}
                  </span>
                )}
                {hasDiscount && discountPercent > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    {productDetailText.savePercent.replace(
                      "{percent}",
                      discountPercent.toString()
                    )}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-4">
                <StockStatus
                  variant={selectedVariant}
                  isSelectionComplete={isSelectionComplete}
                  needsSelection={needsSelection}
                  text={{
                    inStockWithCount: productDetailText.inStockWithCount,
                    onlyXLeft: productDetailText.onlyXLeft,
                    sellingFast: productDetailText.sellingFast,
                    outOfStockText: content.product.outOfStockText,
                    unlimitedStock: productDetailText.unlimitedStock,
                    selectOptionsForStock: productDetailText.selectOptionsForStock,
                    maxPerCustomer: productDetailText.maxPerCustomer,
                  }}
                />
              </div>

              {/* Delivery Estimate — from per-product metadata or config defaults */}
              <DeliveryEstimate metadata={product.metadata} />

              {/* Stock Alert — out of stock */}
              {!isInStock && selectedVariant && (
                <div className="mt-4">
                  <StockAlertButton
                    variantId={selectedVariant.id}
                    variantName={selectedVariant.name}
                    isOutOfStock={!isInStock}
                    enabled={stockAlertsEnabled}
                    onSubscribe={subscribeToStockAlert}
                    onUnsubscribe={unsubscribeFromStockAlert}
                  />
                </div>
              )}

              {/* Dynamic Variant Selectors */}
              {needsSelection && (
                <div className="mt-6">
                  <VariantSelector
                    selectionAttributes={selectionAttributes}
                    selections={selections}
                    onSelect={selectValue}
                    primaryColor={branding.colors.primary}
                    variants={product.variants}
                    getLabel={getAttributeLabel}
                    getValidationMessage={getValidationMessage}
                    showSizeGuide
                    onSizeGuideClick={() => setShowSizeGuide(true)}
                    sizeGuideLabel={productDetailText.sizeGuideButton || "Size Guide"}
                  />
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mt-8">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <QuantitySelector
                    quantity={quantity}
                    onChange={setQuantity}
                    max={maxQuantity}
                    disabled={!isInStock || !isSelectionComplete}
                    label={productDetailText.qtyLabelWithColon}
                  />

                  <AddToCartButton
                    state={getButtonState()}
                    onClick={handleAddToCart}
                    primaryColor={branding.colors.primary}
                    text={{
                      selectOptions: content.product.selectOptionsButton,
                      outOfStock: content.product.outOfStockText,
                      addToCart: content.product.addToCartButton,
                      adding: content.product.addingButton,
                      addedToCart: content.product.addedToCartButton,
                    }}
                  />

                  {/* Wishlist + Share */}
                  <div className="flex gap-2">
                    {wishlistEnabled && (
                      <button
                        onClick={handleWishlistToggle}
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${
                          isWishlisted
                            ? "border-red-200 bg-red-50 text-red-500"
                            : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                        }`}
                        aria-label={
                          isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                        }
                      >
                        <svg
                          className="h-5 w-5"
                          fill={isWishlisted ? "currentColor" : "none"}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
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

                {/* View Cart */}
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
                className={`mt-8 ${isModal ? "" : "animate-fade-in-up"}`}
                style={
                  isModal
                    ? undefined
                    : { animationDelay: "250ms", animationFillMode: "both" }
                }
              >
                <TrustBadges
                  freeShipping={productDetailText.freeShipping}
                  securePayment={productDetailText.securePayment}
                  easyReturns={productDetailText.easyReturns}
                />
              </div>

              {/* Tabs */}
              <div
                className={isModal ? "" : "animate-fade-in-up"}
                style={
                  isModal
                    ? undefined
                    : { animationDelay: "300ms", animationFillMode: "both" }
                }
              >
                <ProductTabs
                  productId={product.id}
                  description={product.description}
                  productAttributes={product.productAttributes || []}
                  primaryColor={branding.colors.primary}
                  reviewsEnabled={reviewsEnabled}
                  rating={product.rating || 0}
                  reviewCount={product.reviewCount || 0}
                  text={{
                    descriptionTab: productDetailText.descriptionTab,
                    specificationsTab: productDetailText.specificationsTab,
                    shippingTab: productDetailText.shippingTab,
                    reviewsTab: productDetailText.reviewsTab,
                    noDescriptionAvailable: productDetailText.noDescriptionAvailable,
                    noSpecifications: productDetailText.noSpecifications,
                    freeStandardShippingTitle: productDetailText.freeStandardShippingTitle,
                    freeStandardShippingDescription:
                      productDetailText.freeStandardShippingDescription,
                    expressShippingTitle: productDetailText.expressShippingTitle,
                    expressShippingDescription:
                      productDetailText.expressShippingDescription,
                    writeReviewButton: content.product.writeReviewButton,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <SizeGuideModal open={showSizeGuide} onOpenChange={setShowSizeGuide} defaultCategory={sizeGuideCategory} />
    </>
  );
}

/** Delivery estimate badge — reads per-product metadata, falls back to config defaults. */
function DeliveryEstimate({ metadata }: { metadata?: Array<{ key: string; value: string }> }) {
  const ecommerce = useEcommerceSettings();
  const productDetailText = useProductDetailText();

  if (!ecommerce.shipping?.showEstimatedDelivery) return null;

  const estimate = getProductShippingEstimate(metadata);
  const format = ecommerce.shipping.estimatedDeliveryFormat ?? "range";

  // Per-product estimate or fall back to config defaults
  const minDays = estimate?.minDays ?? ecommerce.shipping.defaultEstimatedMinDays ?? 2;
  const maxDays = estimate?.maxDays ?? ecommerce.shipping.defaultEstimatedMaxDays ?? 5;
  const days = formatEstimate({ minDays, maxDays }, format);

  // Use configurable label template, e.g. "Ships in {days} business days"
  const label =
    productDetailText.deliveryEstimateLabel?.replace("{days}", days) ??
    `Ships in ${days} business days`;

  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
        <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
        <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
