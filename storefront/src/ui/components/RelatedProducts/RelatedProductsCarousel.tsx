"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListItemFragment } from "@/gql/graphql";
import { ProductCard } from "@/ui/components/ProductCard";
import { useRelatedProductsConfig, useBranding } from "@/providers/StoreConfigProvider";

interface RelatedProductsCarouselProps {
  products: ProductListItemFragment[];
  channel: string;
}

/**
 * Client component for Related Products carousel.
 * Uses storefront control config for title/subtitle.
 * RTL/LTR aware navigation arrows with smart visibility (QuickFilters style).
 */
export function RelatedProductsCarousel({ products, channel }: RelatedProductsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { colors } = useBranding();
  const config = useRelatedProductsConfig();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Configurable title/subtitle from storefront control
  const title = config.title || "You May Also Like";
  const subtitle = config.subtitle || "Customers also viewed these products";

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

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-neutral-200 bg-white py-16" aria-label="Related products">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-neutral-900 md:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm font-medium text-neutral-500">
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
            {products.map((product, index) => (
              <div key={product.id} className="w-[260px] flex-none sm:w-[280px]">
                <ProductCard
                  product={product}
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
