"use client";

/**
 * Client-side hook for managing product filters
 * 
 * URL is the SINGLE SOURCE OF TRUTH.
 * This hook provides:
 * - Current filter state (derived from URL)
 * - Methods to update filters (which update URL)
 * - No local state duplication
 */

import { useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  type FilterState,
  type SortValue,
  parseFiltersFromURL,
  parseSortFromURL,
  serializeFiltersToURL,
  serializeSortToURL,
  hasActiveFilters,
  countActiveFilters,
  toggleCategory,
  toggleCollection,
  toggleBrand,
  toggleSize,
  toggleColor,
  toggleInStock,
  toggleOnSale,
  clearAllFilters,
  SORT_OPTIONS,
} from "@/lib/filters";

export interface UseProductFiltersReturn {
  // Current state (derived from URL)
  filters: FilterState;
  sort: SortValue;
  hasFilters: boolean;
  filterCount: number;
  
  // Update methods
  updateFilters: (updates: Partial<FilterState>) => void;
  updateSort: (sort: SortValue) => void;
  
  // Toggle methods (convenience)
  toggleCategory: (slug: string) => void;
  toggleCollection: (slug: string) => void;
  toggleBrand: (slug: string) => void;
  toggleSize: (slug: string) => void;
  toggleColor: (slug: string) => void;
  toggleInStock: () => void;
  toggleOnSale: () => void;
  clearAll: () => void;
  
  // Check methods
  isCategorySelected: (slug: string) => boolean;
  isCollectionSelected: (slug: string) => boolean;
  isBrandSelected: (slug: string) => boolean;
  isSizeSelected: (slug: string) => boolean;
  isColorSelected: (slug: string) => boolean;
  
  // Constants
  sortOptions: typeof SORT_OPTIONS;
}

const FILTER_STORAGE_KEY = "saleor_product_filters";

export function useProductFilters(): UseProductFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load saved filters from localStorage on mount (only if URL has no filters)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const savedFilters = JSON.parse(saved) as Partial<FilterState>;
        const currentFilters = parseFiltersFromURL(searchParams);
        // Only apply saved filters if URL has no filters
        if (!hasActiveFilters(currentFilters)) {
          const params = serializeFiltersToURL(savedFilters, new URLSearchParams());
          if (params.toString()) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            return; // Early return to prevent double parsing
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load saved filters:", error);
    }
  }, []); // Only run on mount

  // Derive state from URL (memoized)
  const filters = useMemo(
    () => parseFiltersFromURL(searchParams),
    [searchParams]
  );

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      if (hasActiveFilters(filters)) {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
      } else {
        localStorage.removeItem(FILTER_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Failed to save filters:", error);
    }
  }, [filters]);

  const sort = useMemo(
    () => parseSortFromURL(searchParams),
    [searchParams]
  );

  const hasFilters = useMemo(() => hasActiveFilters(filters), [filters]);
  const filterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Navigate to new URL with updated params
  // Use replace instead of push for better performance and to avoid history bloat
  const navigate = useCallback(
    (params: URLSearchParams) => {
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  // Update filters
  const updateFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const params = serializeFiltersToURL(updates, searchParams);
      navigate(params);
    },
    [searchParams, navigate]
  );

  // Update sort
  const updateSort = useCallback(
    (newSort: SortValue) => {
      const params = serializeSortToURL(newSort, searchParams);
      navigate(params);
    },
    [searchParams, navigate]
  );

  // Toggle category
  const handleToggleCategory = useCallback(
    (slug: string) => {
      const updated = toggleCategory(filters, slug);
      updateFilters({ categories: updated.categories });
    },
    [filters, updateFilters]
  );

  // Toggle collection
  const handleToggleCollection = useCallback(
    (slug: string) => {
      const updated = toggleCollection(filters, slug);
      updateFilters({ collections: updated.collections });
    },
    [filters, updateFilters]
  );

  // Toggle brand
  const handleToggleBrand = useCallback(
    (slug: string) => {
      const updated = toggleBrand(filters, slug);
      updateFilters({ brands: updated.brands });
    },
    [filters, updateFilters]
  );

  // Toggle size
  const handleToggleSize = useCallback(
    (slug: string) => {
      const updated = toggleSize(filters, slug);
      updateFilters({ sizes: updated.sizes });
    },
    [filters, updateFilters]
  );

  // Toggle color
  const handleToggleColor = useCallback(
    (slug: string) => {
      const updated = toggleColor(filters, slug);
      updateFilters({ colors: updated.colors });
    },
    [filters, updateFilters]
  );

  // Toggle in stock
  const handleToggleInStock = useCallback(() => {
    const updated = toggleInStock(filters);
    updateFilters({ inStock: updated.inStock });
  }, [filters, updateFilters]);

  // Toggle on sale
  const handleToggleOnSale = useCallback(() => {
    const updated = toggleOnSale(filters);
    updateFilters({ onSale: updated.onSale });
  }, [filters, updateFilters]);

  // Clear all
  const handleClearAll = useCallback(() => {
    clearAllFilters();
    // Remove all filter params but keep sort
    const params = new URLSearchParams();
    const currentSort = searchParams.get("sort");
    if (currentSort) {
      params.set("sort", currentSort);
    }
    navigate(params);
  }, [searchParams, navigate]);

  // Check methods
  const isCategorySelected = useCallback(
    (slug: string) => filters.categories.includes(slug),
    [filters.categories]
  );

  const isCollectionSelected = useCallback(
    (slug: string) => filters.collections.includes(slug),
    [filters.collections]
  );

  const isBrandSelected = useCallback(
    (slug: string) => filters.brands.includes(slug),
    [filters.brands]
  );

  const isSizeSelected = useCallback(
    (slug: string) => filters.sizes.includes(slug),
    [filters.sizes]
  );

  const isColorSelected = useCallback(
    (slug: string) => filters.colors.includes(slug),
    [filters.colors]
  );

  return {
    filters,
    sort,
    hasFilters,
    filterCount,
    updateFilters,
    updateSort,
    toggleCategory: handleToggleCategory,
    toggleCollection: handleToggleCollection,
    toggleBrand: handleToggleBrand,
    toggleSize: handleToggleSize,
    toggleColor: handleToggleColor,
    toggleInStock: handleToggleInStock,
    toggleOnSale: handleToggleOnSale,
    clearAll: handleClearAll,
    isCategorySelected,
    isCollectionSelected,
    isBrandSelected,
    isSizeSelected,
    isColorSelected,
    sortOptions: SORT_OPTIONS,
  };
}

