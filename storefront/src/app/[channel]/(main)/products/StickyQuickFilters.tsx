"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useQuickFiltersConfig, useFiltersText, useBranding, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StickyFilterItem {
  id: string;
  name: string;
  slug: string;
  type: "category" | "collection" | "brand";
}

interface StickyFilterGroup {
  label: string;
  type: "category" | "collection" | "brand";
  items: StickyFilterItem[];
  standalone: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StickyQuickFilters() {
  const filtersText = useFiltersText();
  const quickFiltersConfig = useQuickFiltersConfig();
  const config = useStoreConfig();
  const branding = useBranding();
  const cdStyle = useComponentStyle("plp.quickFilters");
  const cdClasses = useComponentClasses("plp.quickFilters");
  const primaryColor = branding.colors.primary;
  const { localization } = config;

  // RTL detection — same logic as QuickFilters
  const isRtl = localization?.direction === 'rtl' ||
    (localization?.direction === 'auto' &&
     (localization?.rtlLocales || ['he', 'ar', 'fa', 'ur', 'yi', 'ps']).some(
       rtl => localization?.defaultLocale?.toLowerCase().startsWith(rtl.toLowerCase())
     ));

  const {
    filters,
    hasFilters,
    filterCount,
    toggleCategory,
    toggleCollection,
    toggleBrand,
    toggleSize,
    toggleColor,
    toggleInStock,
    toggleOnSale,
    updateFilters,
    clearAll,
  } = useProductFilters();
  const [show, setShow] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const [groups, setGroups] = useState<StickyFilterGroup[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const SHOW_OFFSET_PX = 20;
  const HEADER_SELECTOR = '[data-scroll-hide="header"]';

  /* ---------------------------------------------------------------- */
  /*  Scroll arrows                                                    */
  /* ---------------------------------------------------------------- */

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 2) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }
    if (isRtl) {
      // RTL: scrollLeft starts at 0 and goes negative
      const rtlMin = -maxScroll;
      setCanScrollStart(scrollLeft < -4);
      setCanScrollEnd(scrollLeft > rtlMin + 4);
    } else {
      setCanScrollStart(scrollLeft > 4);
      setCanScrollEnd(scrollLeft < maxScroll - 4);
    }
  }, [isRtl]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [groups, show, checkScroll]);

  /** Scroll in a visual direction ("left"/"right"), clamped to bounds */
  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    const currentScroll = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const minScroll = isRtl ? -maxScroll : 0;
    const maxScrollVal = isRtl ? 0 : maxScroll;
    const delta = direction === "left" ? -amount : amount;
    const target = Math.max(minScroll, Math.min(maxScrollVal, currentScroll + delta));
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  /* ---------------------------------------------------------------- */
  /*  Extract grouped data from QuickFilters DOM                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const extractGroups = (): StickyFilterGroup[] => {
      const section = document.getElementById("quick-filters-section");
      if (!section) return [];

      const result: StickyFilterGroup[] = [];
      const groupEls = section.querySelectorAll("[data-filter-group]");

      groupEls.forEach((groupEl) => {
        const label = groupEl.getAttribute("data-filter-group") || "";
        const groupType = (groupEl.getAttribute("data-filter-group-type") || "category") as StickyFilterItem["type"];
        const standalone = groupEl.hasAttribute("data-filter-standalone");

        const items: StickyFilterItem[] = [];
        const buttons = groupEl.querySelectorAll("button[data-filter-type]");
        buttons.forEach((btn) => {
          const type = btn.getAttribute("data-filter-type") as StickyFilterItem["type"];
          const slug = btn.getAttribute("data-filter-slug");
          const id = btn.getAttribute("data-filter-id");
          const nameEl = btn.querySelector("h3");
          const name = nameEl?.textContent?.trim() || "";
          if (type && slug && id && name) {
            items.push({ id, name, slug, type });
          }
        });

        if (items.length > 0) {
          result.push({ label, type: groupType, items, standalone });
        }
      });

      return result;
    };

    const update = () => setGroups(extractGroups());
    update();

    const observer = new MutationObserver(update);
    const section = document.getElementById("quick-filters-section");
    if (section) observer.observe(section, { childList: true, subtree: true });
    const interval = setInterval(update, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Show/hide on scroll                                              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const section = document.getElementById("quick-filters-section");
      if (!section) {
        setShow(false);
        return;
      }
      const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
      const headerHidden = header?.classList.contains("scroll-hide--hidden") ?? false;
      const headerHeight = headerHidden ? 0 : Math.round(header?.getBoundingClientRect().height ?? 0);
      setTopOffset(headerHeight);
      const rect = section.getBoundingClientRect();
      setShow(rect.bottom <= headerHeight + SHOW_OFFSET_PX);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    const section = document.getElementById("quick-filters-section");
    if (section) resizeObserver.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Flat items list for name lookup                                  */
  /* ---------------------------------------------------------------- */

  const allItems = groups.flatMap((g) => g.items);

  if (allItems.length === 0 || !show) return null;

  /* ---------------------------------------------------------------- */
  /*  Click & active logic                                             */
  /* ---------------------------------------------------------------- */

  const handleItemClick = (e: MouseEvent<HTMLButtonElement>, item: StickyFilterItem) => {
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

  const isActive = (item: StickyFilterItem) => {
    switch (item.type) {
      case "collection":
        return filters.collections.includes(item.slug);
      case "brand":
        return filters.brands.includes(item.slug);
      default:
        return filters.categories.includes(item.slug);
    }
  };

  const isGroupAllActive = (group: StickyFilterGroup) =>
    group.items.length > 0 && group.items.every((item) => isActive(item));

  const handleGroupLabelClick = (group: StickyFilterGroup) => {
    if (group.items.length === 0) return;
    const allActive = isGroupAllActive(group);
    const slugs = group.items.map((i) => i.slug);

    switch (group.type) {
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

  /* ---------------------------------------------------------------- */
  /*  Active filter tags (from URL state)                              */
  /* ---------------------------------------------------------------- */

  const slugToLabel = (slug: string) =>
    slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

  const activeFilterTags: Array<{ key: string; label: string; onRemove: () => void }> = [];

  filters.categories.forEach((slug) => {
    const item = allItems.find((i) => i.type === "category" && i.slug === slug);
    activeFilterTags.push({
      key: `cat-${slug}`,
      label: item?.name || slugToLabel(slug),
      onRemove: () => toggleCategory(slug),
    });
  });

  filters.collections.forEach((slug) => {
    const item = allItems.find((i) => i.type === "collection" && i.slug === slug);
    activeFilterTags.push({
      key: `col-${slug}`,
      label: item?.name || slugToLabel(slug),
      onRemove: () => toggleCollection(slug),
    });
  });

  filters.brands.forEach((slug) => {
    const item = allItems.find((i) => i.type === "brand" && i.slug === slug);
    activeFilterTags.push({
      key: `brand-${slug}`,
      label: item?.name || slugToLabel(slug),
      onRemove: () => toggleBrand(slug),
    });
  });

  filters.sizes.forEach((slug) => {
    activeFilterTags.push({
      key: `size-${slug}`,
      label: slugToLabel(slug),
      onRemove: () => toggleSize(slug),
    });
  });

  filters.colors.forEach((slug) => {
    activeFilterTags.push({
      key: `color-${slug}`,
      label: slugToLabel(slug),
      onRemove: () => toggleColor(slug),
    });
  });

  if (filters.inStock) {
    activeFilterTags.push({
      key: "in-stock",
      label: filtersText.inStockOnly || "In Stock",
      onRemove: () => toggleInStock(),
    });
  }

  if (filters.onSale) {
    activeFilterTags.push({
      key: "on-sale",
      label: filtersText.onSale || "On Sale",
      onRemove: () => toggleOnSale(),
    });
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin;
    const max = filters.priceMax;
    let label = filtersText.priceTitle || "Price";
    if (min !== undefined && max !== undefined) label = `${min} - ${max}`;
    else if (min !== undefined) label = `${filtersText.priceFromLabel || "From"} ${min}`;
    else if (max !== undefined) label = `${filtersText.priceUpToLabel || "Up to"} ${max}`;
    activeFilterTags.push({
      key: "price",
      label,
      onRemove: () => updateFilters({ priceMin: undefined, priceMax: undefined }),
    });
  }

  if (filters.rating !== undefined && filters.rating !== null) {
    activeFilterTags.push({
      key: "rating",
      label: `${filters.rating}+ ${filtersText.starsAndUp || "Stars"}`,
      onRemove: () => updateFilters({ rating: undefined }),
    });
  }

  const hasActiveFilterTags = activeFilterTags.length > 0;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      data-sticky-quick-filters
      data-cd="plp-quickFilters"
      className={`fixed inset-x-0 z-[60] w-full border-b border-neutral-200/60 bg-white/95 backdrop-blur-sm animate-fade-in-up ${cdClasses}`}
      style={{
        top: `${topOffset}px`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        ...buildComponentStyle("plp.quickFilters", cdStyle),
      }}
    >
      {/* Quick filter chips — horizontally scrollable */}
      <div
        className="relative mx-auto max-w-[1920px]"
        style={{ paddingTop: "8px", paddingBottom: hasActiveFilterTags ? "4px" : "8px" }}
      >
        {/* Start-side arrow (left in LTR, right in RTL) */}
        {canScrollStart && (
          <button
            type="button"
            onClick={() => scroll(isRtl ? "right" : "left")}
            className="absolute start-0 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            <ChevronLeft className="h-4 w-4 text-white rtl:rotate-180" strokeWidth={2} />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          dir={isRtl ? "rtl" : "ltr"}
          className="flex items-center gap-1.5 overflow-x-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
        >
          {groups.map((group, gi) => {
            const groupActive = isGroupAllActive(group);
            return (
              <div
                key={group.label}
                className="flex items-center gap-1.5 shrink-0"
              >
                {/* Separator between groups */}
                {gi > 0 && (
                  <div className="shrink-0 h-5 w-px bg-neutral-200 mx-0.5" />
                )}

                {/* Group label — clickable to select/deselect all */}
                {!group.standalone && (
                  <button
                    type="button"
                    onClick={() => handleGroupLabelClick(group)}
                    className={`group/glabel shrink-0 flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                      groupActive
                        ? "text-white"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200"
                    }`}
                    style={groupActive ? { backgroundColor: primaryColor } : undefined}
                    title={groupActive ? (filtersText as Record<string, string>).deselectAll || "Deselect all" : (filtersText as Record<string, string>).selectAll || "Select all"}
                  >
                    {group.label}
                    <Check
                      className={`h-2.5 w-2.5 transition-opacity duration-200 ${
                        groupActive
                          ? "opacity-100"
                          : "opacity-0 group-hover/glabel:opacity-60"
                      }`}
                      strokeWidth={2.5}
                    />
                  </button>
                )}

                {/* Individual item chips */}
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <button
                      key={`sticky-${item.type}-${item.id}`}
                      onClick={(e) => handleItemClick(e, item)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        active
                          ? "text-white"
                          : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200"
                      }`}
                      style={active ? { backgroundColor: primaryColor } : undefined}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* End-side arrow (right in LTR, left in RTL) */}
        {canScrollEnd && (
          <button
            type="button"
            onClick={() => scroll(isRtl ? "left" : "right")}
            className="absolute end-0 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            <ChevronRight className="h-4 w-4 text-white rtl:rotate-180" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Active filter tags row — also scrollable */}
      {hasActiveFilterTags && (
        <div className="border-t border-neutral-100 bg-neutral-50/80">
          <div className="mx-auto max-w-[1920px] px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-1.5">
            <div
              className="flex items-center gap-1.5 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Active count + clear */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  {filterCount} {filtersText.activeFiltersLabel || "Active"}
                </span>
                <button
                  onClick={clearAll}
                  className="text-[11px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors underline underline-offset-2"
                >
                  {filtersText.clearAllButton || "Clear all"}
                </button>
                <div className="h-3.5 w-px bg-neutral-200 shrink-0" />
              </div>

              {/* Tags */}
              {activeFilterTags.map((tag) => (
                <span
                  key={tag.key}
                  className="inline-flex items-center gap-1 shrink-0 rounded-full text-white text-[11px] font-medium px-2.5 py-0.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tag.label}
                  <button
                    onClick={tag.onRemove}
                    className="flex items-center justify-center rounded-full hover:bg-white/20 transition-colors h-3.5 w-3.5"
                    aria-label={`Remove ${tag.label}`}
                  >
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        div[ref] ::-webkit-scrollbar,
        div ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
