"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { storeConfig } from "@/config";
import { type FilterState } from "@/lib/filters";

interface ActiveFiltersTagsProps {
  filters: FilterState;
  categories?: Array<{ slug: string; name: string; children?: Array<{ slug: string }> }>;
  collections?: Array<{ slug: string; name: string }>;
  brands?: Array<{ slug: string; name: string }>;
  sizes?: Array<{ slug: string; name: string }>;
  colors?: Array<{ slug: string; name: string }>;
}

export function ActiveFiltersTags({ 
  filters, 
  categories = [],
  collections = [],
  brands = [],
  sizes = [],
  colors = []
}: ActiveFiltersTagsProps) {
  const { toggleCategory, toggleCollection, toggleBrand, toggleSize, toggleColor, toggleInStock, toggleOnSale, updateFilters, clearAll } = useProductFilters();

  const getCategoryName = (slug: string): string => {
    // Check direct categories
    const category = categories.find(c => c.slug === slug);
    if (category) return category.name;
    
    // Check children
    for (const cat of categories) {
      if (cat.children) {
        const child = cat.children.find(c => c.slug === slug);
        if (child) {
          // Try to find the child in the full category structure
          return slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
        }
      }
    }
    return slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  };

  const getCollectionName = (slug: string): string => {
    return collections.find(c => c.slug === slug)?.name || 
           slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  };

  const getBrandName = (slug: string): string => {
    return brands.find(b => b.slug === slug)?.name || 
           slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  };

  const getSizeName = (slug: string): string => {
    return sizes.find(s => s.slug === slug)?.name || 
           slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  };

  const getColorName = (slug: string): string => {
    return colors.find(c => c.slug === slug)?.name || 
           slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  };

  return (
    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm border border-neutral-200">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Active Filters</h3>
        <button
          onClick={clearAll}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Clear all
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filters.categories.map(slug => (
          <FilterTag
            key={`category-${slug}`}
            onRemove={() => toggleCategory(slug)}
            label={getCategoryName(slug)}
            type="category"
          />
        ))}
        
        {filters.collections.map(slug => (
          <FilterTag
            key={`collection-${slug}`}
            onRemove={() => toggleCollection(slug)}
            label={getCollectionName(slug)}
            type="collection"
          />
        ))}
        
        {filters.brands.map(slug => (
          <FilterTag
            key={`brand-${slug}`}
            onRemove={() => toggleBrand(slug)}
            label={getBrandName(slug)}
            type="brand"
          />
        ))}
        
        {filters.sizes.map(slug => (
          <FilterTag
            key={`size-${slug}`}
            onRemove={() => toggleSize(slug)}
            label={getSizeName(slug)}
            type="size"
          />
        ))}
        
        {filters.colors.map(slug => (
          <FilterTag
            key={`color-${slug}`}
            onRemove={() => toggleColor(slug)}
            label={getColorName(slug)}
            type="color"
          />
        ))}
        
        {filters.inStock && (
          <FilterTag
            onRemove={toggleInStock}
            label="In Stock"
            type="availability"
          />
        )}
        
        {filters.onSale && (
          <FilterTag
            onRemove={toggleOnSale}
            label="On Sale"
            type="availability"
          />
        )}
        
        {((filters.priceMin !== undefined && filters.priceMin !== null) || 
          (filters.priceMax !== undefined && filters.priceMax !== null)) && (
          <FilterTag
            onRemove={() => updateFilters({ priceMin: undefined, priceMax: undefined })}
            label={formatPriceRange(filters.priceMin, filters.priceMax)}
            type="price"
          />
        )}
      </div>
    </div>
  );
}

function formatPriceRange(min: number | undefined, max: number | undefined): string {
  // Get currency symbol (default to $ for USD)
  const getCurrencySymbol = (code: string = "USD"): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      ILS: "₪",
    };
    return symbols[code.toUpperCase()] || code.toUpperCase();
  };

  const currencySymbol = getCurrencySymbol("USD"); // TODO: Get from channel/context

  if (min !== undefined && max !== undefined) {
    return `${currencySymbol}${min.toFixed(2)} - ${currencySymbol}${max.toFixed(2)}`;
  } else if (min !== undefined) {
    return `From ${currencySymbol}${min.toFixed(2)}`;
  } else if (max !== undefined) {
    return `Up to ${currencySymbol}${max.toFixed(2)}`;
  }
  return "Price";
}

function FilterTag({ 
  label, 
  onRemove, 
  type: _type
}: {
  label: string;
  onRemove: () => void;
  type: "category" | "collection" | "brand" | "size" | "color" | "price" | "availability";
}) {
  const { branding } = storeConfig;
  
  return (
    <span className="group inline-flex items-center gap-1.5 rounded-full bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:bg-neutral-100 hover:border-neutral-300">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{ 
          "--tw-ring-color": branding.colors.primary 
        } as React.CSSProperties}
        aria-label={`Remove ${label} filter`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

