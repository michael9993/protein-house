"use client";

/**
 * ProductFilters Component
 * 
 * Renders filter UI for products. Uses useProductFilters hook which
 * ensures URL is the single source of truth - NO local state duplication.
 * 
 * Config-driven: Uses StoreConfig from context for filter visibility/settings.
 */

import React, { useState, useRef, useEffect, type ReactNode, type ChangeEvent } from "react";
import { useFiltersConfig, useFiltersText, useContentConfig, useFilterSidebarConfig } from "@/providers/StoreConfigProvider";
import { useProductFilters } from "@/hooks/useProductFilters";
import { PriceRangeFilter } from "./PriceRangeFilter";
import { RatingFilter } from "./RatingFilter";

// ============================================================================
// Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  children?: Category[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface Size {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface Color {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface ProductFiltersProps {
  categories?: Category[];
  collections?: Collection[];
  brands?: Brand[];
  sizes?: Size[];
  colors?: Color[];
  channel?: string;
  minPrice?: number;
  maxPrice?: number;
  currencyCode?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================


function getChildCategorySlugs(category: Category): string[] {
  const slugs: string[] = [];
  if (category.children && category.children.length > 0) {
    category.children.forEach(child => {
      slugs.push(child.slug);
      slugs.push(...getChildCategorySlugs(child));
    });
  }
  return slugs;
}

function areAllChildrenSelected(category: Category, selectedSlugs: string[]): boolean {
  if (!category.children || category.children.length === 0) {
    // If no children, check if the category itself is selected
    return selectedSlugs.includes(category.slug);
  }
  
  // Check if all direct children are selected
  const allChildrenSelected = category.children.every(child => 
    selectedSlugs.includes(child.slug) || areAllChildrenSelected(child, selectedSlugs)
  );
  
  return allChildrenSelected;
}

function areSomeChildrenSelected(category: Category, selectedSlugs: string[]): boolean {
  if (!category.children || category.children.length === 0) {
    return false;
  }
  
  // Check if at least one child is selected
  return category.children.some(child => 
    selectedSlugs.includes(child.slug) || 
    isCategoryOrChildSelected(child, selectedSlugs)
  );
}

function isCategoryOrChildSelected(category: Category, selectedSlugs: string[]): boolean {
  if (selectedSlugs.includes(category.slug)) return true;
  if (category.children) {
    return category.children.some(child => isCategoryOrChildSelected(child, selectedSlugs));
  }
  return false;
}

// ============================================================================
// Main Component
// ============================================================================

export function ProductFilters({ 
  categories = [], 
  collections = [],
  brands = [],
  sizes = [],
  colors = [],
  channel,
  minPrice,
  maxPrice,
  currencyCode,
}: ProductFiltersProps) {
  // Use config from context (per-channel)
  const filtersConfig = useFiltersConfig();
  const filtersText = useFiltersText();
  const content = useContentConfig();
  const fsConfig = useFilterSidebarConfig();
  // Use same labels as nav Shop All dropdown when navbar labels are set (categories → collections → brands)
  const categoriesLabel = content.navbar?.categoriesLabel ?? filtersText.categoryTitle;
  const collectionsLabel = content.navbar?.collectionsLabel ?? filtersText.collectionTitle;
  const brandsLabel = content.navbar?.brandsLabel ?? filtersText.brandTitle;
  
  // Debug: Log sizes when component receives them
  useEffect(() => {
    if (sizes.length > 0) {
      console.log("[ProductFilters] Received sizes:", sizes.length, sizes.map(s => `${s.name} (${s.slug})`));
    } else {
      console.log("[ProductFilters] No sizes received");
    }
  }, [sizes]);
  
  // Use the centralized hook - URL is source of truth
  const {
    filters,
    hasFilters,
    toggleCollection,
    toggleBrand,
    toggleSize,
    toggleColor,
    toggleInStock,
    toggleOnSale,
    clearAll,
    updateFilters,
    isCategorySelected,
    isCollectionSelected,
    isBrandSelected,
    isSizeSelected,
    isColorSelected,
  } = useProductFilters();


  // Load expanded sections from localStorage
  const loadExpandedSections = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("saleor_filter_expanded_sections");
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  };

  // UI-only state for section expansion (not filter state) - Load from localStorage
  const [expandedSections, setExpandedSections] = useState<string[]>(loadExpandedSections);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => 
    categories.filter(c => c.children && c.children.length > 0).map(c => c.slug)
  );

  // Save expanded sections to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("saleor_filter_expanded_sections", JSON.stringify(expandedSections));
      } catch (error) {
        console.warn("Failed to save expanded sections:", error);
      }
    }
  }, [expandedSections]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev: string[]) =>
      prev.includes(section)
        ? prev.filter((s: string) => s !== section)
        : [...prev, section]
    );
  };

  const toggleCategoryExpand = (categorySlug: string) => {
    setExpandedCategories((prev: string[]) =>
      prev.includes(categorySlug)
        ? prev.filter((s: string) => s !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  // Handle category selection
  const handleCategoryChange = (category: Category, isChecked: boolean) => {
    const currentCategories = [...filters.categories];
    let updatedCategories: string[];
    
    if (category.children && category.children.length > 0) {
      // For categories with children: toggle all children, not the parent itself
      const childSlugs = getChildCategorySlugs(category);
      
      if (isChecked) {
        // Add all child slugs that aren't already selected
        const slugsToAdd = childSlugs.filter(slug => !currentCategories.includes(slug));
        updatedCategories = [...currentCategories, ...slugsToAdd];
      } else {
        // Remove all child slugs
        updatedCategories = currentCategories.filter(slug => !childSlugs.includes(slug));
      }
    } else {
      // For categories without children: toggle the category itself
      if (isChecked) {
        if (!currentCategories.includes(category.slug)) {
          updatedCategories = [...currentCategories, category.slug];
        } else {
          return; // Already selected, no change needed
        }
      } else {
        updatedCategories = currentCategories.filter(slug => slug !== category.slug);
      }
    }
    
    // Single update instead of multiple toggles
    if (updatedCategories.length !== currentCategories.length) {
      updateFilters({ categories: updatedCategories });
    }
  };

  // Render category with children
  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.includes(category.slug);
    
    // For categories with children: checked if ALL children are selected
    // For categories without children: checked if the category itself is selected
    const isChecked = hasChildren 
      ? areAllChildrenSelected(category, filters.categories)
      : isCategorySelected(category.slug);
    
    // Partially checked if SOME but not ALL children are selected
    const isPartiallyChecked = hasChildren && 
      areSomeChildrenSelected(category, filters.categories) && 
      !areAllChildrenSelected(category, filters.categories);

    return (
      <div key={category.slug} className={depth > 0 ? "ms-4 mt-0.5" : ""}>
        <div className="flex items-center gap-1.5">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCategoryExpand(category.slug)}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
              style={{ color: fsConfig.chevronColor }}
            >
              <svg
                className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-7 7 7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          <label className="flex flex-1 cursor-pointer items-center gap-2.5 py-1.5 hover:bg-neutral-50 rounded px-1.5 -mx-1.5 transition-colors min-w-0">
            <CategoryCheckbox
              checked={isChecked}
              indeterminate={isPartiallyChecked || false}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleCategoryChange(category, e.target.checked)}
              accentColor={fsConfig.checkboxAccentColor}
            />
            <span className="flex-1 text-[13px] truncate" style={{ color: fsConfig.itemTextColor }}>{category.name}</span>
            {category.productCount !== undefined && category.productCount > 0 && (
              <span className="text-[11px] flex-shrink-0" style={{ color: fsConfig.itemCountColor }}>({category.productCount})</span>
            )}
          </label>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="flex h-full w-full flex-col">
      {/* Content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Clear All Button - Configurable via Storefront Control */}
        {hasFilters && (
          <div className="mb-4 pb-4 border-b border-neutral-200">
            <button
              onClick={clearAll}
              className="w-full rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide border transition-all duration-200"
              style={{
                backgroundColor: fsConfig.clearAllButtonBg,
                color: fsConfig.clearAllButtonText,
                borderColor: fsConfig.clearAllButtonBorder,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = fsConfig.clearAllButtonHoverBg;
                e.currentTarget.style.color = fsConfig.clearAllButtonHoverText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = fsConfig.clearAllButtonBg;
                e.currentTarget.style.color = fsConfig.clearAllButtonText;
              }}
            >
              {filtersText.clearAllButton}
            </button>
          </div>
        )}

        {/* Categories */}
        {filtersConfig.categoryFilter.enabled && categories.length > 0 && (
          <FilterSection
            title={categoriesLabel}
            isExpanded={expandedSections.includes("categories")}
            onToggle={() => toggleSection("categories")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <div className="space-y-1">
              {categories.map(category => renderCategory(category))}
            </div>
          </FilterSection>
        )}

        {/* Collections */}
        {filtersConfig.collectionFilter.enabled && collections.length > 0 && (
          <FilterSection
            title={collectionsLabel}
            isExpanded={expandedSections.includes("collections")}
            onToggle={() => toggleSection("collections")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <div className="space-y-0.5">
              {collections.map(collection => (
                <label key={collection.id} className="flex cursor-pointer items-center gap-2.5 py-1.5 hover:bg-neutral-50 rounded px-1.5 -mx-1.5 transition-colors min-w-0">
                  <input
                    type="checkbox"
                    checked={isCollectionSelected(collection.slug)}
                    onChange={() => toggleCollection(collection.slug)}
                    className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2 focus:ring-offset-1 flex-shrink-0"
                    style={{ accentColor: fsConfig.checkboxAccentColor }}
                  />
                  <span className="flex-1 text-[13px] truncate" style={{ color: fsConfig.itemTextColor }}>{collection.name}</span>
                  {collection.productCount !== undefined && collection.productCount > 0 && (
                    <span className="text-[11px] flex-shrink-0" style={{ color: fsConfig.itemCountColor }}>({collection.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Brands */}
        {filtersConfig.brandFilter.enabled && brands.length > 0 && (
          <FilterSection
            title={brandsLabel}
            isExpanded={expandedSections.includes("brands")}
            onToggle={() => toggleSection("brands")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <div className="space-y-0.5">
              {brands.map(brand => (
                <label key={brand.id} className="flex cursor-pointer items-center gap-2.5 py-1.5 hover:bg-neutral-50 rounded px-1.5 -mx-1.5 transition-colors min-w-0">
                  <input
                    type="checkbox"
                    checked={isBrandSelected(brand.slug)}
                    onChange={() => toggleBrand(brand.slug)}
                    className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2 focus:ring-offset-1 flex-shrink-0"
                    style={{ accentColor: fsConfig.checkboxAccentColor }}
                  />
                  <span className="flex-1 text-[13px] truncate" style={{ color: fsConfig.itemTextColor }}>{brand.name}</span>
                  {brand.productCount !== undefined && brand.productCount > 0 && (
                    <span className="text-[11px] flex-shrink-0" style={{ color: fsConfig.itemCountColor }}>({brand.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Sizes */}
        {filtersConfig.sizeFilter.enabled && sizes.length > 0 && (
          <FilterSection
            title={filtersText.sizeTitle}
            isExpanded={expandedSections.includes("sizes")}
            onToggle={() => toggleSection("sizes")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <div className="flex flex-wrap gap-1.5">
              {sizes.map(size => {
                const selected = isSizeSelected(size.slug);
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => toggleSize(size.slug)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors ${
                      selected
                        ? ""
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                    }`}
                    style={selected ? {
                      backgroundColor: fsConfig.sizeChipSelectedBg,
                      color: fsConfig.sizeChipSelectedText,
                      borderColor: fsConfig.sizeChipSelectedBorder,
                    } : undefined}
                  >
                    {size.name}
                    {size.productCount !== undefined && size.productCount > 0 && (
                      <span className="text-[10px]" style={{ color: selected ? `${fsConfig.sizeChipSelectedText}80` : fsConfig.itemCountColor }}>
                        ({size.productCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Colors */}
        {filtersConfig.colorFilter.enabled && colors.length > 0 && (
          <FilterSection
            title={filtersText.colorTitle}
            isExpanded={expandedSections.includes("colors")}
            onToggle={() => toggleSection("colors")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <div className="space-y-0.5">
              {colors.map(color => (
                <label key={color.id} className="flex cursor-pointer items-center gap-2.5 py-1.5 hover:bg-neutral-50 rounded px-1.5 -mx-1.5 transition-colors min-w-0">
                  <input
                    type="checkbox"
                    checked={isColorSelected(color.slug)}
                    onChange={() => toggleColor(color.slug)}
                    className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2 focus:ring-offset-1 flex-shrink-0"
                    style={{ accentColor: fsConfig.checkboxAccentColor }}
                  />
                  <span className="flex-1 text-[13px] truncate" style={{ color: fsConfig.itemTextColor }}>{color.name}</span>
                  {color.productCount !== undefined && color.productCount > 0 && (
                    <span className="text-[11px] flex-shrink-0" style={{ color: fsConfig.itemCountColor }}>({color.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Price Range */}
        {filtersConfig.priceFilter.enabled && (
          <FilterSection
            title={filtersText.priceTitle}
            isExpanded={expandedSections.includes("price")}
            onToggle={() => toggleSection("price")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <PriceRangeFilter
              channel={channel}
              minPrice={minPrice}
              maxPrice={maxPrice}
              currencyCode={currencyCode}
              showQuickButtons={filtersConfig.priceFilter.showQuickButtons}
            />
          </FilterSection>
        )}

        {/* Rating */}
        {filtersConfig.ratingFilter.enabled && (
          <FilterSection
            title={filtersText.ratingTitle}
            isExpanded={expandedSections.includes("rating")}
            onToggle={() => toggleSection("rating")}
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <RatingFilter />
          </FilterSection>
        )}

        {/* Availability */}
        {filtersConfig.stockFilter.enabled && (
          <FilterSection
            title={filtersText.availabilityTitle}
            isExpanded={expandedSections.includes("availability")}
            onToggle={() => toggleSection("availability")}
            noBorder
            sectionTitleColor={fsConfig.sectionTitleColor}
            sectionTitleHoverColor={fsConfig.sectionTitleHoverColor}
            chevronColor={fsConfig.chevronColor}
            chevronHoverColor={fsConfig.chevronHoverColor}
          >
            <div className="space-y-0.5">
              <label className="flex cursor-pointer items-center gap-2.5 py-1.5 hover:bg-neutral-50 rounded px-1.5 -mx-1.5 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={toggleInStock}
                  className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2 focus:ring-offset-1 flex-shrink-0"
                  style={{ accentColor: fsConfig.checkboxAccentColor }}
                />
                <span className="text-[13px]" style={{ color: fsConfig.itemTextColor }}>{filtersText.inStockOnly}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 py-1.5 hover:bg-neutral-50 rounded px-1.5 -mx-1.5 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.onSale}
                  onChange={toggleOnSale}
                  className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2 focus:ring-offset-1 flex-shrink-0"
                  style={{ accentColor: fsConfig.checkboxAccentColor }}
                />
                <span className="text-[13px]" style={{ color: fsConfig.itemTextColor }}>{filtersText.onSale}</span>
              </label>
            </div>
          </FilterSection>
        )}
      </div>

      {/* Active Filters Summary (Mobile) */}
      {hasFilters && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 lg:hidden flex-shrink-0">
          <p className="mb-2 text-xs font-medium text-neutral-500">{filtersText.activeFiltersLabel}</p>
          <div className="flex flex-wrap gap-2">
            {filters.categories.length > 0 && (
              <FilterTag>
                {filters.categories.length} {filters.categories.length === 1 ? filtersText.categorySingular : filtersText.categoryPlural}
              </FilterTag>
            )}
            {filters.collections.length > 0 && (
              <FilterTag>
                {filters.collections.length} {filters.collections.length === 1 ? filtersText.collectionSingular : filtersText.collectionPlural}
              </FilterTag>
            )}
            {filters.brands.length > 0 && (
              <FilterTag>
                {filters.brands.length} {filters.brands.length === 1 ? filtersText.brandSingular : filtersText.brandPlural}
              </FilterTag>
            )}
            {filters.colors.length > 0 && (
              <FilterTag>
                {filters.colors.length} {filters.colors.length === 1 ? filtersText.colorSingular : filtersText.colorPlural}
              </FilterTag>
            )}
            {filters.inStock && <FilterTag>{filtersText.inStockOnly}</FilterTag>}
            {filters.onSale && <FilterTag>{filtersText.onSale}</FilterTag>}
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function CategoryCheckbox({
  checked,
  indeterminate,
  onChange,
  accentColor,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accentColor: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2 focus:ring-offset-1"
      style={{ accentColor }}
    />
  );
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
  noBorder = false,
  sectionTitleColor,
  sectionTitleHoverColor,
  chevronColor,
  chevronHoverColor,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  noBorder?: boolean;
  sectionTitleColor?: string;
  sectionTitleHoverColor?: string;
  chevronColor?: string;
  chevronHoverColor?: string;
}) {
  return (
    <div className={`${noBorder ? "py-4" : "border-b border-neutral-200 py-4"}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-start group"
      >
        <span
          className="text-[13px] font-semibold uppercase tracking-wide transition-colors"
          style={{ color: sectionTitleColor }}
          onMouseEnter={(e) => { if (sectionTitleHoverColor) e.currentTarget.style.color = sectionTitleHoverColor; }}
          onMouseLeave={(e) => { if (sectionTitleColor) e.currentTarget.style.color = sectionTitleColor; }}
        >
          {title}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          style={{ color: chevronColor }}
          onMouseEnter={(e) => { if (chevronHoverColor) e.currentTarget.style.color = chevronHoverColor; }}
          onMouseLeave={(e) => { if (chevronColor) e.currentTarget.style.color = chevronColor; }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
      {children}
    </span>
  );
}

// ============================================================================
// Mobile Filter Drawer
// ============================================================================

export function MobileFilterDrawer({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const filtersText = useFiltersText();
  const fsConfig = useFilterSidebarConfig();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 start-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">{filtersText.sectionTitle}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-4 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg py-3 text-sm font-semibold"
            style={{
              backgroundColor: fsConfig.mobileShowResultsBg,
              color: fsConfig.mobileShowResultsText,
            }}
          >
            {filtersText.showResultsButton}
          </button>
        </div>
      </div>
    </div>
  );
}

