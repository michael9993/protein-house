"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListItemFragment } from "@/gql/graphql";
import { ProductCard } from "@/ui/components/ProductCard";

interface RelatedProductsCarouselProps {
  products: ProductListItemFragment[];
  channel: string;
}

/**
 * Client component for Related Products carousel.
 * Features:
 * - Horizontal scroll with CSS scroll-snap
 * - RTL/LTR aware navigation
 * - Keyboard navigation (arrow keys)
 * - Touch/swipe support (native scroll)
 * - Responsive card sizing
 */
export function RelatedProductsCarousel({ products, channel }: RelatedProductsCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isRtl, setIsRtl] = useState(false);

  // Detect RTL on mount
  useEffect(() => {
    const dir = document.documentElement.dir;
    setIsRtl(dir === "rtl");
  }, []);

  // Check scroll position to update button visibility
  const checkScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // For RTL, scrollLeft is negative in some browsers
    const absScrollLeft = Math.abs(scrollLeft);
    const maxScroll = scrollWidth - clientWidth;
    
    // Threshold for detecting scroll position (accounting for rounding)
    const threshold = 2;
    
    if (isRtl) {
      // In RTL: scroll starts from "right" (visually), so logic is inverted
      setCanScrollRight(absScrollLeft > threshold);
      setCanScrollLeft(absScrollLeft < maxScroll - threshold);
    } else {
      setCanScrollLeft(absScrollLeft > threshold);
      setCanScrollRight(absScrollLeft < maxScroll - threshold);
    }
  }, [isRtl]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial check
    checkScrollPosition();

    container.addEventListener("scroll", checkScrollPosition, { passive: true });
    window.addEventListener("resize", checkScrollPosition, { passive: true });

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [checkScrollPosition]);

  // Scroll by card width
  const scroll = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    // Calculate scroll amount (approx 2 cards)
    const cardWidth = 280; // Approximate card width
    const scrollAmount = cardWidth * 2;
    
    // In RTL, directions are visually swapped
    const actualDirection = isRtl 
      ? (direction === "left" ? "right" : "left")
      : direction;
    
    const offset = actualDirection === "left" ? -scrollAmount : scrollAmount;
    
    container.scrollBy({
      left: offset,
      behavior: "smooth",
    });
  }, [isRtl]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scroll("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scroll("right");
    }
  }, [scroll]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative group"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Related products carousel"
    >
      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-4"
        style={{
          scrollPaddingInlineStart: "1rem",
          scrollPaddingInlineEnd: "1rem",
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex-none w-[260px] sm:w-[280px] snap-start"
          >
            <ProductCard
              product={product}
              loading={index < 4 ? "eager" : "lazy"}
              priority={index < 2}
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {/* Previous button (logical start) */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`
          absolute top-1/2 -translate-y-1/2 z-10
          start-0 -ms-4
          w-10 h-10 rounded-full
          bg-white shadow-lg border border-neutral-200
          flex items-center justify-center
          transition-all duration-200
          hover:bg-neutral-50 hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-[var(--store-primary)] focus:ring-offset-2
          disabled:opacity-0 disabled:pointer-events-none
          ${canScrollLeft ? "opacity-0 group-hover:opacity-100" : ""}
        `}
        aria-label="Previous products"
      >
        <ChevronLeft className="w-5 h-5 text-neutral-700 rtl:rotate-180" />
      </button>

      {/* Next button (logical end) */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`
          absolute top-1/2 -translate-y-1/2 z-10
          end-0 -me-4
          w-10 h-10 rounded-full
          bg-white shadow-lg border border-neutral-200
          flex items-center justify-center
          transition-all duration-200
          hover:bg-neutral-50 hover:shadow-xl
          focus:outline-none focus:ring-2 focus:ring-[var(--store-primary)] focus:ring-offset-2
          disabled:opacity-0 disabled:pointer-events-none
          ${canScrollRight ? "opacity-0 group-hover:opacity-100" : ""}
        `}
        aria-label="Next products"
      >
        <ChevronRight className="w-5 h-5 text-neutral-700 rtl:rotate-180" />
      </button>
    </div>
  );
}
