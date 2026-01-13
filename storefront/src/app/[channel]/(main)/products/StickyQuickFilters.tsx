"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { storeConfig } from "@/config";
import { type MouseEvent, useEffect, useState } from "react";

export function StickyQuickFilters() {
  const { branding } = storeConfig;
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

  // Group by type
  const categoriesList = allItems.filter(item => item.type === "category");
  const collectionsList = allItems.filter(item => item.type === "collection");
  const brandsList = allItems.filter(item => item.type === "brand");
  const groups = [
    { items: categoriesList, label: "Categories" },
    { items: collectionsList, label: "Collections" },
    { items: brandsList, label: "Brands" },
  ].filter(group => group.items.length > 0);

  if (!show) return null;

  return (
    <div 
      className="w-full bg-white border-t border-b shadow-lg animate-fade-in-up"
      style={{
        borderTopColor: `${branding.colors.textMuted}15`,
        borderBottomColor: `${branding.colors.primary}20`,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.08)`,
        marginTop: 0,
        marginBottom: 0,
      }}
    >
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center gap-3 py-2.5 overflow-x-auto scrollbar-hide md:justify-center" style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>
          {groups.map((group, groupIndex) => (
            <div key={group.label} className="flex items-center gap-2 shrink-0">
              {/* Separator before group (except first) */}
              {groupIndex > 0 && (
                <div 
                  className="h-6 w-px shrink-0"
                  style={{ backgroundColor: `${branding.colors.primary}30` }}
                />
              )}
              
              {/* Group label */}
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0 whitespace-nowrap"
                style={{
                  color: branding.colors.primary,
                  backgroundColor: `${branding.colors.primary}10`,
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
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      active
                        ? "text-white shadow-md"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200"
                    }`}
                    style={{
                      backgroundColor: active ? branding.colors.primary : undefined,
                      borderColor: active ? branding.colors.primary : undefined,
                      minWidth: "fit-content",
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

