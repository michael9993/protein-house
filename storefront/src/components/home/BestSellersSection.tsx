"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { t } from "@/lib/language";
import { useWishlist } from "@/lib/wishlist";
import { useBranding, useStoreInfo, useContentConfig, useBestSellersConfig, useFeature, useUiConfig } from "@/providers/StoreConfigProvider";
import { buildProductsUrl, withChannel } from "@/lib/urls";
import { SectionViewAllButton } from "./SectionViewAllButton";
import { useQuickView } from "@/providers/QuickViewProvider";
import { HomepageProductCard } from "./HomepageProductCard";
import { type BadgeLabels, type ProductCardConfig } from "./utils";

interface BestSellersSectionProps {
  products: readonly ProductListItemFragment[];
  channel: string;
  title?: string;
  subtitle?: string;
}

/**
 * BestSellersSection - V6-style best sellers with horizontal scroll
 * Features curated header and horizontal scrolling product cards.
 * Configurable via Storefront Control.
 */
export function BestSellersSection({ products, channel, title, subtitle }: BestSellersSectionProps) {
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const contentConfig = useContentConfig();
  const config = useBestSellersConfig();
  const { openQuickView, prefetchQuickView } = useQuickView();
  const wishlistEnabled = useFeature("wishlist");
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const ui = useUiConfig();
  const cardConfig: ProductCardConfig = ui.productCard;

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
  }, [addItem, removeItem, isInWishlist, channel]);

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
    const scrollAmount = 300;
    const actualDirection = isRTL ? (direction === "next" ? -1 : 1) : (direction === "next" ? 1 : -1);
    const newScrollLeft = container.scrollLeft + (scrollAmount * actualDirection);
    container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  }, [isRTL]);

  // Use config values with fallback chain
  const enabled = config?.enabled ?? true;
  const maxProducts = config?.maxProducts ?? 6;

  // Priority: props > config > content config
  const displayTitle = title || config?.title || contentConfig.homepage.bestSellersTitle || "";
  const displaySubtitle = subtitle || config?.subtitle || contentConfig.homepage.bestSellersSubtitle || "";

  const storeName = storeInfo.name || "";
  const accent = colors.primary;

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const curatedLabel = homepageContent.curatedLabel || "Curated";
  const viewAllText = homepageContent.viewAllButton || "View All";
  const viewDetailsText = homepageContent.viewDetailsButton || "View details";
  const performanceFallback = homepageContent.performanceFallback || "Performance";

  // Badge labels for translation
  const badgeLabels: BadgeLabels = {
    outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
    sale: homepageContent.saleBadgeLabel || "Sale",
    off: homepageContent.saleBadgeOffText || "OFF",
    lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
    new: homepageContent.newBadgeLabel || "New",
    featured: homepageContent.featuredBadgeLabel || "Featured",
  };

  // Hide if explicitly disabled or no products
  if (!enabled || products.length === 0) return null;

  const displayProducts = products.slice(0, maxProducts);

  return (
    <section className="py-20" aria-label="Best selling products">
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* V6-style section header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
              {curatedLabel}
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase italic tracking-tighter text-neutral-900 md:text-5xl">
              {displayTitle}
            </h2>
            {displaySubtitle && (
              <p className="mt-3 max-w-2xl text-sm font-medium text-neutral-500 md:text-base">
                {displaySubtitle}
              </p>
            )}
          </div>
          <SectionViewAllButton
            href={withChannel(channel, buildProductsUrl({ collections: ["best-sellers"] }))}
            text={viewAllText}
          />
        </div>

        {/* Scroll Container with overlay arrows */}
        <div className="relative mt-8">
          {/* Left arrow */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => scroll("prev")}
              className="absolute start-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 transition-all duration-200 hover:bg-white hover:scale-105 shadow-sm"
              aria-label="Previous products"
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
              aria-label="Next products"
            >
              <ChevronRight className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
            </button>
          )}
          {/* Horizontal Scroll Container */}
          <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {displayProducts.map((product) => (
            <div key={product.id} className="w-[260px] flex-none sm:w-[280px]">
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
              />
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
