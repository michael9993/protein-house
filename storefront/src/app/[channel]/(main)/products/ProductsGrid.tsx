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
  const [displayProducts, setDisplayProducts] =
    useState<ProductListItemFragment[]>(initialProducts);
  const loaderRef = useRef<HTMLDivElement>(null);
  const prevInitialRef = useRef(initialProducts);

  // Prefetch cache — fetch the next page before the user scrolls to the bottom
  const prefetchedRef = useRef<{
    cursor: string;
    products: ProductListItemFragment[];
    hasNextPage: boolean;
    endCursor: string | null;
  } | null>(null);
  const prefetchingRef = useRef(false);

  // Display mode state - use external prop if provided, otherwise use internal hook
  const [internalDisplayMode, setInternalDisplayMode] = useDisplayMode(4);
  const displayMode = externalDisplayMode ?? internalDisplayMode;
  const setDisplayMode = setInternalDisplayMode;

  const filtersText = useFiltersText();
  const branding = useBranding();
  const cdStyle = useComponentStyle("plp.productGrid");
  const cdClasses = useComponentClasses("plp.productGrid");

  // Reset when server returns new initial products (filter/sort changed)
  useEffect(() => {
    if (prevInitialRef.current !== initialProducts) {
      prevInitialRef.current = initialProducts;
      setProducts(initialProducts);
      setHasNextPage(initialHasNextPage);
      setEndCursor(initialEndCursor);
      // Scroll to top of grid so user sees new results immediately
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [initialProducts, initialHasNextPage, initialEndCursor]);

  // Client-side filtering (inStock, onSale, rating are not server-filterable)
  useEffect(() => {
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

    // Client-side sort by delivery speed (metadata-based, can't be done server-side)
    const sortField = sortBy?.field;
    const isSaleSort = !sortField && filters.onSale;
    if (isSaleSort) {
      filtered = filtered.filter((product) => {
        const currentPrice =
          product.pricing?.priceRange?.start?.gross?.amount;
        const originalPrice =
          product.pricing?.priceRangeUndiscounted?.start?.gross?.amount;
        return currentPrice && originalPrice && currentPrice < originalPrice;
      });
    }

    setDisplayProducts(filtered);
  }, [products, filters, sortBy]);

  const fetchProducts = useCallback(async (cursor: string) => {
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
        variables: { first: 24, after: cursor, channel, sortBy, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    const { data } = (await response.json()) as { data?: any };
    return data?.products ?? null;
  }, [channel, sortBy]);

  // Prefetch the next page in the background
  const prefetchNext = useCallback(async (cursor: string | null) => {
    if (!cursor || prefetchingRef.current) return;
    if (prefetchedRef.current?.cursor === cursor) return; // Already prefetched this cursor

    prefetchingRef.current = true;
    try {
      const result = await fetchProducts(cursor);
      if (result) {
        prefetchedRef.current = {
          cursor,
          products: result.edges.map((edge: any) => edge.node),
          hasNextPage: result.pageInfo.hasNextPage,
          endCursor: result.pageInfo.endCursor,
        };
      }
    } catch {
      // Prefetch failures are silent — loadMore will retry
    } finally {
      prefetchingRef.current = false;
    }
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage || !endCursor) return;

    // Check if we have prefetched data for this cursor
    if (prefetchedRef.current?.cursor === endCursor) {
      const cached = prefetchedRef.current;
      prefetchedRef.current = null;
      setProducts((prev) => [...prev, ...cached.products]);
      setHasNextPage(cached.hasNextPage);
      setEndCursor(cached.endCursor);
      // Immediately start prefetching the NEXT page
      if (cached.hasNextPage && cached.endCursor) {
        prefetchNext(cached.endCursor);
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchProducts(endCursor);
      if (result) {
        const newProducts = result.edges.map((edge: any) => edge.node);
        setProducts((prev) => [...prev, ...newProducts]);
        setHasNextPage(result.pageInfo.hasNextPage);
        setEndCursor(result.pageInfo.endCursor);
        // Start prefetching next page
        if (result.pageInfo.hasNextPage && result.pageInfo.endCursor) {
          prefetchNext(result.pageInfo.endCursor);
        }
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasNextPage, endCursor, fetchProducts, prefetchNext]);

  // Prefetch next page as soon as current page renders
  useEffect(() => {
    if (hasNextPage && endCursor && !prefetchedRef.current) {
      prefetchNext(endCursor);
    }
  }, [hasNextPage, endCursor, prefetchNext]);

  // Clear prefetch cache on filter/sort change
  useEffect(() => {
    prefetchedRef.current = null;
    prefetchingRef.current = false;
  }, [initialProducts]);

  // Intersection Observer — trigger well before user reaches the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "800px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasNextPage, isLoading, loadMore]);

  const hasFilters = checkActiveFilters(filters);

  // Empty State
  if (displayProducts.length === 0 && !isLoading) {
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

      {/* Product Grid - Dynamic Layout */}
      <div
        data-cd="plp-productGrid"
        className={`grid ${getGridClasses(displayMode)} ${getGapClasses(displayMode)} v7-grid-enter ${cdClasses}`}
        style={buildComponentStyle("plp.productGrid", cdStyle)}
      >
        {displayProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 8}
              loading={index < 8 ? "eager" : "lazy"}
              displayMode={displayMode}
            />
          ))}

        {/* Loading skeletons for pagination */}
        {isLoading &&
          Array.from({ length: displayMode === 1 ? 3 : 8 }).map((_, i) => (
            <ProductCardSkeleton key={`pagination-skeleton-${i}`} displayMode={displayMode} />
          ))}
      </div>

      {/* Infinite scroll trigger */}
      <div
        ref={loaderRef}
        className="mt-10 flex items-center justify-center py-8"
      >
        {isLoading && (
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
          (
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
