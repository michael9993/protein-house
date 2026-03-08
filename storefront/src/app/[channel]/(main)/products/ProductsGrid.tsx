"use client";

/**
 * ProductsGrid - Premium Athletic Products Grid
 *
 * Features:
 * - Bold staggered entrance animations
 * - Dramatic loading states
 * - Improved empty state design
 * - Infinite scroll with smooth loading
 * - Dynamic display modes (1, 2, 4 columns)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { ProductCard } from "./components/ProductCard";
import { ProductCardSkeleton } from "./components/ProductCardSkeleton";
import { DesignStyles } from "./DesignStyles";
import {
  DisplayModeToggle,
  useDisplayMode,
  getGridClasses,
  getGapClasses,
  type DisplayMode,
} from "./components/DisplayModeToggle";
import type { ProductListItemFragment, ProductOrder } from "@/gql/graphql";
import {
  type FilterState,
  hasActiveFilters as checkActiveFilters,
} from "@/lib/filters";
import { useFiltersText, useBranding, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { getLanguageCodeForChannel } from "@/lib/language";
import { getProductShippingEstimate } from "@/lib/shipping";

interface ProductsGridProps {
  initialProducts: ProductListItemFragment[];
  channel: string;
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
  sortBy: ProductOrder;
  filters: FilterState;
  showDisplayToggle?: boolean;
  displayMode?: DisplayMode;
}

export function ProductsGrid({
  initialProducts,
  channel,
  totalCount: _totalCount,
  hasNextPage: initialHasNextPage,
  endCursor: initialEndCursor,
  sortBy,
  filters,
  showDisplayToggle = true,
  displayMode: externalDisplayMode,
}: ProductsGridProps) {
  const [products, setProducts] =
    useState<ProductListItemFragment[]>(initialProducts);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [endCursor, setEndCursor] = useState(initialEndCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayProducts, setDisplayProducts] =
    useState<ProductListItemFragment[]>(initialProducts);
  const loaderRef = useRef<HTMLDivElement>(null);
  const prevFiltersRef = useRef<string>(JSON.stringify(filters));
  const prevSortRef = useRef<string>(JSON.stringify(sortBy));

  // Display mode state - use external prop if provided, otherwise use internal hook
  const [internalDisplayMode, setInternalDisplayMode] = useDisplayMode(4);
  const displayMode = externalDisplayMode ?? internalDisplayMode;
  const setDisplayMode = setInternalDisplayMode;

  const filtersText = useFiltersText();
  const branding = useBranding();
  const cdStyle = useComponentStyle("plp.productGrid");
  const cdClasses = useComponentClasses("plp.productGrid");

  // Detect filter/sort changes
  useEffect(() => {
    const currentFiltersStr = JSON.stringify(filters);
    const currentSortStr = JSON.stringify(sortBy);

    const filtersChanged = prevFiltersRef.current !== currentFiltersStr;
    const sortChanged = prevSortRef.current !== currentSortStr;

    if (filtersChanged || sortChanged) {
      setIsFiltering(true);
      prevFiltersRef.current = currentFiltersStr;
      prevSortRef.current = currentSortStr;

      setProducts(initialProducts);
      setHasNextPage(initialHasNextPage);
      setEndCursor(initialEndCursor);

      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [filters, sortBy, initialProducts, initialHasNextPage, initialEndCursor]);

  // Client-side filtering
  useEffect(() => {
    if (!isFiltering) {
      let filtered = products.filter((product) => {
        if (filters.inStock) {
          const hasStock =
            product.variants?.some(
              (v) => v.quantityAvailable && v.quantityAvailable > 0
            ) ?? true;
          if (!hasStock) return false;
        }

        if (filters.onSale) {
          const currentPrice =
            product.pricing?.priceRange?.start?.gross?.amount;
          const originalPrice =
            product.pricing?.priceRangeUndiscounted?.start?.gross?.amount;
          if (!currentPrice || !originalPrice || currentPrice >= originalPrice)
            return false;
        }

        if (filters.rating !== undefined && filters.rating !== null) {
          const productRating = (product as any).rating;
          if (productRating === null || productRating === undefined) {
            return false;
          }
          if (Math.round(productRating) < filters.rating) {
            return false;
          }
        }

        return true;
      });

      // Apply "sale" sort filter
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const sortValue = urlParams.get("sort");
        if (sortValue === "sale") {
          filtered = filtered.filter((product) => {
            const currentPrice =
              product.pricing?.priceRange?.start?.gross?.amount;
            const originalPrice =
              product.pricing?.priceRangeUndiscounted?.start?.gross?.amount;
            return (
              currentPrice && originalPrice && currentPrice < originalPrice
            );
          });
        }

        // Client-side sort by delivery speed (metadata-based, can't be done server-side)
        if (sortValue === "delivery-fast") {
          filtered = [...filtered].sort((a, b) => {
            const estA = getProductShippingEstimate((a as any).metadata);
            const estB = getProductShippingEstimate((b as any).metadata);
            const daysA = estA?.maxDays ?? 999;
            const daysB = estB?.maxDays ?? 999;
            return daysA - daysB;
          });
        }
      }

      setDisplayProducts(filtered);
    }
  }, [products, filters, isFiltering, sortBy]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage || !endCursor) return;

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ProductListMore($first: Int!, $after: String!, $channel: String!, $sortBy: ProductOrder, $languageCode: LanguageCodeEnum!) {
              products(first: $first, after: $after, channel: $channel, sortBy: $sortBy) {
                totalCount
                edges {
                  node {
                    id
                    name
                    translation(languageCode: $languageCode) { name }
                    slug
                    created
                    pricing {
                      priceRange {
                        start { gross { amount, currency } }
                        stop { gross { amount, currency } }
                      }
                      priceRangeUndiscounted {
                        start { gross { amount, currency } }
                        stop { gross { amount, currency } }
                      }
                    }
                    category { id, name, translation(languageCode: $languageCode) { name }, slug }
                    thumbnail(size: 1024, format: WEBP) { url, alt }
                    media { url, alt }
                    variants { id, quantityAvailable }
                    attributes {
                      attribute { id, name, translation(languageCode: $languageCode) { name }, slug }
                      values { id, name, translation(languageCode: $languageCode) { name }, slug, file { url } }
                    }
                    collections { id, name, translation(languageCode: $languageCode) { name }, slug }
                    rating
                  }
                  cursor
                }
                pageInfo { hasNextPage, endCursor }
              }
            }
          `,
          variables: { first: 12, after: endCursor, channel, sortBy, languageCode: getLanguageCodeForChannel(channel) },
        }),
      });

      const { data } = (await response.json()) as { data?: any };

      if (data?.products) {
        const newProducts = data.products.edges.map((edge: any) => edge.node);
        setProducts((prev) => [...prev, ...newProducts]);
        setHasNextPage(data.products.pageInfo.hasNextPage);
        setEndCursor(data.products.pageInfo.endCursor);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasNextPage, endCursor, channel, sortBy]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasNextPage, isLoading, loadMore]);

  const hasFilters = checkActiveFilters(filters);

  // Empty State
  if (displayProducts.length === 0 && !isLoading && !isFiltering) {
    return (
      <>
        <DesignStyles />
        <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-8 py-24 text-center shadow-inner">
          <div
            className="mb-8 flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.primary}15, ${branding.colors.primary}05)`,
            }}
          >
            <Package
              className="h-12 w-12"
              style={{ color: branding.colors.primary }}
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-xl font-bold text-neutral-800">
            {filtersText.noProductsTitle}
          </h3>
          <p className="mt-3 max-w-md text-base text-neutral-500">
            {hasFilters
              ? filtersText.noProductsWithFilters
              : filtersText.noProductsEmpty}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DesignStyles />

      {/* Display Mode Toggle */}
      {showDisplayToggle && (
        <div className="mb-4 flex items-center justify-end">
          <DisplayModeToggle
            value={displayMode}
            onChange={setDisplayMode}
          />
        </div>
      )}

      {/* Loading Overlay for Filtering */}
      {isFiltering && (
        <div
          className="relative mb-8 overflow-hidden rounded-3xl p-16"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.primary}08, ${branding.colors.secondary}05)`,
          }}
        >
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div
                className="h-14 w-14 animate-spin rounded-full border-4 border-t-transparent"
                style={{ borderColor: `${branding.colors.primary}20`, borderTopColor: branding.colors.primary }}
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
              {filtersText.filteringProducts}
            </p>
          </div>
        </div>
      )}

      {/* Product Grid - Dynamic Layout */}
      <div
        data-cd="plp-productGrid"
        className={`grid ${getGridClasses(displayMode)} ${getGapClasses(displayMode)} ${
          !isFiltering ? "v7-grid-enter" : ""
        } ${cdClasses}`}
        style={buildComponentStyle("plp.productGrid", cdStyle)}
      >
        {!isFiltering &&
          displayProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 8}
              loading={index < 8 ? "eager" : "lazy"}
              displayMode={displayMode}
            />
          ))}

        {/* Loading skeletons during filtering */}
        {isFiltering &&
          Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} displayMode={displayMode} />
          ))}

        {/* Loading skeletons for pagination */}
        {isLoading &&
          !isFiltering &&
          Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`pagination-skeleton-${i}`} displayMode={displayMode} />
          ))}
      </div>

      {/* Infinite scroll trigger */}
      <div
        ref={loaderRef}
        className="mt-10 flex items-center justify-center py-8"
      >
        {isLoading && !isFiltering && (
          <div className="flex items-center gap-3">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: branding.colors.primary }}
            />
            <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">
              {filtersText.loadingMore}
            </span>
          </div>
        )}
        {!hasNextPage &&
          displayProducts.length > 0 &&
          !isLoading &&
          !isFiltering && (
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-1 w-16 rounded-full"
                style={{ backgroundColor: branding.colors.primary }}
              />
              <p className="text-base font-bold text-neutral-700">
                {filtersText.seenAllProducts.replace(
                  "{count}",
                  displayProducts.length.toLocaleString()
                )}
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                {filtersText.tryAdjustingFilters}
              </p>
            </div>
          )}
      </div>
    </>
  );
}
