"use client";

/**
 * QuickFilters Component — Grouped Filter Enclosures
 *
 * Categories, collections, and brands are grouped in labeled enclosures.
 * Parent categories become group labels with subcategory cards inside.
 * Collections and brands are each wrapped in their own labeled group.
 * Includes id="quick-filters-section" for StickyQuickFilters integration.
 */

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useQuickFiltersConfig, useFiltersText, useBranding, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import Image from "next/image";
import { useState, useRef, useEffect, type MouseEvent } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: "0px", sm: "0.125rem", md: "0.375rem", lg: "0.5rem",
  xl: "0.75rem", "2xl": "1rem", full: "9999px",
};

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuickFilterItem {
  id: string;
  name: string;
  slug: string;
  type: "category" | "collection" | "brand";
  productCount?: number;
  backgroundImage?: { url: string; alt?: string };
  productImages?: Array<{ url: string; alt?: string }>;
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

/* Grouped rendering model */
interface FilterGroup {
  kind: "group";
  label: string;
  items: QuickFilterItem[];
}

interface StandaloneItem {
  kind: "standalone";
  item: QuickFilterItem;
}

type RenderableUnit = FilterGroup | StandaloneItem;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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
  const cdStyle = useComponentStyle("plp.quickFilters");
  const cdClasses = useComponentClasses("plp.quickFilters");
  const { localization } = config;

  // Extract card style config with branding fallbacks
  const qs = (quickFiltersConfig.style ?? {}) as Record<string, unknown>;
  const primaryColor = branding.colors.primary;
  const cardStyle = {
    bgColor: (qs.cardBackgroundColor as string) ?? "#f5f5f5",
    borderColor: (qs.cardBorderColor as string) ?? "#e5e5e5",
    borderRadius: BORDER_RADIUS_MAP[(qs.cardBorderRadius as string) ?? "xl"] ?? "0.75rem",
    hoverBorderColor: (qs.cardHoverBorderColor as string) ?? "#a3a3a3",
    hoverShadow: SHADOW_MAP[(qs.cardHoverShadow as string) ?? "md"] ?? SHADOW_MAP.md,
    activeBorderColor: (qs.cardActiveBorderColor as string) ?? primaryColor,
    activeBgColor: (qs.cardActiveBgColor as string) ?? primaryColor,
    activeTextColor: (qs.cardActiveTextColor as string) ?? "#ffffff",
    textStripBg: (qs.cardTextStripBg as string) ?? null,
    sectionTitleColor: (qs.sectionTitleColor as string) ?? "#262626",
    arrowBg: (qs.arrowBackgroundColor as string) ?? primaryColor,
    arrowIconColor: (qs.arrowIconColor as string) ?? "#ffffff",
    groupLabelColor: (qs.groupLabelColor as string) ?? "#171717",
    checkBadgeColor: (qs.checkBadgeColor as string) ?? primaryColor,
  };
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

  if (!quickFiltersConfig.enabled) {
    return null;
  }

  const categoryLimit = quickFiltersConfig.categoryLimit;
  const collectionLimit = quickFiltersConfig.collectionLimit;
  const brandLimit = quickFiltersConfig.brandLimit;

  /* ---------------------------------------------------------------- */
  /*  Build grouped render units                                       */
  /* ---------------------------------------------------------------- */

  const renderUnits: RenderableUnit[] = [];

  // Categories: parent with children → group, leaf → standalone
  if (quickFiltersConfig.showCategories) {
    for (const cat of categories.slice(0, categoryLimit)) {
      if (cat.children && cat.children.length > 0) {
        const subcards: QuickFilterItem[] = cat.children
          .filter(sub => sub.name && (sub.productCount === undefined || sub.productCount > 0))
          .map(sub => ({
            id: sub.id,
            name: sub.name!,
            slug: sub.slug,
            type: "category" as const,
            productCount: sub.productCount,
            backgroundImage: sub.backgroundImage,
            productImages: sub.productImages,
          }));

        if (subcards.length > 0) {
          renderUnits.push({ kind: "group", label: cat.name, items: subcards });
        }
      } else {
        renderUnits.push({
          kind: "standalone",
          item: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            type: "category" as const,
            productCount: cat.productCount,
            backgroundImage: cat.backgroundImage,
            productImages: cat.productImages,
          },
        });
      }
    }
  }

  // Collections → single group
  if (quickFiltersConfig.showCollections) {
    const collectionItems: QuickFilterItem[] = collections
      .slice(0, collectionLimit)
      .map(col => ({
        ...col,
        type: "collection" as const,
        backgroundImage: col.backgroundImage,
        productImages: col.productImages,
      }));

    if (collectionItems.length > 0) {
      renderUnits.push({
        kind: "group",
        label: filtersText.collectionPlural || "Collections",
        items: collectionItems,
      });
    }
  }

  // Brands → single group
  if (quickFiltersConfig.showBrands) {
    const brandItems: QuickFilterItem[] = brands
      .slice(0, brandLimit)
      .map(brand => ({
        ...brand,
        type: "brand" as const,
        backgroundImage: brand.backgroundImage,
        productImages: brand.productImages,
      }));

    if (brandItems.length > 0) {
      renderUnits.push({
        kind: "group",
        label: filtersText.brandPlural || "Brands",
        items: brandItems,
      });
    }
  }

  // Flat list for image rotation + empty check
  const allItems: QuickFilterItem[] = renderUnits.flatMap(u =>
    u.kind === "group" ? u.items : [u.item]
  );

  // Stable key for image rotation effect — only re-run when item IDs change
  const allItemIds = allItems.map(i => i.id).join(",");

  /* ---------------------------------------------------------------- */
  /*  Image rotation                                                   */
  /* ---------------------------------------------------------------- */

  const imageSource = (quickFiltersConfig as { imageSource?: string }).imageSource ?? "auto";

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    allItems.forEach((item) => {
      // Only set up rotation for items that will actually display product images
      const willShowProducts =
        imageSource === "product"
          ? true // product mode always prefers product images
          : !item.backgroundImage; // auto/original: only rotate if no original image exists
      if (willShowProducts && item.productImages && item.productImages.length > 1) {
        const imageCount = item.productImages.length;
        const interval = setInterval(() => {
          setCurrentImageIndices((prev: Record<string, number>) => ({
            ...prev,
            [item.id]: ((prev[item.id] || 0) + 1) % imageCount,
          }));
        }, 4000);
        intervals.push(interval);
      }
    });
    return () => intervals.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItemIds, imageSource]);

  /* ---------------------------------------------------------------- */
  /*  Scroll logic                                                     */
  /* ---------------------------------------------------------------- */

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItemIds, isRtl]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const style = (quickFiltersConfig.style || {}) as { cardWidth?: number; cardGap?: number };
    const cardWidthNum = Number(style.cardWidth ?? 160);
    const cardGapNum = Number(style.cardGap ?? 0.5);
    const cardWidth = cardWidthNum + cardGapNum * 8;
    const scrollAmount = cardWidth * 2.5 + 32;
    const currentScroll = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const minScroll = isRtl ? -maxScroll : 0;
    const maxScrollVal = isRtl ? 0 : maxScroll;
    const delta = direction === "left" ? -scrollAmount : scrollAmount;
    const targetScroll = Math.max(minScroll, Math.min(maxScrollVal, currentScroll + delta));
    el.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  if (allItems.length === 0) {
    return null;
  }

  /* ---------------------------------------------------------------- */
  /*  Click & active logic                                             */
  /* ---------------------------------------------------------------- */

  const handleQuickFilterClick = (e: MouseEvent<HTMLButtonElement>, item: QuickFilterItem) => {
    e.preventDefault();
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
  };

  const isActive = (item: QuickFilterItem) => {
    switch (item.type) {
      case "collection":
        return filters.collections.includes(item.slug);
      case "brand":
        return filters.brands.includes(item.slug);
      default:
        return filters.categories.includes(item.slug);
    }
  };

  /** Check if ALL items in a group are currently selected */
  const isGroupAllActive = (items: QuickFilterItem[]) =>
    items.length > 0 && items.every((item) => isActive(item));

  /** Toggle all items in a group: if all selected → deselect all, else select all */
  const handleGroupLabelClick = (items: QuickFilterItem[]) => {
    if (items.length === 0) return;
    const allActive = isGroupAllActive(items);
    const type = items[0].type;
    const slugs = items.map((i) => i.slug);

    switch (type) {
      case "collection": {
        const current = filters.collections;
        const next = allActive
          ? current.filter((s) => !slugs.includes(s))
          : [...new Set([...current, ...slugs])];
        updateFilters({ collections: next });
        break;
      }
      case "brand": {
        const current = filters.brands;
        const next = allActive
          ? current.filter((s) => !slugs.includes(s))
          : [...new Set([...current, ...slugs])];
        updateFilters({ brands: next });
        break;
      }
      default: {
        const current = filters.categories;
        const next = allActive
          ? current.filter((s) => !slugs.includes(s))
          : [...new Set([...current, ...slugs])];
        updateFilters({ categories: next });
        break;
      }
    }
  };

  const getItemImage = (item: QuickFilterItem) => {
    if (imageSource === "product") {
      // Prefer product images (with rotation), fallback to original
      if (item.productImages && item.productImages.length > 0) {
        const currentIndex = currentImageIndices[item.id] || 0;
        return item.productImages[currentIndex];
      }
      return item.backgroundImage ?? null;
    }
    // "original" or "auto": prefer original, fallback to product images
    if (item.backgroundImage) return item.backgroundImage;
    if (item.productImages && item.productImages.length > 0) {
      const currentIndex = currentImageIndices[item.id] || 0;
      return item.productImages[currentIndex];
    }
    return null;
  };

  /** Whether this item should render the multi-image crossfade effect */
  const shouldRotateImages = (item: QuickFilterItem): boolean => {
    if (!item.productImages || item.productImages.length <= 1) return false;
    if (imageSource === "product") return true;
    // auto/original: only rotate if no original image (fallback to products)
    return !item.backgroundImage;
  };

  /* ---------------------------------------------------------------- */
  /*  CardButton                                                       */
  /* ---------------------------------------------------------------- */

  const cardWidthPx = Number((quickFiltersConfig.style as { cardWidth?: number })?.cardWidth ?? 150);

  const CardButton = ({ item }: { item: QuickFilterItem }) => {
    const active = isActive(item);
    const image = getItemImage(item);
    const hasMultipleImages = shouldRotateImages(item);

    return (
      <button
        data-filter-type={item.type}
        data-filter-slug={item.slug}
        data-filter-id={item.id}
        onClick={(e: MouseEvent<HTMLButtonElement>) => handleQuickFilterClick(e, item)}
        className="group relative shrink-0 overflow-hidden transition-all duration-300 h-full border"
        style={{
          width: `${cardWidthPx}px`,
          height: "100%",
          borderRadius: cardStyle.borderRadius,
          borderColor: active ? cardStyle.activeBorderColor : cardStyle.borderColor,
          boxShadow: active ? SHADOW_MAP.md : undefined,
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.borderColor = cardStyle.hoverBorderColor;
            e.currentTarget.style.boxShadow = cardStyle.hoverShadow;
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.borderColor = cardStyle.borderColor;
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      >
        {/* Image area */}
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
                        sizes={`${cardWidthPx}px`}
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
                  sizes={`${cardWidthPx}px`}
                />
              )}
            </>
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundColor: active ? cardStyle.activeBgColor : cardStyle.bgColor }}
            />
          )}
        </div>

        {/* Active check badge */}
        {active && (
          <div
            className="absolute top-2 end-2 z-30 flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
            style={{ backgroundColor: cardStyle.checkBadgeColor }}
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Bottom text strip */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div
            className="px-3 py-2 backdrop-blur-md"
            style={active
              ? { backgroundColor: `${cardStyle.activeBgColor}cc`, color: cardStyle.activeTextColor }
              : { backgroundColor: cardStyle.textStripBg ?? (image ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.9)"), color: image ? "#171717" : "#404040" }
            }
          >
            <h3 className="text-[13px] font-semibold leading-snug line-clamp-1">
              {item.name}
            </h3>
            {item.productCount !== undefined && item.productCount > 0 && (
              <span
                className="mt-0.5 block text-[11px]"
                style={{ opacity: active ? 0.7 : 1, color: active ? cardStyle.activeTextColor : "#737373" }}
              >
                {item.productCount} {filtersText.itemsAvailable || "items"}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const sectionTitle = title || filtersText.checkOutOurProducts || "Shop by Category";
  const labelOverhead = 20;

  return (
    <section
      id="quick-filters-section"
      data-cd="plp-quickFilters"
      className={`relative w-full py-6 ${cdClasses}`}
      style={{ ...buildComponentStyle("plp.quickFilters", cdStyle) }}
    >
      {/* Section Header */}
      <div className="mb-5 px-1">
        <h2
          className="text-lg font-medium tracking-tight"
          style={{ color: cardStyle.sectionTitleColor }}
        >
          {sectionTitle}
        </h2>
        <div className="mt-1.5 h-px w-12" style={{ backgroundColor: cardStyle.sectionTitleColor, opacity: 0.3 }} />
      </div>

      {/* Cards Container */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: `${(quickFiltersConfig.style?.cardHeight || 200) + labelOverhead}px`
        }}
      >
        {/* Left Scroll Arrow */}
        {showLeftArrow && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll(isRtl ? "right" : "left");
            }}
            className="absolute start-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: cardStyle.arrowBg }}
            aria-label={filtersText.scrollLeftAriaLabel}
            type="button"
          >
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" style={{ color: cardStyle.arrowIconColor }} strokeWidth={1.5} />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          dir={isRtl ? "rtl" : "ltr"}
          className="relative flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide h-full px-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollBehavior: "smooth",
          }}
        >
          {renderUnits.map((unit, unitIndex) => {
            const separator = unitIndex > 0 ? (
              <div
                key={`sep-${unitIndex}`}
                className="shrink-0 self-stretch flex items-center px-0.5"
                aria-hidden="true"
              >
                <div className="h-3/5 w-px bg-neutral-200" />
              </div>
            ) : null;

            if (unit.kind === "group") {
              const groupActive = isGroupAllActive(unit.items);
              return (
                <div key={`group-${unitIndex}-${unit.label}`} className="contents">
                  {separator}
                  <div
                    className="shrink-0 flex flex-col"
                    style={{ height: "100%" }}
                    data-filter-group={unit.label}
                    data-filter-group-type={unit.items[0]?.type}
                  >
                    <button
                      type="button"
                      onClick={() => handleGroupLabelClick(unit.items)}
                      className="group/label flex items-center gap-1 mb-1 ps-0.5 text-start"
                      title={groupActive ? (filtersText as Record<string, string>).deselectAll || "Deselect all" : (filtersText as Record<string, string>).selectAll || "Select all"}
                    >
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-200 group-hover/label:underline underline-offset-2 ${
                          groupActive ? "underline" : ""
                        }`}
                        style={{ color: cardStyle.groupLabelColor }}
                      >
                        {unit.label}
                      </span>
                      <Check
                        className={`h-2.5 w-2.5 transition-all duration-200 ${
                          groupActive
                            ? "opacity-100"
                            : "opacity-0 group-hover/label:opacity-100"
                        }`}
                        style={{ color: groupActive ? cardStyle.groupLabelColor : "#a3a3a3" }}
                        strokeWidth={2.5}
                      />
                    </button>
                    <div className="flex-1 flex gap-1">
                      {unit.items.map((item) => (
                        <CardButton key={`${item.type}-${item.id}`} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={`standalone-${unit.item.type}-${unit.item.id}`} className="contents">
                {separator}
                <div
                  className="shrink-0 flex flex-col"
                  style={{ height: "100%" }}
                  data-filter-group={unit.item.name}
                  data-filter-group-type={unit.item.type}
                  data-filter-standalone="true"
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap mb-1 ps-0.5"
                    style={{ color: cardStyle.groupLabelColor }}
                  >
                    {unit.item.name}
                  </span>
                  <div className="flex-1">
                    <CardButton item={unit.item} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        {showRightArrow && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll(isRtl ? "left" : "right");
            }}
            className="absolute end-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: cardStyle.arrowBg }}
            aria-label={filtersText.scrollRightAriaLabel}
            type="button"
          >
            <ChevronRight className="h-5 w-5 rtl:rotate-180" style={{ color: cardStyle.arrowIconColor }} strokeWidth={1.5} />
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
