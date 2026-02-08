"use client";

/**
 * QuickFilters Component — Clean Card Design
 *
 * Clear, undimmed product images with a frosted-glass text bar.
 * No heavy gradient overlays — images are fully visible.
 * Includes id="quick-filters-section" for StickyQuickFilters integration.
 */

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useQuickFiltersConfig, useFiltersText, useBranding } from "@/providers/StoreConfigProvider";
import Image from "next/image";
import { useState, useRef, useEffect, type MouseEvent } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

interface QuickFilterItem {
  id: string;
  name: string;
  slug: string;
  type: "category" | "collection" | "brand";
  productCount?: number;
  children?: Array<{ id: string; slug: string }>;
  image?: {
    url: string;
    alt?: string;
  };
  backgroundImage?: {
    url: string;
    alt?: string;
  };
  productImages?: Array<{
    url: string;
    alt?: string;
  }>;
}

interface SubcategoryData {
  id: string;
  slug: string;
  name?: string;
  productCount?: number;
  backgroundImage?: { url: string; alt?: string };
  productImages?: Array<{ url: string; alt?: string }>;
  children?: Array<{ id: string; slug: string; name?: string }>;
}

interface QuickFiltersProps {
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
    children?: Array<SubcategoryData>;
    backgroundImage?: { url: string; alt?: string };
    productImages?: Array<{ url: string; alt?: string }>;
  }>;
  collections?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
    backgroundImage?: { url: string; alt?: string };
    productImages?: Array<{ url: string; alt?: string }>;
  }>;
  brands?: Array<{
    id: string;
    name: string;
    slug: string;
    productCount?: number;
    backgroundImage?: { url: string; alt?: string };
    productImages?: Array<{ url: string; alt?: string }>;
  }>;
  title?: string;
}

export function QuickFilters({
  categories = [],
  collections = [],
  brands = [],
  title,
}: QuickFiltersProps) {
  const config = useStoreConfig();
  const quickFiltersConfig = useQuickFiltersConfig();
  const filtersText = useFiltersText();
  const branding = useBranding();
  const { localization } = config;
  const { filters, toggleCategory, toggleCollection, toggleBrand, updateFilters } = useProductFilters();

  // RTL detection
  const isRtl = localization?.direction === 'rtl' ||
    (localization?.direction === 'auto' &&
     (localization?.rtlLocales || ['he', 'ar', 'fa', 'ur', 'yi', 'ps']).some(
       rtl => localization?.defaultLocale?.toLowerCase().startsWith(rtl.toLowerCase())
     ));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});

  // Don't render if quick filters are disabled
  if (!quickFiltersConfig.enabled) {
    return null;
  }

  const categoryLimit = quickFiltersConfig.categoryLimit;
  const collectionLimit = quickFiltersConfig.collectionLimit;
  const brandLimit = quickFiltersConfig.brandLimit;

  // Combine all items with their types and images
  // For categories: insert subcategories as individual cards after their parent
  const categoryItems: QuickFilterItem[] = [];
  if (quickFiltersConfig.showCategories) {
    for (const cat of categories.slice(0, categoryLimit)) {
      // Add parent category card
      categoryItems.push({
        ...cat,
        type: "category" as const,
        children: cat.children || [],
        backgroundImage: cat.backgroundImage,
        productImages: cat.productImages,
      });
      // Add subcategories as individual cards (leaf categories with no children)
      if (cat.children && cat.children.length > 0) {
        for (const sub of cat.children) {
          if (sub.name && (sub.productCount === undefined || sub.productCount > 0)) {
            categoryItems.push({
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              type: "category" as const,
              productCount: sub.productCount,
              children: sub.children ? sub.children.map(c => ({ id: c.id, slug: c.slug })) : undefined,
              backgroundImage: sub.backgroundImage,
              productImages: sub.productImages,
            });
          }
        }
      }
    }
  }

  const allItems: QuickFilterItem[] = [
    ...categoryItems,
    ...(quickFiltersConfig.showCollections ? collections.slice(0, collectionLimit).map(col => ({
      ...col,
      type: "collection" as const,
      backgroundImage: col.backgroundImage,
      productImages: col.productImages,
    })) : []),
    ...(quickFiltersConfig.showBrands ? brands.slice(0, brandLimit).map(brand => ({
      ...brand,
      type: "brand" as const,
      backgroundImage: brand.backgroundImage,
      productImages: brand.productImages,
    })) : []),
  ];

  // Rotate product images for items with multiple images
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    allItems.forEach((item) => {
      if (item.productImages && item.productImages.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndices((prev: Record<string, number>) => ({
            ...prev,
            [item.id]: ((prev[item.id] || 0) + 1) % item.productImages!.length,
          }));
        }, 4000);
        intervals.push(interval);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [allItems]);

  // Check scroll position for arrow visibility
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }
    if (isRtl) {
      const rtlMin = -maxScroll;
      setShowLeftArrow(scrollLeft < -20);
      setShowRightArrow(scrollLeft > rtlMin + 20);
    } else {
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < maxScroll - 20);
    }
  };

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
  }, [allItems, isRtl]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const style = (quickFiltersConfig.style || {}) as { cardWidth?: number; cardGap?: number };
    const cardWidthNum = Number(style.cardWidth ?? 160);
    const cardGapNum = Number(style.cardGap ?? 0.5);
    const cardWidth = cardWidthNum + cardGapNum * 8;
    const scrollAmount = cardWidth * 2;
    const currentScroll = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const minScroll = isRtl ? -maxScroll : 0;
    const maxScrollVal = isRtl ? 0 : maxScroll;
    const delta = direction === "left" ? -scrollAmount : scrollAmount;
    const targetScroll = Math.max(minScroll, Math.min(maxScrollVal, currentScroll + delta));
    el.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  if (allItems.length === 0) {
    return null;
  }

  // Collect only sub-category slugs (excludes the parent itself)
  const collectChildSlugs = (cat: { slug: string; children?: Array<{ slug: string; children?: Array<{ slug: string }> }> }): string[] => {
    const out: string[] = [];
    if (cat.children) {
      for (const c of cat.children) {
        out.push(c.slug);
        out.push(...collectChildSlugs(c));
      }
    }
    return out;
  };

  const handleQuickFilterClick = (e: MouseEvent<HTMLButtonElement>, item: QuickFilterItem) => {
    e.preventDefault();

    if (item.type === "category" && item.children && item.children.length > 0) {
      // Parent category: only toggle sub-categories, not the parent itself
      const childSlugs = collectChildSlugs(item);
      const currentCategories = filters.categories;
      const allChildrenSelected = childSlugs.every(slug => currentCategories.includes(slug));

      if (allChildrenSelected) {
        const updatedCategories = currentCategories.filter(slug => !childSlugs.includes(slug));
        updateFilters({ categories: updatedCategories });
      } else {
        const slugsToAdd = childSlugs.filter(slug => !currentCategories.includes(slug));
        const updatedCategories = [...currentCategories, ...slugsToAdd];
        updateFilters({ categories: updatedCategories });
      }
    } else {
      switch (item.type) {
        case "collection":
          toggleCollection(item.slug);
          break;
        case "brand":
          toggleBrand(item.slug);
          break;
        default:
          toggleCategory(item.slug);
          break;
      }
    }
  };

  const isActive = (item: QuickFilterItem) => {
    switch (item.type) {
      case "collection":
        return filters.collections.includes(item.slug);
      case "brand":
        return filters.brands.includes(item.slug);
      default:
        if (filters.categories.includes(item.slug)) return true;
        // Parent is active if any of its sub-categories are selected
        if (item.children && item.children.length > 0) {
          return collectChildSlugs(item).some(slug => filters.categories.includes(slug));
        }
        return false;
    }
  };

  const getItemImage = (item: QuickFilterItem) => {
    if (item.productImages && item.productImages.length > 0) {
      const currentIndex = currentImageIndices[item.id] || 0;
      return item.productImages[currentIndex];
    }
    if (item.backgroundImage) {
      return item.backgroundImage;
    }
    return null;
  };

  const sectionTitle = title || filtersText.checkOutOurProducts || "Shop by Category";

  return (
    <section
      id="quick-filters-section"
      className="relative w-full py-6"
    >
      {/* Section Header - Elegant Typography */}
      <div className="mb-5 px-1">
        <h2 className="text-lg font-medium tracking-tight text-neutral-800">
          {sectionTitle}
        </h2>
        <div className="mt-1.5 h-px w-12 bg-neutral-300" />
      </div>

      {/* Cards Container */}
      <div
        className="relative w-full"
        style={{
          height: `${quickFiltersConfig.style?.cardHeight || 200}px`
        }}
      >
        {/* Left Scroll Arrow - Minimal Design */}
        {showLeftArrow && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll(isRtl ? "right" : "left");
            }}
            className="absolute start-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 transition-all duration-200 hover:bg-white hover:scale-105"
            aria-label={filtersText.scrollLeftAriaLabel}
            type="button"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          dir={isRtl ? "rtl" : "ltr"}
          className="relative flex gap-2.5 overflow-x-auto scrollbar-hide h-full px-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollBehavior: "smooth",
          }}
        >
          {allItems.map((item) => {
            const active = isActive(item);
            const image = getItemImage(item);
            const hasMultipleImages = item.productImages && item.productImages.length > 1;
            // Serialize sub-category slugs for sticky bar sync (excludes parent)
            const childrenSlugs = item.type === "category" && item.children && item.children.length > 0
              ? collectChildSlugs(item).join(",")
              : undefined;
            const cardWidth = Number((quickFiltersConfig.style as { cardWidth?: number })?.cardWidth ?? 150);

            return (
              <button
                key={`${item.type}-${item.id}`}
                data-filter-type={item.type}
                data-filter-slug={item.slug}
                data-filter-id={item.id}
                data-filter-children={childrenSlugs}
                onClick={(e: MouseEvent<HTMLButtonElement>) => handleQuickFilterClick(e, item)}
                className={`group relative shrink-0 overflow-hidden rounded-xl transition-all duration-300 h-full border ${
                  active
                    ? "border-neutral-900 shadow-md"
                    : "border-neutral-200 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-0.5"
                }`}
                style={{ width: `${cardWidth}px`, height: "100%" }}
              >
                {/* Image area — takes full card, NO gradient dimming */}
                <div className="absolute inset-0">
                  {image ? (
                    <>
                      {hasMultipleImages && item.productImages ? (
                        item.productImages.map((img, idx) => {
                          const currentIndex = currentImageIndices[item.id] || 0;
                          const isVisible = idx === currentIndex;
                          return (
                            <div
                              key={`${img.url}-${idx}`}
                              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                                isVisible ? "opacity-100" : "opacity-0"
                              }`}
                            >
                              <Image
                                src={img.url}
                                alt={img.alt || `${item.name} product`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                sizes={`${cardWidth}px`}
                                priority={idx === 0}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <Image
                          src={image.url}
                          alt={image.alt || item.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          sizes={`${cardWidth}px`}
                        />
                      )}
                    </>
                  ) : (
                    <div className={`h-full w-full ${active ? "bg-neutral-900" : "bg-neutral-100"}`} />
                  )}
                </div>

                {/* Active check badge */}
                {active && (
                  <div
                    className="absolute top-2 end-2 z-30 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
                    style={{ backgroundColor: branding.colors.primary }}
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Bottom text strip — frosted glass for readability without dimming the image */}
                <div className="absolute inset-x-0 bottom-0 z-20">
                  <div
                    className={`px-3 py-2.5 backdrop-blur-md ${
                      active
                        ? "bg-neutral-900/80 text-white"
                        : image
                          ? "bg-white/80 text-neutral-900"
                          : "bg-white/90 text-neutral-700"
                    }`}
                  >
                    <h3 className="text-[13px] font-semibold leading-snug line-clamp-1">
                      {item.name}
                    </h3>
                    {item.productCount !== undefined && item.productCount > 0 && (
                      <span
                        className={`mt-0.5 block text-[11px] ${
                          active ? "text-white/70" : "text-neutral-500"
                        }`}
                      >
                        {item.productCount} {item.productCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow - Minimal Design */}
        {showRightArrow && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll(isRtl ? "left" : "right");
            }}
            className="absolute end-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 transition-all duration-200 hover:bg-white hover:scale-105"
            aria-label={filtersText.scrollRightAriaLabel}
            type="button"
          >
            <ChevronRight className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
