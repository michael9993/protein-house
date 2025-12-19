"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { storeConfig } from "@/config";

// Export the Category type for use in wrapper
export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  children?: Category[];
}

interface ProductFiltersProps {
  categories?: Category[];
  selectedCategoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  showInStock?: boolean;
  onSale?: boolean;
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  categories: string[]; // Using slugs for URL-friendly filtering
  priceRanges: string[]; // Multiple price ranges
  inStock: boolean;
  onSale: boolean;
}

const PRICE_RANGES = [
  { id: "0-25", label: "Under $25", min: 0, max: 25 },
  { id: "25-50", label: "$25 - $50", min: 25, max: 50 },
  { id: "50-100", label: "$50 - $100", min: 50, max: 100 },
  { id: "100-200", label: "$100 - $200", min: 100, max: 200 },
  { id: "200+", label: "Over $200", min: 200, max: null },
];

// Helper to get all category slugs including children
function getAllCategorySlugs(category: Category): string[] {
  const slugs = [category.slug];
  if (category.children && category.children.length > 0) {
    category.children.forEach(child => {
      slugs.push(...getAllCategorySlugs(child));
    });
  }
  return slugs;
}

// Helper to check if a category or any of its children is selected
function isCategoryOrChildSelected(category: Category, selectedSlugs: string[]): boolean {
  if (selectedSlugs.includes(category.slug)) return true;
  if (category.children) {
    return category.children.some(child => isCategoryOrChildSelected(child, selectedSlugs));
  }
  return false;
}

export function ProductFilters({ 
  categories = [], 
  selectedCategoryIds = [],
  showInStock = false,
  onSale = false,
  onFilterChange,
}: ProductFiltersProps) {
  const { branding } = storeConfig;
  const router = useRouter();
  const pathname = usePathname();
  
  const searchParams = useSearchParams();
  
  // Local state for immediate UI feedback
  const [expandedSections, setExpandedSections] = useState<string[]>(["categories", "price", "availability"]);
  // Auto-expand all parent categories that have children
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    return categories.filter(c => c.children && c.children.length > 0).map(c => c.slug);
  });
  const [localCategories, setLocalCategories] = useState<string[]>(selectedCategoryIds);
  const [localPriceRanges, setLocalPriceRanges] = useState<string[]>([]);
  const [localInStock, setLocalInStock] = useState(showInStock);
  const [localOnSale, setLocalOnSale] = useState(onSale);

  // Initialize price ranges from URL
  useEffect(() => {
    const priceParam = searchParams.get("priceRanges");
    if (priceParam) {
      setLocalPriceRanges(priceParam.split(","));
    }
  }, [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback((updates: Partial<{
    categories: string[];
    priceRanges: string[];
    inStock: boolean;
    onSale: boolean;
  }>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.categories !== undefined) {
      if (updates.categories.length > 0) {
        params.set("categories", updates.categories.join(","));
      } else {
        params.delete("categories");
      }
    }
    
    if (updates.priceRanges !== undefined) {
      if (updates.priceRanges.length > 0) {
        params.set("priceRanges", updates.priceRanges.join(","));
      } else {
        params.delete("priceRanges");
        params.delete("minPrice");
        params.delete("maxPrice");
      }
    }
    
    if (updates.inStock !== undefined) {
      if (updates.inStock) {
        params.set("inStock", "true");
      } else {
        params.delete("inStock");
      }
    }
    
    if (updates.onSale !== undefined) {
      if (updates.onSale) {
        params.set("onSale", "true");
      } else {
        params.delete("onSale");
      }
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleCategoryExpand = (categorySlug: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categorySlug)
        ? prev.filter((s) => s !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  const handleCategoryChange = (category: Category, isChecked: boolean) => {
    // Get all slugs for this category and its children
    const allSlugs = getAllCategorySlugs(category);
    
    let newCategories: string[];
    if (isChecked) {
      // Add all slugs (category + children)
      newCategories = [...new Set([...localCategories, ...allSlugs])];
    } else {
      // Remove all slugs (category + children)
      newCategories = localCategories.filter(slug => !allSlugs.includes(slug));
    }
    
    setLocalCategories(newCategories);
    updateFilters({ categories: newCategories });
  };

  const handlePriceRangeChange = (rangeId: string) => {
    let newPriceRanges: string[];
    
    if (localPriceRanges.includes(rangeId)) {
      // Remove this range
      newPriceRanges = localPriceRanges.filter(r => r !== rangeId);
    } else {
      // Add this range
      newPriceRanges = [...localPriceRanges, rangeId];
    }
    
    setLocalPriceRanges(newPriceRanges);
    updateFilters({ priceRanges: newPriceRanges });
  };

  const handleInStockChange = () => {
    const newValue = !localInStock;
    setLocalInStock(newValue);
    updateFilters({ inStock: newValue });
  };

  const handleOnSaleChange = () => {
    const newValue = !localOnSale;
    setLocalOnSale(newValue);
    updateFilters({ onSale: newValue });
  };

  const clearAll = () => {
    setLocalCategories([]);
    setLocalPriceRanges([]);
    setLocalInStock(false);
    setLocalOnSale(false);
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = localCategories.length > 0 || localPriceRanges.length > 0 || localInStock || localOnSale;

  // Render category with children
  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.includes(category.slug);
    const isChecked = localCategories.includes(category.slug);
    const isPartiallyChecked = !isChecked && hasChildren && 
      category.children!.some(child => isCategoryOrChildSelected(child, localCategories));

    return (
      <div key={category.slug} className={depth > 0 ? "ml-4 mt-1" : ""}>
        <div className="flex items-center gap-2">
          {/* Expand button for categories with children */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCategoryExpand(category.slug)}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
            >
              <svg
                className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <label className="flex flex-1 cursor-pointer items-center gap-2 py-1.5">
            <div className="relative">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleCategoryChange(category, e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2"
                style={{ 
                  accentColor: branding.colors.primary,
                }}
              />
              {/* Indeterminate state indicator */}
              {isPartiallyChecked && (
                <div 
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div 
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: branding.colors.primary }}
                  />
                </div>
              )}
            </div>
            <span className="flex-1 text-sm text-neutral-700">{category.name}</span>
            {category.productCount !== undefined && category.productCount > 0 && (
              <span className="text-xs text-neutral-400">({category.productCount})</span>
            )}
          </label>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: branding.colors.primary }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="border-b border-neutral-200 py-4">
          <button
            onClick={() => toggleSection("categories")}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-neutral-900">Category</span>
            <svg
              className={`h-5 w-5 text-neutral-500 transition-transform ${
                expandedSections.includes("categories") ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.includes("categories") && (
            <div className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-2">
              {categories.map(category => renderCategory(category))}
            </div>
          )}
        </div>
      )}

      {/* Price Range - Now with checkboxes */}
      <div className="border-b border-neutral-200 py-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-neutral-900">Price</span>
          <svg
            className={`h-5 w-5 text-neutral-500 transition-transform ${
              expandedSections.includes("price") ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.includes("price") && (
          <div className="mt-4 space-y-2">
            {PRICE_RANGES.map((range) => (
              <label
                key={range.id}
                className="flex cursor-pointer items-center gap-3 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={localPriceRanges.includes(range.id)}
                  onChange={() => handlePriceRangeChange(range.id)}
                  className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2"
                  style={{ accentColor: branding.colors.primary }}
                />
                <span className="text-sm text-neutral-700">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="py-4">
        <button
          onClick={() => toggleSection("availability")}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-neutral-900">Availability</span>
          <svg
            className={`h-5 w-5 text-neutral-500 transition-transform ${
              expandedSections.includes("availability") ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.includes("availability") && (
          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer items-center gap-3 py-1.5">
              <input
                type="checkbox"
                checked={localInStock}
                onChange={handleInStockChange}
                className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2"
                style={{ accentColor: branding.colors.primary }}
              />
              <span className="text-sm text-neutral-700">In Stock Only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 py-1.5">
              <input
                type="checkbox"
                checked={localOnSale}
                onChange={handleOnSaleChange}
                className="h-4 w-4 rounded border-neutral-300 transition-colors focus:ring-2"
                style={{ accentColor: branding.colors.primary }}
              />
              <span className="text-sm text-neutral-700">On Sale</span>
            </label>
          </div>
        )}
      </div>

      {/* Active Filters Summary (Mobile) */}
      {hasActiveFilters && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 lg:hidden">
          <p className="mb-2 text-xs font-medium text-neutral-500">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {localCategories.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                {localCategories.length} {localCategories.length === 1 ? "category" : "categories"}
              </span>
            )}
            {localPriceRanges.map(rangeId => {
              const range = PRICE_RANGES.find(r => r.id === rangeId);
              return range ? (
                <span key={rangeId} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                  {range.label}
                </span>
              ) : null;
            })}
            {localInStock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                In Stock
              </span>
            )}
            {localOnSale && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                On Sale
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

// Mobile Filter Drawer
export function MobileFilterDrawer({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  const { branding } = storeConfig;
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
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
            className="w-full rounded-lg py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: branding.colors.primary }}
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

// Export price ranges for use in grid components
export { PRICE_RANGES };
