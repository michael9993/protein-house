"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useQuickFiltersConfig, useFiltersText } from "@/providers/StoreConfigProvider";
import { type MouseEvent, useEffect, useState } from "react";

export function StickyQuickFilters() {
  const { branding } = useStoreConfig();
  const filtersText = useFiltersText();
  const quickFiltersConfig = useQuickFiltersConfig();
  const navbarMode = quickFiltersConfig.style?.navbarMode;
  const { filters, toggleCategory, toggleCollection, toggleBrand } = useProductFilters();
  const [show, setShow] = useState(false);
  const [allItems, setAllItems] = useState<Array<{ id: string; name: string; slug: string; type: "category" | "collection" | "brand" }>>([]);

  // Extract data from QuickFilters cards in the DOM
  useEffect(() => {
    const extractQuickFiltersData = () => {
      const quickFiltersSection = document.getElementById('quick-filters-section');
      if (!quickFiltersSection) return [];

      const items: Array<{ id: string; name: string; slug: string; type: "category" | "collection" | "brand" }> = [];
      
      // Find all quick filter buttons
      const buttons = quickFiltersSection.querySelectorAll('button[data-filter-type]');
      buttons.forEach((button) => {
        const type = button.getAttribute('data-filter-type') as "category" | "collection" | "brand";
        const slug = button.getAttribute('data-filter-slug');
        const id = button.getAttribute('data-filter-id');
        const name = button.textContent?.trim();
        
        if (type && slug && id && name) {
          items.push({ id, name, slug, type });
        }
      });

      return items;
    };

    // Extract data when component mounts and when DOM updates
    const updateItems = () => {
      const items = extractQuickFiltersData();
      setAllItems(items);
    };

    updateItems();
    
    // Use MutationObserver to detect when QuickFilters cards are added/updated
    const observer = new MutationObserver(updateItems);
    const quickFiltersSection = document.getElementById('quick-filters-section');
    if (quickFiltersSection) {
      observer.observe(quickFiltersSection, { childList: true, subtree: true });
    }

    // Also check periodically in case MutationObserver misses updates
    const interval = setInterval(updateItems, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const calculateHeaderHeight = () => {
      const header = document.querySelector('header');
      return header ? header.getBoundingClientRect().height : 64;
    };

    const handleScroll = () => {
      const quickFiltersSection = document.getElementById('quick-filters-section');
      if (!quickFiltersSection) {
        setShow(false);
        return;
      }
      const rect = quickFiltersSection.getBoundingClientRect();
      const currentHeaderHeight = calculateHeaderHeight();
      // Show sticky filters when the quick filters section is almost completely scrolled past
      // Trigger when the bottom of the section is near the header (about 90% scrolled)
      const sectionHeight = rect.height;
      // Show when the section bottom is close to the header (within 50px or 90% scrolled)
      const threshold = Math.min(50, sectionHeight * 0.1); // 50px or 10% of section height
      const isOutOfView = rect.bottom <= (currentHeaderHeight + threshold);
      setShow(isOutOfView);
    };

    calculateHeaderHeight();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (allItems.length === 0) return null;

  const handleQuickFilterClick = (e: MouseEvent<HTMLButtonElement>, item: typeof allItems[0]) => {
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

  const isActive = (item: typeof allItems[0]) => {
    switch (item.type) {
      case "collection":
        return filters.collections.includes(item.slug);
      case "brand":
        return filters.brands.includes(item.slug);
      default:
        return filters.categories.includes(item.slug);
    }
  };

  // Group by type - use filter text config for labels
  const categoriesList = allItems.filter(item => item.type === "category");
  const collectionsList = allItems.filter(item => item.type === "collection");
  const brandsList = allItems.filter(item => item.type === "brand");
  const groups = [
    { items: categoriesList, label: filtersText.categoryPlural },
    { items: collectionsList, label: filtersText.collectionPlural },
    { items: brandsList, label: filtersText.brandPlural },
  ].filter(group => group.items.length > 0);

  if (!show) return null;

  // Get navbar mode styling with defaults
  const buttonPaddingX = navbarMode?.buttonPaddingX ?? 14; // px-3.5
  const buttonPaddingY = navbarMode?.buttonPaddingY ?? 6;  // py-1.5
  const buttonFontSize = navbarMode?.buttonFontSize ?? "xs";
  const buttonFontWeight = navbarMode?.buttonFontWeight ?? "semibold";
  const buttonBorderRadius = navbarMode?.buttonBorderRadius ?? "full";
  const buttonGap = navbarMode?.buttonGap ?? 8; // gap-2
  const groupLabelFontSize = navbarMode?.groupLabelFontSize ?? "xs";
  const groupLabelPaddingX = navbarMode?.groupLabelPaddingX ?? 8; // px-2
  const groupLabelPaddingY = navbarMode?.groupLabelPaddingY ?? 4; // py-1
  const separatorWidth = navbarMode?.separatorWidth ?? 1; // w-px
  const separatorHeight = navbarMode?.separatorHeight ?? 24; // h-6
  const containerPaddingY = navbarMode?.containerPaddingY ?? 10; // py-2.5
  const containerBg = navbarMode?.backgroundColor ?? "#FFFFFF";
  const borderTopColor = navbarMode?.borderTopColor ?? `${branding.colors.textMuted}15`;
  const borderBottomColor = navbarMode?.borderBottomColor ?? `${branding.colors.primary}20`;
  const shadowColor = navbarMode?.shadowColor ?? "rgba(0, 0, 0, 0.08)";

  // Font size classes
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

  return (
    <div 
      className="w-full border-t border-b shadow-lg animate-fade-in-up"
      style={{
        backgroundColor: containerBg,
        borderTopColor,
        borderBottomColor,
        boxShadow: `0 4px 12px ${shadowColor}`,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: `${containerPaddingY}px`,
        paddingBottom: `${containerPaddingY}px`,
      }}
    >
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
              {/* Separator before group (except first) */}
              {groupIndex > 0 && (
                <div 
                  className="shrink-0"
                  style={{ 
                    width: `${separatorWidth}px`,
                    height: `${separatorHeight}px`,
                    backgroundColor: `${branding.colors.primary}30` 
                  }}
                />
              )}
              
              {/* Group label */}
              <span 
                className={`${fontSizeClasses[groupLabelFontSize]} ${fontWeightClasses.bold} uppercase tracking-wider rounded shrink-0 whitespace-nowrap`}
                style={{
                  color: branding.colors.primary,
                  backgroundColor: `${branding.colors.primary}10`,
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
                    className={`shrink-0 ${fontSizeClasses[buttonFontSize]} ${fontWeightClasses[buttonFontWeight]} ${borderRadiusClasses[buttonBorderRadius]} transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      active
                        ? "text-white shadow-md"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200"
                    }`}
                    style={{
                      backgroundColor: active ? branding.colors.primary : undefined,
                      borderColor: active ? branding.colors.primary : undefined,
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
    </div>
  );
}

