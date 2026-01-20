"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useUiConfig, useFiltersText } from "@/providers/StoreConfigProvider";
import { type FilterState } from "@/lib/filters";
import { getChannelCurrencyClient } from "@/lib/channel-utils";
import { getCurrencySymbol } from "@/lib/currency";
import { useState, useEffect } from "react";

interface ActiveFiltersTagsProps {
  filters: FilterState;
  channel?: string;
  categories?: Array<{ slug: string; name: string; children?: Array<{ slug: string }> }>;
  collections?: Array<{ slug: string; name: string }>;
  brands?: Array<{ slug: string; name: string }>;
  sizes?: Array<{ slug: string; name: string }>;
  colors?: Array<{ slug: string; name: string }>;
}

export function ActiveFiltersTags({ 
  filters, 
  channel,
  categories = [],
  collections = [],
  brands = [],
  sizes = [],
  colors = []
}: ActiveFiltersTagsProps) {
  const { branding } = useStoreConfig();
  const ui = useUiConfig();
  const filtersText = useFiltersText();
  const { toggleCategory, toggleCollection, toggleBrand, toggleSize, toggleColor, toggleInStock, toggleOnSale, updateFilters, clearAll } = useProductFilters();
  const [currencyCode, setCurrencyCode] = useState<string>("");
  
  // Get active filters tags styling with defaults
  const tagsStyle = ui.activeFiltersTags || {};
  const containerBg = tagsStyle.containerBackgroundColor ?? "#FFFFFF";
  const containerBorderColor = tagsStyle.containerBorderColor ?? "#E5E7EB";
  const containerBorderRadius = tagsStyle.containerBorderRadius ?? "lg";
  const containerPadding = tagsStyle.containerPadding ?? 16;
  const containerShadow = tagsStyle.containerShadow ?? "sm";
  const titleFontSize = tagsStyle.titleFontSize ?? "sm";
  const titleFontWeight = tagsStyle.titleFontWeight ?? "semibold";
  const titleColor = tagsStyle.titleColor ?? "#111827";
  const clearAllFontSize = tagsStyle.clearAllButtonFontSize ?? "xs";
  const clearAllFontWeight = tagsStyle.clearAllButtonFontWeight ?? "medium";
  const clearAllColor = tagsStyle.clearAllButtonColor ?? "#6B7280";
  const clearAllHoverColor = tagsStyle.clearAllButtonHoverColor ?? "#374151";
  const tagBg = tagsStyle.tagBackgroundColor ?? "#F9FAFB";
  const tagBorderColor = tagsStyle.tagBorderColor ?? "#E5E7EB";
  const tagTextColor = tagsStyle.tagTextColor ?? "#374151";
  const tagHoverBg = tagsStyle.tagHoverBackgroundColor ?? "#F3F4F6";
  const tagHoverBorderColor = tagsStyle.tagHoverBorderColor ?? "#D1D5DB";
  const tagBorderRadius = tagsStyle.tagBorderRadius ?? "full";
  const tagPaddingX = tagsStyle.tagPaddingX ?? 12;
  const tagPaddingY = tagsStyle.tagPaddingY ?? 6;
  const tagFontSize = tagsStyle.tagFontSize ?? "xs";
  const tagFontWeight = tagsStyle.tagFontWeight ?? "medium";
  const tagGap = tagsStyle.tagGap ?? 8;
  const removeButtonSize = tagsStyle.removeButtonSize ?? 16;
  const removeButtonColor = tagsStyle.removeButtonColor ?? "#9CA3AF";
  const removeButtonHoverBg = tagsStyle.removeButtonHoverBackgroundColor ?? "#E5E7EB";
  const removeButtonHoverColor = tagsStyle.removeButtonHoverColor ?? "#4B5563";
  const removeButtonBorderRadius = tagsStyle.removeButtonBorderRadius ?? "full";

  // Font size classes
  const fontSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
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
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  // Fetch channel currency if channel is provided
  useEffect(() => {
    if (channel) {
      getChannelCurrencyClient(channel).then((code) => {
        // Normalize currency code (trim, handle empty)
        const normalized = code?.trim() || "";
        setCurrencyCode(normalized);
      });
    } else {
      setCurrencyCode("");
    }
  }, [channel]);

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
    <div 
      className={`mb-4 ${borderRadiusClasses[containerBorderRadius]} ${shadowClasses[containerShadow]} border`}
      style={{
        backgroundColor: containerBg,
        borderColor: containerBorderColor,
        padding: `${containerPadding}px`,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 
          className={`${fontSizeClasses[titleFontSize]} ${fontWeightClasses[titleFontWeight]}`}
          style={{ color: titleColor }}
        >
          {filtersText.activeFiltersLabel}
        </h3>
        <button
          onClick={clearAll}
          className={`${fontSizeClasses[clearAllFontSize]} ${fontWeightClasses[clearAllFontWeight]} transition-colors`}
          style={{ 
            color: clearAllColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = clearAllHoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = clearAllColor;
          }}
        >
          {filtersText.clearAllButton}
        </button>
      </div>
      
      <div 
        className="flex flex-wrap"
        style={{ gap: `${tagGap}px` }}
      >
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
            label={filtersText.inStockOnly}
            type="availability"
          />
        )}
        
        {filters.onSale && (
          <FilterTag
            onRemove={toggleOnSale}
            label={filtersText.onSale}
            type="availability"
          />
        )}
        
        {((filters.priceMin !== undefined && filters.priceMin !== null) || 
          (filters.priceMax !== undefined && filters.priceMax !== null)) && (
          <FilterTag
            onRemove={() => updateFilters({ priceMin: undefined, priceMax: undefined })}
            label={formatPriceRange(filters.priceMin, filters.priceMax, currencyCode)}
            type="price"
          />
        )}
        
        {filters.rating !== undefined && filters.rating !== null && (
          <FilterTag
            onRemove={() => updateFilters({ rating: undefined })}
            label={`${filters.rating} ${filters.rating === 1 ? filtersText.starAndUp : filtersText.starsAndUp}`}
            type="rating"
          />
        )}
      </div>
    </div>
  );
}

function formatPriceRange(min: number | undefined, max: number | undefined, currencyCode: string): string {
  // Get currency symbol (handles ILS, NIS, name variants, case variations)
  const currencySymbol = getCurrencySymbol(currencyCode) || currencyCode || "";

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
  type: "category" | "collection" | "brand" | "size" | "color" | "price" | "availability" | "rating";
}) {
  const { branding } = useStoreConfig();
  const ui = useUiConfig();
  const tagsStyle = ui.activeFiltersTags || {};
  
  const tagBg = tagsStyle.tagBackgroundColor ?? "#F9FAFB";
  const tagBorderColor = tagsStyle.tagBorderColor ?? "#E5E7EB";
  const tagTextColor = tagsStyle.tagTextColor ?? "#374151";
  const tagHoverBg = tagsStyle.tagHoverBackgroundColor ?? "#F3F4F6";
  const tagHoverBorderColor = tagsStyle.tagHoverBorderColor ?? "#D1D5DB";
  const tagBorderRadius = tagsStyle.tagBorderRadius ?? "full";
  const tagPaddingX = tagsStyle.tagPaddingX ?? 12;
  const tagPaddingY = tagsStyle.tagPaddingY ?? 6;
  const tagFontSize = tagsStyle.tagFontSize ?? "xs";
  const tagFontWeight = tagsStyle.tagFontWeight ?? "medium";
  const removeButtonSize = tagsStyle.removeButtonSize ?? 16;
  const removeButtonColor = tagsStyle.removeButtonColor ?? "#9CA3AF";
  const removeButtonHoverBg = tagsStyle.removeButtonHoverBackgroundColor ?? "#E5E7EB";
  const removeButtonHoverColor = tagsStyle.removeButtonHoverColor ?? "#4B5563";
  const removeButtonBorderRadius = tagsStyle.removeButtonBorderRadius ?? "full";

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
    <span 
      className={`group inline-flex items-center gap-1.5 border transition-all ${fontSizeClasses[tagFontSize]} ${fontWeightClasses[tagFontWeight]} ${borderRadiusClasses[tagBorderRadius]}`}
      style={{
        backgroundColor: tagBg,
        borderColor: tagBorderColor,
        color: tagTextColor,
        paddingLeft: `${tagPaddingX}px`,
        paddingRight: `${tagPaddingX}px`,
        paddingTop: `${tagPaddingY}px`,
        paddingBottom: `${tagPaddingY}px`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = tagHoverBg;
        e.currentTarget.style.borderColor = tagHoverBorderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = tagBg;
        e.currentTarget.style.borderColor = tagBorderColor;
      }}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className={`ml-0.5 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${borderRadiusClasses[removeButtonBorderRadius]}`}
        style={{ 
          height: `${removeButtonSize}px`,
          width: `${removeButtonSize}px`,
          color: removeButtonColor,
          "--tw-ring-color": branding.colors.primary 
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = removeButtonHoverBg;
          e.currentTarget.style.color = removeButtonHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = removeButtonColor;
        }}
        aria-label={`Remove ${label} filter`}
      >
        <svg 
          className="pointer-events-none" 
          style={{ height: `${removeButtonSize * 0.75}px`, width: `${removeButtonSize * 0.75}px` }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

