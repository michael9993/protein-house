"use client";

import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useUiConfig, useFiltersText, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { type FilterState } from "@/lib/filters";
import { getChannelCurrencyClient } from "@/lib/channel-utils";
import { getCurrencySymbol } from "@/lib/currency";
import { useState, useEffect } from "react";

interface ActiveFiltersTagsProps {
  filters: FilterState;
  channel?: string;
  categories?: Array<{ slug: string; name: string; children?: Array<{ slug: string; name: string; children?: Array<unknown> }> }>;
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
  const cdStyle = useComponentStyle("plp.activeFiltersTags");
  const cdClasses = useComponentClasses("plp.activeFiltersTags");
  const { toggleCategory, toggleCollection, toggleBrand, toggleSize, toggleColor, toggleInStock, toggleOnSale, updateFilters, clearAll } = useProductFilters();
  const [currencyCode, setCurrencyCode] = useState<string>("");
  
  // Font size / weight / radius / shadow class maps (used by tagsStyle below)
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

  // Get active filters tags styling with defaults (type for optional ui.activeFiltersTags)
  const tagsStyle = ((ui as { activeFiltersTags?: Record<string, string | number | undefined> }).activeFiltersTags || {}) as Record<string, string | number | undefined>;
  const containerBg: string = String(tagsStyle.containerBackgroundColor ?? "#FFFFFF");
  const containerBorderColor: string = String(tagsStyle.containerBorderColor ?? "#E5E7EB");
  const containerBorderRadius: keyof typeof borderRadiusClasses = (String(tagsStyle.containerBorderRadius ?? "lg")) as keyof typeof borderRadiusClasses;
  const containerPadding: number = Number(tagsStyle.containerPadding ?? 16);
  const containerShadow: keyof typeof shadowClasses = (String(tagsStyle.containerShadow ?? "sm")) as keyof typeof shadowClasses;
  const titleFontSize: keyof typeof fontSizeClasses = (String(tagsStyle.titleFontSize ?? "sm")) as keyof typeof fontSizeClasses;
  const titleFontWeight: keyof typeof fontWeightClasses = (String(tagsStyle.titleFontWeight ?? "semibold")) as keyof typeof fontWeightClasses;
  const titleColor: string = String(tagsStyle.titleColor ?? "#111827");
  const clearAllFontSize: keyof typeof fontSizeClasses = (String(tagsStyle.clearAllButtonFontSize ?? "xs")) as keyof typeof fontSizeClasses;
  const clearAllFontWeight: keyof typeof fontWeightClasses = (String(tagsStyle.clearAllButtonFontWeight ?? "medium")) as keyof typeof fontWeightClasses;
  const clearAllColor: string = String(tagsStyle.clearAllButtonColor ?? "#6B7280");
  const clearAllHoverColor: string = String(tagsStyle.clearAllButtonHoverColor ?? "#374151");
  const tagBg: string = String(tagsStyle.tagBackgroundColor ?? "#F9FAFB");
  const tagBorderColor: string = String(tagsStyle.tagBorderColor ?? "#E5E7EB");
  const tagTextColor: string = String(tagsStyle.tagTextColor ?? "#374151");
  const tagHoverBg: string = String(tagsStyle.tagHoverBackgroundColor ?? "#F3F4F6");
  const tagHoverBorderColor: string = String(tagsStyle.tagHoverBorderColor ?? "#D1D5DB");
  const tagBorderRadius: keyof typeof borderRadiusClasses = (String(tagsStyle.tagBorderRadius ?? "full")) as keyof typeof borderRadiusClasses;
  const tagPaddingX: number = Number(tagsStyle.tagPaddingX ?? 12);
  const tagPaddingY: number = Number(tagsStyle.tagPaddingY ?? 6);
  const tagFontSize: keyof typeof fontSizeClasses = (String(tagsStyle.tagFontSize ?? "xs")) as keyof typeof fontSizeClasses;
  const tagFontWeight: keyof typeof fontWeightClasses = (String(tagsStyle.tagFontWeight ?? "medium")) as keyof typeof fontWeightClasses;
  const tagGap: number = Number(tagsStyle.tagGap ?? 8);
  const removeButtonSize: number = Number(tagsStyle.removeButtonSize ?? 16);
  const removeButtonColor: string = String(tagsStyle.removeButtonColor ?? "#9CA3AF");
  const removeButtonHoverBg: string = String(tagsStyle.removeButtonHoverBackgroundColor ?? "#E5E7EB");
  const removeButtonHoverColor: string = String(tagsStyle.removeButtonHoverColor ?? "#4B5563");
  const removeButtonBorderRadius: keyof typeof borderRadiusClasses = (String(tagsStyle.removeButtonBorderRadius ?? "full")) as keyof typeof borderRadiusClasses;

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

  type CategoryItem = { slug: string; name: string; children?: CategoryItem[] };
  const getCategoryName = (slug: string): string => {
    function findInTree(items: CategoryItem[] | undefined): string | null {
      if (!items?.length) return null;
      for (const c of items) {
        if (c.slug === slug) return c.name;
        const nested = findInTree(c.children);
        if (nested) return nested;
      }
      return null;
    }
    const list: CategoryItem[] = (categories ?? []).map((c) => ({
      slug: c.slug,
      name: c.name,
      children: c.children as CategoryItem[] | undefined,
    }));
    return findInTree(list) ?? slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
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
      data-cd="plp-activeFiltersTags"
      className={`mb-4 ${borderRadiusClasses[containerBorderRadius]} ${shadowClasses[containerShadow]} border ${cdClasses}`}
      style={{
        background: cdStyle?.backgroundColor ? `var(--cd-plp-activeFiltersTags-bg)` : containerBg,
        borderColor: containerBorderColor,
        padding: `${containerPadding}px`,
        ...(cdStyle?.textColor && { color: `var(--cd-plp-activeFiltersTags-text)` }),
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
            label={formatPriceRange(filters.priceMin, filters.priceMax, currencyCode, filtersText)}
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

function formatPriceRange(
  min: number | undefined,
  max: number | undefined,
  currencyCode: string,
  labels: { priceTitle: string; priceFromLabel?: string; priceUpToLabel?: string },
): string {
  const currencySymbol = getCurrencySymbol(currencyCode) || currencyCode || "";
  const fromLabel = labels.priceFromLabel ?? "From";
  const upToLabel = labels.priceUpToLabel ?? "Up to";

  if (min !== undefined && max !== undefined) {
    return `${currencySymbol}${min.toFixed(2)} - ${currencySymbol}${max.toFixed(2)}`;
  } else if (min !== undefined) {
    return `${fromLabel} ${currencySymbol}${min.toFixed(2)}`;
  } else if (max !== undefined) {
    return `${upToLabel} ${currencySymbol}${max.toFixed(2)}`;
  }
  return labels.priceTitle;
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
  const tagsStyle = ((ui as { activeFiltersTags?: Record<string, string | number | undefined> }).activeFiltersTags || {}) as Record<string, string | number | undefined>;
  
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

  const tagBg: string = String(tagsStyle.tagBackgroundColor ?? "#F9FAFB");
  const tagBorderColor: string = String(tagsStyle.tagBorderColor ?? "#E5E7EB");
  const tagTextColor: string = String(tagsStyle.tagTextColor ?? "#374151");
  const tagHoverBg: string = String(tagsStyle.tagHoverBackgroundColor ?? "#F3F4F6");
  const tagHoverBorderColor: string = String(tagsStyle.tagHoverBorderColor ?? "#D1D5DB");
  const tagBorderRadius: keyof typeof borderRadiusClasses = (String(tagsStyle.tagBorderRadius ?? "full")) as keyof typeof borderRadiusClasses;
  const tagPaddingX: number = Number(tagsStyle.tagPaddingX ?? 12);
  const tagPaddingY: number = Number(tagsStyle.tagPaddingY ?? 6);
  const tagFontSize: keyof typeof fontSizeClasses = (String(tagsStyle.tagFontSize ?? "xs")) as keyof typeof fontSizeClasses;
  const tagFontWeight: keyof typeof fontWeightClasses = (String(tagsStyle.tagFontWeight ?? "medium")) as keyof typeof fontWeightClasses;
  const removeButtonSize: number = Number(tagsStyle.removeButtonSize ?? 16);
  const removeButtonColor: string = String(tagsStyle.removeButtonColor ?? "#9CA3AF");
  const removeButtonHoverBg: string = String(tagsStyle.removeButtonHoverBackgroundColor ?? "#E5E7EB");
  const removeButtonHoverColor: string = String(tagsStyle.removeButtonHoverColor ?? "#4B5563");
  const removeButtonBorderRadius: keyof typeof borderRadiusClasses = (String(tagsStyle.removeButtonBorderRadius ?? "full")) as keyof typeof borderRadiusClasses;
  
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

