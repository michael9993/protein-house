/**
 * Product Filtering Abstraction Layer
 * 
 * This module provides a unified interface for:
 * 1. Parsing filter state from URL search params
 * 2. Building GraphQL filters from filter state
 * 3. Serializing filter state back to URL params
 * 
 * URL is the SINGLE SOURCE OF TRUTH for filter state.
 */

import type { ProductFilterInput, ProductOrder } from "@/gql/graphql";
import { OrderDirection, ProductOrderField, StockAvailability } from "@/gql/graphql";

// ============================================================================
// Types
// ============================================================================

export interface FilterState {
  categories: string[];      // Category slugs
  collections: string[];     // Collection slugs
  brands: string[];          // Brand attribute value slugs
  sizes: string[];           // Size attribute value slugs
  colors: string[];          // Color attribute value slugs
  inStock: boolean;          // Only show in-stock items
  onSale: boolean;           // Only show discounted items
  search?: string;           // Search query
  priceMin?: number;         // Minimum price (in channel currency)
  priceMax?: number;         // Maximum price (in channel currency)
  rating?: number;           // Minimum rating (1-5 stars)
}

export interface SortState {
  field: ProductOrderField;
  direction: OrderDirection;
}

// ============================================================================
// Constants
// ============================================================================

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "sale", label: "Sale" },
  { value: "delivery-fast", label: "Fastest Delivery" },
] as const;

export type SortValue = typeof SORT_OPTIONS[number]["value"];

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse filter state from URL search params
 * This is the ONLY place where URL params are read for filtering
 */
export function parseFiltersFromURL(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): FilterState {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    const val = searchParams[key];
    return Array.isArray(val) ? val[0] : val;
  };

  const parseList = (value: string | undefined): string[] => {
    if (!value) return [];
    return value.split(",").filter(Boolean);
  };

  const parseNumber = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

  const ratingValue = get("rating");
  const parsedRating = ratingValue ? parseInt(ratingValue, 10) : undefined;
  const rating = parsedRating && parsedRating >= 1 && parsedRating <= 5 ? parsedRating : undefined;

  return {
    categories: parseList(get("categories")),
    collections: parseList(get("collections")),
    brands: parseList(get("brands")).map((s) => s.toLowerCase()),
    sizes: parseList(get("sizes")),
    colors: parseList(get("colors")),
    inStock: get("inStock") === "true",
    onSale: get("onSale") === "true",
    search: get("search") || get("q") || undefined,
    priceMin: parseNumber(get("priceMin")),
    priceMax: parseNumber(get("priceMax")),
    rating,
  };
}

/**
 * Parse sort state from URL
 */
export function parseSortFromURL(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): SortValue {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    const val = searchParams[key];
    return Array.isArray(val) ? val[0] : val;
  };

  const sort = get("sort");
  if (sort && SORT_OPTIONS.some(opt => opt.value === sort)) {
    return sort as SortValue;
  }
  return "recommended";
}

// ============================================================================
// URL Serialization
// ============================================================================

/**
 * Serialize filter state to URL search params
 * Used when updating filters via UI
 * Merges partial updates with current filter state from URL
 */
export function serializeFiltersToURL(updates: Partial<FilterState>, currentParams?: URLSearchParams): URLSearchParams {
  // Parse current filters from URL to get full state
  const currentFilters: FilterState = currentParams ? parseFiltersFromURL(currentParams) : createEmptyFilters();

  // Merge updates with current filters
  // For optional number fields (priceMin/priceMax), we need to check if the key exists in updates
  // to distinguish between "not provided" vs "explicitly set to undefined"
  const mergedFilters: FilterState = {
    categories: updates.categories !== undefined ? updates.categories : (currentFilters.categories || []),
    collections: updates.collections !== undefined ? updates.collections : (currentFilters.collections || []),
    brands: updates.brands !== undefined ? updates.brands : (currentFilters.brands || []),
    sizes: updates.sizes !== undefined ? updates.sizes : (currentFilters.sizes || []),
    colors: updates.colors !== undefined ? updates.colors : (currentFilters.colors || []),
    inStock: updates.inStock !== undefined ? updates.inStock : (currentFilters.inStock || false),
    onSale: updates.onSale !== undefined ? updates.onSale : (currentFilters.onSale || false),
    search: "search" in updates ? updates.search : (currentFilters.search || undefined),
    // Check if key exists in updates object (not just if value is undefined)
    // Use ?? (not ||) so that 0 is preserved as a valid value
    priceMin: "priceMin" in updates ? updates.priceMin : (currentFilters.priceMin ?? undefined),
    priceMax: "priceMax" in updates ? updates.priceMax : (currentFilters.priceMax ?? undefined),
    rating: "rating" in updates ? updates.rating : (currentFilters.rating ?? undefined),
  };

  // Create new params, preserving non-filter URL params (e.g. sort)
  const params = new URLSearchParams();
  if (currentParams) {
    const sort = currentParams.get("sort");
    if (sort) params.set("sort", sort);
  }

  // Helper to set or delete param
  const setParam = (key: string, values: string[] | undefined) => {
    if (values && values.length > 0) {
      params.set(key, values.join(","));
    }
  };

  const setNumberParam = (key: string, value: number | undefined) => {
    // Allow 0 as a valid value (explicit check, not falsy)
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    } else {
      // Explicitly delete if undefined/null (to remove from URL)
      params.delete(key);
    }
  };

  const setBoolParam = (key: string, value: boolean | undefined) => {
    if (value) {
      params.set(key, "true");
    } else {
      // Explicitly delete if false/undefined (to remove from URL)
      params.delete(key);
    }
  };

  // Set all filter params from merged filters
  setParam("categories", mergedFilters.categories);
  setParam("collections", mergedFilters.collections);
  setParam("brands", mergedFilters.brands);
  setParam("sizes", mergedFilters.sizes);
  setParam("colors", mergedFilters.colors);
  setBoolParam("inStock", mergedFilters.inStock);
  setBoolParam("onSale", mergedFilters.onSale);
  setNumberParam("priceMin", mergedFilters.priceMin);
  setNumberParam("priceMax", mergedFilters.priceMax);
  setNumberParam("rating", mergedFilters.rating);
  if (mergedFilters.search) {
    params.set("q", mergedFilters.search);
  }

  return params;
}

/**
 * Convert sort value to URL param
 */
export function serializeSortToURL(sort: SortValue, currentParams?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(currentParams?.toString() || "");
  if (sort && sort !== "recommended") {
    params.set("sort", sort);
  } else {
    params.delete("sort");
  }
  return params;
}

// ============================================================================
// GraphQL Filter Building
// ============================================================================

export interface BuildGraphQLFilterOptions {
  filters: FilterState;
  categoryIds?: string[];   // Pre-resolved category IDs
  collectionIds?: string[]; // Pre-resolved collection IDs
  saleCollectionIds?: string[]; // Pre-resolved "sale" collection IDs for onSale filter
  brandAttributeSlug?: string; // The actual attribute slug for brands (e.g., "brand", "manufacturer")
  sizeAttributeSlug?: string; // The actual attribute slug for sizes (e.g., "size")
  colorAttributeSlug?: string; // The actual attribute slug for colors (e.g., "color", "colour")
}

/**
 * Build GraphQL ProductFilterInput from filter state
 * Requires category/collection IDs to be pre-resolved from slugs
 */
export function buildGraphQLFilter(options: BuildGraphQLFilterOptions): ProductFilterInput | undefined {
  const { filters, categoryIds, collectionIds } = options;
  const filter: ProductFilterInput = {};

  // Category filter
  if (categoryIds && categoryIds.length > 0) {
    filter.categories = categoryIds;
  }

  // Collection filter
  if (collectionIds && collectionIds.length > 0) {
    filter.collections = collectionIds;
  }

  // Brand filter (using attributes)
  // Try common brand attribute slugs if not provided
  const attributeFilters: Array<{ slug: string; values: string[] }> = [];
  
  if (filters.brands.length > 0) {
    const brandAttrSlug = options.brandAttributeSlug || "brand";
    attributeFilters.push({
      slug: brandAttrSlug,
      values: filters.brands,
    });
  }
  
  // Size filter (using attributes)
  if (filters.sizes && filters.sizes.length > 0 && options.sizeAttributeSlug) {
    attributeFilters.push({
      slug: options.sizeAttributeSlug,
      values: filters.sizes,
    });
  }
  
  // Color filter (using attributes)
  if (filters.colors && filters.colors.length > 0) {
    const colorAttrSlug = options.colorAttributeSlug || "color";
    attributeFilters.push({
      slug: colorAttrSlug,
      values: filters.colors,
    });
  }
  
  if (attributeFilters.length > 0) {
    filter.attributes = attributeFilters;
  }


  // Stock filter
  if (filters.inStock) {
    filter.stockAvailability = StockAvailability.InStock;
  }

  // Sale filter — collection-based approach:
  // Map onSale to the "sale" collection (maintained in Saleor).
  // Also set isPublished=true as a safety net.
  if (filters.onSale) {
    filter.isPublished = true;
    if (options.saleCollectionIds && options.saleCollectionIds.length > 0) {
      // Merge sale collection IDs with any existing collection filter
      const existing = filter.collections || [];
      filter.collections = [...new Set([...existing, ...options.saleCollectionIds])];
    }
  }

  // Price range filter
  // Allow 0 as a valid filter value (explicit check, not falsy)
  if (filters.priceMin !== undefined && filters.priceMin !== null || 
      filters.priceMax !== undefined && filters.priceMax !== null) {
    filter.minimalPrice = {
      gte: filters.priceMin !== undefined && filters.priceMin !== null ? filters.priceMin : undefined,
      lte: filters.priceMax !== undefined && filters.priceMax !== null ? filters.priceMax : undefined,
    };
  }

  // Search filter
  if (filters.search) {
    filter.search = filters.search;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}


/**
 * Convert sort value to GraphQL sort input
 */
export function buildGraphQLSort(sort: SortValue): ProductOrder {
  // Dynamic import to avoid circular dependencies
  switch (sort) {
    case "price-asc":
      return { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Asc };
    case "price-desc":
      return { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Desc };
    case "newest":
      return { field: ProductOrderField.Date, direction: OrderDirection.Desc };
    case "name-asc":
      return { field: ProductOrderField.Name, direction: OrderDirection.Asc };
    case "name-desc":
      return { field: ProductOrderField.Name, direction: OrderDirection.Desc };
    case "delivery-fast":
      // No server-side metadata sort — use rating as fallback; client-side re-sorts by delivery days
      return { field: ProductOrderField.Rating, direction: OrderDirection.Desc };
    default:
      return { field: ProductOrderField.Rating, direction: OrderDirection.Desc };
  }
}

// ============================================================================
// Filter State Utilities
// ============================================================================

/**
 * Create empty filter state
 */
export function createEmptyFilters(): FilterState {
  return {
    categories: [],
    collections: [],
    brands: [],
    sizes: [],
    colors: [],
    inStock: false,
    onSale: false,
    priceMin: undefined,
    priceMax: undefined,
    rating: undefined,
  };
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.categories.length > 0 ||
    filters.collections.length > 0 ||
    filters.brands.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.inStock ||
    filters.onSale ||
    !!filters.search ||
    (filters.priceMin !== undefined && filters.priceMin !== null) ||
    (filters.priceMax !== undefined && filters.priceMax !== null) ||
    (filters.rating !== undefined && filters.rating !== null)
  );
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  count += filters.categories.length;
  count += filters.collections.length;
  count += filters.brands.length;
  count += filters.sizes.length;
  count += filters.colors.length;
  if (filters.inStock) count++;
  if (filters.onSale) count++;
  // Allow 0 as a valid filter value (explicit check, not falsy)
  if ((filters.priceMin !== undefined && filters.priceMin !== null) || 
      (filters.priceMax !== undefined && filters.priceMax !== null)) count++;
  if (filters.rating !== undefined && filters.rating !== null) count++;
  return count;
}

// ============================================================================
// Filter Updates (Immutable)
// ============================================================================

export function toggleCategory(filters: FilterState, slug: string): FilterState {
  const categories = filters.categories.includes(slug)
    ? filters.categories.filter(s => s !== slug)
    : [...filters.categories, slug];
  return { ...filters, categories };
}

export function toggleCollection(filters: FilterState, slug: string): FilterState {
  const collections = filters.collections.includes(slug)
    ? filters.collections.filter(s => s !== slug)
    : [...filters.collections, slug];
  return { ...filters, collections };
}

export function toggleBrand(filters: FilterState, slug: string): FilterState {
  const brands = filters.brands.includes(slug)
    ? filters.brands.filter(s => s !== slug)
    : [...filters.brands, slug];
  return { ...filters, brands };
}

export function toggleSize(filters: FilterState, slug: string): FilterState {
  const sizes = filters.sizes.includes(slug)
    ? filters.sizes.filter(s => s !== slug)
    : [...filters.sizes, slug];
  return { ...filters, sizes };
}

export function toggleColor(filters: FilterState, slug: string): FilterState {
  const colors = filters.colors.includes(slug)
    ? filters.colors.filter(c => c !== slug)
    : [...filters.colors, slug];
  return { ...filters, colors };
}


export function toggleInStock(filters: FilterState): FilterState {
  return { ...filters, inStock: !filters.inStock };
}

export function toggleOnSale(filters: FilterState): FilterState {
  return { ...filters, onSale: !filters.onSale };
}

export function clearAllFilters(): FilterState {
  return createEmptyFilters();
}

