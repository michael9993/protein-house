"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { useQuickFiltersConfig, useFiltersText } from "@/providers/StoreConfigProvider";
import { X } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";

interface StickyFilterItem {
  id: string;
  name: string;
  slug: string;
  type: "category" | "collection" | "brand";
  /** Comma-separated descendant slugs (including self) for categories with children */
  childrenSlugs?: string[];
}

export function StickyQuickFilters() {
  const filtersText = useFiltersText();
  const quickFiltersConfig = useQuickFiltersConfig();
  const navbarMode = quickFiltersConfig.style?.navbarMode as Record<string, string | number | undefined> | undefined;
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
  const [allItems, setAllItems] = useState<StickyFilterItem[]>([]);

  const SHOW_OFFSET_PX = 20;
  const HEADER_SELECTOR = '[data-scroll-hide="header"]';

  // Extract data from QuickFilters cards in the DOM (including children slugs)
  useEffect(() => {
    const extractQuickFiltersData = (): StickyFilterItem[] => {
      const quickFiltersSection = document.getElementById('quick-filters-section');
      if (!quickFiltersSection) return [];

      const items: StickyFilterItem[] = [];

      const buttons = quickFiltersSection.querySelectorAll('button[data-filter-type]');
      buttons.forEach((button) => {
        const type = button.getAttribute('data-filter-type') as "category" | "collection" | "brand";
        const slug = button.getAttribute('data-filter-slug');
        const id = button.getAttribute('data-filter-id');
        const nameEl = button.querySelector('h3') || button.querySelector('[data-filter-name]');
        const name = nameEl ? nameEl.textContent?.trim() : button.getAttribute('data-filter-name');
        // Read children slugs from data attribute
        const childrenAttr = button.getAttribute('data-filter-children');
        const childrenSlugs = childrenAttr ? childrenAttr.split(",").filter(Boolean) : undefined;

        if (type && slug && id && name) {
          items.push({ id, name, slug, type, childrenSlugs });
        }
      });

      return items;
    };

    const updateItems = () => {
      const items = extractQuickFiltersData();
      setAllItems(items);
    };

    updateItems();

    const observer = new MutationObserver(updateItems);
    const quickFiltersSection = document.getElementById('quick-filters-section');
    if (quickFiltersSection) {
      observer.observe(quickFiltersSection, { childList: true, subtree: true });
    }

    const interval = setInterval(updateItems, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const section = document.getElementById("quick-filters-section");
      if (!section) {
        setShow((prev) => (prev ? false : prev));
        return;
      }
      const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
      const headerHidden = header?.classList.contains("scroll-hide--hidden") ?? false;
      const headerHeight = headerHidden ? 0 : Math.round(header?.getBoundingClientRect().height ?? 0);
      setTopOffset((prev) => (prev === headerHeight ? prev : headerHeight));
      const rect = section.getBoundingClientRect();
      const scrolledPast = rect.bottom <= headerHeight + SHOW_OFFSET_PX;
      setShow((prev) => (prev === scrolledPast ? prev : scrolledPast));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const onResize = () => {
      update();
    };

    requestAnimationFrame(update);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      update();
    });
    const section = document.getElementById("quick-filters-section");
    if (section) resizeObserver.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
    };
  }, []);

  if (allItems.length === 0) return null;

  // Toggle with children support - mirrors QuickFilters logic
  // Only toggles sub-categories, not the parent itself
  const handleQuickFilterClick = (e: MouseEvent<HTMLButtonElement>, item: StickyFilterItem) => {
    e.preventDefault();

    if (item.type === "category" && item.childrenSlugs && item.childrenSlugs.length > 0) {
      // Parent category with children - only toggle sub-category slugs (not parent)
      const allChildSlugs = item.childrenSlugs;
      const currentCategories = filters.categories;
      const allSelected = allChildSlugs.every(slug => currentCategories.includes(slug));

      if (allSelected) {
        // Deselect all children
        const updated = currentCategories.filter(slug => !allChildSlugs.includes(slug));
        updateFilters({ categories: updated });
      } else {
        // Select all children
        const slugsToAdd = allChildSlugs.filter(slug => !currentCategories.includes(slug));
        const updated = [...currentCategories, ...slugsToAdd];
        updateFilters({ categories: updated });
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

  // isActive with children support - mirrors QuickFilters logic
  const isActive = (item: StickyFilterItem) => {
    switch (item.type) {
      case "collection":
        return filters.collections.includes(item.slug);
      case "brand":
        return filters.brands.includes(item.slug);
      default:
        if (filters.categories.includes(item.slug)) return true;
        // Check children - if any sub-category is selected, parent shows as active
        if (item.childrenSlugs && item.childrenSlugs.length > 0) {
          return item.childrenSlugs.some(slug => filters.categories.includes(slug));
        }
        return false;
    }
  };

  // Group by type
  const categoriesList = allItems.filter(item => item.type === "category");
  const collectionsList = allItems.filter(item => item.type === "collection");
  const brandsList = allItems.filter(item => item.type === "brand");
  const groups = [
    { items: categoriesList, label: filtersText.categoryPlural },
    { items: collectionsList, label: filtersText.collectionPlural },
    { items: brandsList, label: filtersText.brandPlural },
  ].filter(group => group.items.length > 0);

  if (!show) return null;

  // Styling defaults
  const buttonPaddingX = navbarMode?.buttonPaddingX ?? 14;
  const buttonPaddingY = navbarMode?.buttonPaddingY ?? 6;
  const buttonFontSize = navbarMode?.buttonFontSize ?? "xs";
  const buttonFontWeight = navbarMode?.buttonFontWeight ?? "medium";
  const buttonBorderRadius = navbarMode?.buttonBorderRadius ?? "full";
  const buttonGap = navbarMode?.buttonGap ?? 8;
  const groupLabelFontSize = navbarMode?.groupLabelFontSize ?? "xs";
  const groupLabelPaddingX = navbarMode?.groupLabelPaddingX ?? 8;
  const groupLabelPaddingY = navbarMode?.groupLabelPaddingY ?? 4;
  const separatorWidth = navbarMode?.separatorWidth ?? 1;
  const separatorHeight = navbarMode?.separatorHeight ?? 24;
  const containerPaddingY = navbarMode?.containerPaddingY ?? 10;

  const fontSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
  };
  const fontWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  // Helper: slugToLabel - capitalize each word from slug
  const slugToLabel = (slug: string) =>
    slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

  // Build ALL active filter tags directly from URL state
  // Each individual slug gets its own removable tag
  const activeFilterTags: Array<{ key: string; label: string; onRemove: () => void }> = [];

  // All active categories (individual sub-categories, not parents)
  filters.categories.forEach((slug) => {
    activeFilterTags.push({
      key: `cat-${slug}`,
      label: slugToLabel(slug),
      onRemove: () => toggleCategory(slug),
    });
  });

  // All active collections
  filters.collections.forEach((slug) => {
    // Try to find display name from quick filter items
    const item = allItems.find(i => i.type === "collection" && i.slug === slug);
    activeFilterTags.push({
      key: `col-${slug}`,
      label: item?.name || slugToLabel(slug),
      onRemove: () => toggleCollection(slug),
    });
  });

  // All active brands
  filters.brands.forEach((slug) => {
    const item = allItems.find(i => i.type === "brand" && i.slug === slug);
    activeFilterTags.push({
      key: `brand-${slug}`,
      label: item?.name || slugToLabel(slug),
      onRemove: () => toggleBrand(slug),
    });
  });

  // Sizes
  filters.sizes.forEach((slug) => {
    activeFilterTags.push({
      key: `size-${slug}`,
      label: slugToLabel(slug),
      onRemove: () => toggleSize(slug),
    });
  });

  // Colors
  filters.colors.forEach((slug) => {
    activeFilterTags.push({
      key: `color-${slug}`,
      label: slugToLabel(slug),
      onRemove: () => toggleColor(slug),
    });
  });

  // In stock
  if (filters.inStock) {
    activeFilterTags.push({
      key: "in-stock",
      label: filtersText.inStockOnly || "In Stock",
      onRemove: () => toggleInStock(),
    });
  }

  // On sale
  if (filters.onSale) {
    activeFilterTags.push({
      key: "on-sale",
      label: filtersText.onSale || "On Sale",
      onRemove: () => toggleOnSale(),
    });
  }

  // Price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin;
    const max = filters.priceMax;
    let label = "Price";
    if (min !== undefined && max !== undefined) {
      label = `${min} - ${max}`;
    } else if (min !== undefined) {
      label = `From ${min}`;
    } else if (max !== undefined) {
      label = `Up to ${max}`;
    }
    activeFilterTags.push({
      key: "price",
      label,
      onRemove: () => updateFilters({ priceMin: undefined, priceMax: undefined }),
    });
  }

  // Rating
  if (filters.rating !== undefined && filters.rating !== null) {
    activeFilterTags.push({
      key: "rating",
      label: `${filters.rating}+ ${filtersText.starsAndUp || "Stars"}`,
      onRemove: () => updateFilters({ rating: undefined }),
    });
  }

  const hasActiveFilterTags = activeFilterTags.length > 0;

  return (
    <div
      data-sticky-quick-filters
      className="fixed inset-x-0 z-[60] w-full border-b border-neutral-200/60 bg-white/95 backdrop-blur-sm animate-fade-in-up"
      style={{
        top: `${topOffset}px`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Quick filter buttons row */}
      <div
        className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16"
        style={{
          paddingTop: `${containerPaddingY}px`,
          paddingBottom: hasActiveFilterTags ? "6px" : `${containerPaddingY}px`,
        }}
      >
        <div
          className="flex items-center overflow-x-auto scrollbar-hide md:justify-center"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            gap: `${buttonGap}px`,
          }}
        >
          {groups.map((group, groupIndex) => (
            <div
              key={group.label}
              className="flex items-center shrink-0"
              style={{ gap: `${buttonGap}px` }}
            >
              {groupIndex > 0 && (
                <div
                  className="shrink-0 bg-neutral-200"
                  style={{
                    width: `${separatorWidth}px`,
                    height: `${separatorHeight}px`,
                  }}
                />
              )}

              {/* Group label */}
              <span
                className={`${fontSizeClasses[groupLabelFontSize as keyof typeof fontSizeClasses]} font-semibold uppercase tracking-wider rounded shrink-0 whitespace-nowrap text-neutral-800 bg-neutral-100 border border-neutral-200`}
                style={{
                  paddingLeft: `${groupLabelPaddingX}px`,
                  paddingRight: `${groupLabelPaddingX}px`,
                  paddingTop: `${groupLabelPaddingY}px`,
                  paddingBottom: `${groupLabelPaddingY}px`,
                }}
              >
                {group.label}
              </span>

              {/* Group items */}
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={`sticky-${item.type}-${item.id}`}
                    onClick={(e) => handleQuickFilterClick(e, item)}
                    className={`shrink-0 ${fontSizeClasses[buttonFontSize as keyof typeof fontSizeClasses]} ${fontWeightClasses[buttonFontWeight as keyof typeof fontWeightClasses]} ${borderRadiusClasses[buttonBorderRadius as keyof typeof borderRadiusClasses]} transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200"
                    }`}
                    style={{
                      minWidth: "fit-content",
                      paddingLeft: `${buttonPaddingX}px`,
                      paddingRight: `${buttonPaddingX}px`,
                      paddingTop: `${buttonPaddingY}px`,
                      paddingBottom: `${buttonPaddingY}px`,
                    }}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Active filter tags row - shows each individual active filter */}
      {hasActiveFilterTags && (
        <div className="border-t border-neutral-100 bg-neutral-50/80">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-1.5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
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

              {/* All active filter tags - each slug is its own removable tag */}
              {activeFilterTags.map((tag) => (
                <span
                  key={tag.key}
                  className="inline-flex items-center gap-1 shrink-0 rounded-full bg-neutral-900 text-white text-[11px] font-medium px-2.5 py-0.5"
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
    </div>
  );
}
