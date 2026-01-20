"use client";

/**
 * QuickFilters Component - Full Photo Design
 * 
 * Quick filter component with full-size photos and overlaid text
 * Config-driven: Uses StoreConfig from context for settings/limits.
 */

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useQuickFiltersConfig, useFiltersText } from "@/providers/StoreConfigProvider";
import Image from "next/image";
import { useState, useRef, useEffect, type MouseEvent } from "react";
import { CheckCircle2 } from "lucide-react";

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

interface QuickFiltersProps {
  categories?: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    productCount?: number;
    children?: Array<{ id: string; slug: string }>;
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
}

export function QuickFilters({ categories = [], collections = [], brands = [] }: QuickFiltersProps) {
  // Use config from context (per-channel)
  const config = useStoreConfig();
  const quickFiltersConfig = useQuickFiltersConfig(); // Always returns complete config with defaults
  const filtersText = useFiltersText();
  const { branding, localization } = config;
  const { filters, toggleCategory, toggleCollection, toggleBrand, updateFilters } = useProductFilters();
  
  // RTL detection
  const isRtl = localization?.direction === 'rtl' || 
    (localization?.direction === 'auto' && 
     (localization?.rtlLocales || ['he', 'ar', 'fa', 'ur', 'yi', 'ps']).some(
       rtl => localization?.defaultLocale?.toLowerCase().startsWith(rtl.toLowerCase())
     ));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const quickFiltersRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Don't render if quick filters are disabled
  if (!quickFiltersConfig.enabled) {
    return null;
  }

  const categoryLimit = quickFiltersConfig.categoryLimit;
  const collectionLimit = quickFiltersConfig.collectionLimit;
  const brandLimit = quickFiltersConfig.brandLimit;

  // Combine all items with their types and images
  const allItems: QuickFilterItem[] = [
    ...(quickFiltersConfig.showCategories ? categories.slice(0, categoryLimit).map(cat => ({ 
      ...cat, 
      type: "category" as const,
      children: cat.children || [],
      backgroundImage: cat.backgroundImage,
      productImages: cat.productImages,
    })) : []),
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

  // Group consecutive items of the same type
  interface GroupedItem extends QuickFilterItem {
    groupStart?: boolean;
    groupEnd?: boolean;
    groupIndex?: number;
    groupSize?: number;
  }

  const groupedItems: GroupedItem[] = [];
  type GroupType = { type: string; items: GroupedItem[]; startIndex: number };
  let currentGroup: GroupType | null = null;

  allItems.forEach((item, index) => {
    if (!currentGroup || currentGroup.type !== item.type) {
      // End previous group
      if (currentGroup) {
        currentGroup.items.forEach((groupItem, groupIdx) => {
          groupItem.groupStart = groupIdx === 0;
          groupItem.groupEnd = groupIdx === currentGroup!.items.length - 1;
          groupItem.groupIndex = groupIdx;
          groupItem.groupSize = currentGroup!.items.length;
        });
      }
      // Start new group
      currentGroup = { type: item.type, items: [], startIndex: index };
    }
    
    const groupedItem: GroupedItem = { ...item };
    currentGroup.items.push(groupedItem);
    groupedItems.push(groupedItem);
  });

  // End last group
  if (currentGroup) {
    (currentGroup as GroupType).items.forEach((groupItem, groupIdx) => {
      groupItem.groupStart = groupIdx === 0;
      groupItem.groupEnd = groupIdx === (currentGroup as GroupType).items.length - 1;
      groupItem.groupIndex = groupIdx;
      groupItem.groupSize = (currentGroup as GroupType).items.length;
    });
  }

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
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
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
  }, [allItems]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const style = quickFiltersConfig.style || {};
    const cardWidth = (style.cardWidth || 160) + (style.cardGap || 0.5) * 8; // Card width + gap in pixels
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const targetScroll = direction === "left" 
      ? Math.max(0, currentScroll - scrollAmount)
      : currentScroll + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  // Scroll detection is now handled by StickyFiltersContext

  // No scroll function needed - all cards visible

  if (allItems.length === 0) {
    return null;
  }

  const handleQuickFilterClick = (e: MouseEvent<HTMLButtonElement>, item: QuickFilterItem) => {
    e.preventDefault();
    
    if (item.type === "category" && item.children && item.children.length > 0) {
      const childSlugs = item.children.map(child => child.slug);
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
        if (item.children && item.children.length > 0) {
          return item.children.some(child => filters.categories.includes(child.slug));
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

  return (
    <>
      <div 
        ref={quickFiltersRef}
        id="quick-filters-section"
        className="relative w-full"
        style={{
          background: `linear-gradient(135deg, ${branding.colors.primary}05 0%, ${branding.colors.secondary}03 50%, transparent 100%)`,
        }}
      >
      <div 
        className="relative w-full"
        style={{ 
          height: `${quickFiltersConfig.style?.cardHeight || 220}px` 
        }}
      >
      {/* Scroll arrows - positioned outside the scroll container with RTL support */}
      {showLeftArrow && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scroll(isRtl ? "right" : "left");
          }}
          className="absolute start-2 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center rounded-full bg-white border-2 shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:shadow-2xl pointer-events-auto"
          style={{ 
            height: `${quickFiltersConfig.style?.arrowSize || 48}px`,
            width: `${quickFiltersConfig.style?.arrowSize || 48}px`,
            borderColor: branding.colors.primary + "40",
            boxShadow: `0 4px 12px ${branding.colors.primary}20`,
          }}
          aria-label={filtersText.scrollLeftAriaLabel}
          type="button"
        >
          <svg
            className="pointer-events-none rtl:rotate-180"
            style={{ 
              color: branding.colors.primary,
              height: `${quickFiltersConfig.style?.arrowIconSize || 24}px`,
              width: `${quickFiltersConfig.style?.arrowIconSize || 24}px`,
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Main scrollable container */}
      <div
        ref={scrollContainerRef}
        className="relative flex overflow-x-auto scrollbar-hide h-full"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "smooth",
          paddingLeft: showLeftArrow ? "60px" : "0",
        }}
      >
        {groupedItems.map((item) => {
          const active = isActive(item);
          const image = getItemImage(item);
          const hasMultipleImages = item.productImages && item.productImages.length > 1;
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={`${item.type}-${item.id}`}
              data-filter-type={item.type}
              data-filter-slug={item.slug}
              data-filter-id={item.id}
              onClick={(e: MouseEvent<HTMLButtonElement>) => handleQuickFilterClick(e, item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`group relative shrink-0 overflow-hidden transition-all duration-300 h-full ${
                active
                  ? "ring-2 ring-offset-1"
                  : "ring-1 ring-neutral-200 hover:ring-neutral-300"
              }`}
              style={{
                width: `${quickFiltersConfig.style?.cardWidth || 160}px`,
                height: "100%",
                marginRight: `${(quickFiltersConfig.style?.cardGap || 0.5) * 8}px`,
                borderRadius: "0",
                "--tw-ring-color": active ? branding.colors.primary : undefined,
                transform: isHovered && !active ? "translateY(-2px)" : undefined,
              } as React.CSSProperties}
            >
              {/* White background */}
              <div className="absolute inset-0 bg-white z-0" />

              {/* Full-size background image */}
              {image ? (
                <>
                  {/* Multiple images with smooth fade */}
                  {hasMultipleImages && item.productImages ? (
                    <>
                      {item.productImages.map((img, idx) => {
                        const currentIndex = currentImageIndices[item.id] || 0;
                        const isVisible = idx === currentIndex;
                        return (
                          <div
                            key={`${img.url}-${idx}`}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                              isVisible ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                          >
                            <Image
                              src={img.url}
                              alt={img.alt || `${item.name} product`}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              sizes="160px"
                              priority={idx === 0}
                            />
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <Image
                      src={image.url}
                      alt={image.alt || item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="160px"
                    />
                  )}

                  {/* Light gradient overlay for text readability - only at bottom */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20"
                  />

                  {/* Active state overlay - subtle */}
                  {active && (
                    <div 
                      className="absolute inset-0 z-20"
                      style={{
                        background: `linear-gradient(to top, ${branding.colors.primary}30 0%, transparent 40%)`,
                      }}
                    />
                  )}
                </>
              ) : (
                /* Fallback gradient background when no image */
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${branding.colors.primary} 0%, ${branding.colors.primary}80 100%)`
                      : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                  }}
                />
              )}

              {/* Content overlay - Text positioned at bottom */}
              <div className="absolute inset-0 z-30 flex flex-col justify-end">
                {/* Active checkmark badge - Top right */}
                {active && (
                  <div
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white backdrop-blur-sm shadow-lg"
                    style={{ 
                      backgroundColor: branding.colors.primary,
                      boxShadow: `0 4px 12px ${branding.colors.primary}50`,
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Name only */}
                <h3
                  className="text-base font-bold text-white transition-colors duration-200"
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  }}
                >
                  {item.name}
                </h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right scroll arrow - positioned outside the scroll container with RTL support */}
      {showRightArrow && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scroll(isRtl ? "left" : "right");
          }}
          className="absolute end-2 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center rounded-full bg-white border-2 shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:shadow-2xl pointer-events-auto"
          style={{ 
            height: `${quickFiltersConfig.style?.arrowSize || 48}px`,
            width: `${quickFiltersConfig.style?.arrowSize || 48}px`,
            borderColor: branding.colors.primary + "40",
            boxShadow: `0 4px 12px ${branding.colors.primary}20`,
          }}
          aria-label={filtersText.scrollRightAriaLabel}
          type="button"
        >
          <svg
            className="pointer-events-none rtl:rotate-180"
            style={{ 
              color: branding.colors.primary,
              height: `${quickFiltersConfig.style?.arrowIconSize || 24}px`,
              width: `${quickFiltersConfig.style?.arrowIconSize || 24}px`,
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
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
    </div>
    </>
  );
}
