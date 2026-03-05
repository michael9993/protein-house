"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListItemFragment } from "@/gql/graphql";
import { t } from "@/lib/language";
import { useWishlist } from "@/lib/wishlist";
import {
  useRelatedProductsConfig,
  useBranding,
  useStoreInfo,
  useContentConfig,
  useFeature,
  useProductCardConfig,
} from "@/providers/StoreConfigProvider";
import { useQuickView } from "@/providers/QuickViewProvider";
import { HomepageProductCard } from "@/components/home/HomepageProductCard";
import { type BadgeLabels, type ProductCardConfig } from "@/components/home/utils";

interface RelatedProductsCarouselProps {
  products: ProductListItemFragment[];
  channel: string;
}

/**
 * Client component for Related Products carousel.
 * V6-style cards matching homepage sections.
 * RTL/LTR aware navigation arrows with smart visibility.
 */
export function RelatedProductsCarousel({ products, channel }: RelatedProductsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const config = useRelatedProductsConfig();
  const contentConfig = useContentConfig();
  const cardConfig = useProductCardConfig("relatedProducts");
  const { openQuickView, prefetchQuickView } = useQuickView();
  const wishlistEnabled = useFeature("wishlist");
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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
        name: t(product),
        slug: product.slug,
        price: price?.amount || 0,
        originalPrice: originalPrice?.amount,
        currency: price?.currency || "USD",
        image: image || "",
        imageAlt: product.thumbnail?.alt || t(product),
        category: product.category ? t(product.category) : undefined,
        inStock: (product.variants?.some(v => (v.quantityAvailable ?? 0) > 0)) ?? true,
        channel,
      });
    }
  }, [addItem, removeItem, isInWishlist]);

  // Configurable title/subtitle — prefer productDetail content, fall back to relatedProducts config
  const pdContent = contentConfig.productDetail;
  const homepageContent = contentConfig.homepage;
  const title = pdContent?.relatedProductsTitle || config.title || "You May Also Like";
  const subtitle = pdContent?.relatedProductsSubtitle || config.subtitle || "Customers also viewed these products";
  const storeName = storeInfo.name || "";
  const accent = colors.primary;

  // Get translated content — prefer productDetail, fall back to homepage
  const viewDetailsText = pdContent?.relatedViewDetailsButton || homepageContent.viewDetailsButton || "View details";
  const performanceFallback = homepageContent.performanceFallback || "Performance";

  // Badge labels for translation (shared with homepage)
  const badgeLabels: BadgeLabels = {
    outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
    sale: homepageContent.saleBadgeLabel || "Sale",
    off: homepageContent.saleBadgeOffText || "OFF",
    lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
    new: homepageContent.newBadgeLabel || "New",
    featured: homepageContent.featuredBadgeLabel || "Featured",
  };

  // Detect RTL direction
  const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  // Check scroll position for arrow visibility
  const checkScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }
    if (isRTL) {
      const rtlMin = -maxScroll;
      setShowLeftArrow(scrollLeft < -20);
      setShowRightArrow(scrollLeft > rtlMin + 20);
    } else {
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < maxScroll - 20);
    }
  }, [isRTL]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [products, isRTL, checkScrollPosition]);

  // Scroll navigation - accounts for RTL direction
  const scroll = useCallback((direction: "prev" | "next") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const firstChild = container.firstElementChild as HTMLElement | null;
    const scrollAmount = firstChild ? firstChild.offsetWidth + 24 : 300;
    const actualDirection = isRTL ? (direction === "next" ? -1 : 1) : (direction === "next" ? 1 : -1);
    const newScrollLeft = container.scrollLeft + (scrollAmount * actualDirection);
    container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  }, [isRTL]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-neutral-200 bg-white py-16" aria-label="Related products">
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl text-center mx-auto font-black uppercase italic tracking-tighter text-neutral-900 md:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-center mx-auto text-sm font-medium text-neutral-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Scroll Container with overlay arrows */}
        <div className="relative mt-8">
          {/* Left arrow */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => scroll("prev")}
              className="absolute start-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 transition-all duration-200 hover:bg-white hover:scale-105 shadow-sm"
              aria-label={pdContent?.relatedPreviousLabel || "Previous products"}
            >
              <ChevronLeft className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
            </button>
          )}
          {/* Right arrow */}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => scroll("next")}
              className="absolute end-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 transition-all duration-200 hover:bg-white hover:scale-105 shadow-sm"
              aria-label={pdContent?.relatedNextLabel || "Next products"}
            >
              <ChevronRight className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
            </button>
          )}
          {/* Horizontal Scroll Container */}
          <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity" }}>
            {products.map((product, index) => (
              <div key={product.id} className="w-[260px] flex-none sm:w-[280px]" style={{ scrollSnapAlign: "start" }}>
                <HomepageProductCard
                  product={product}
                  channel={channel}
                  storeName={storeName}
                  accent={accent}
                  badgeLabels={badgeLabels}
                  viewDetailsText={viewDetailsText}
                  performanceFallback={performanceFallback}
                  onQuickView={openQuickView}
                  onPrefetch={prefetchQuickView}
                  wishlistEnabled={wishlistEnabled}
                  isWishlisted={isInWishlist(product.id)}
                  onWishlistToggle={handleWishlistToggle}
                  cardConfig={cardConfig}
                  loading={index < 4 ? "eager" : "lazy"}
                  priority={index < 2}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
