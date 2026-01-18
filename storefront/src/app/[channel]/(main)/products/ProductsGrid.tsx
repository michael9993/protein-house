"use client";

/**
 * ProductsGrid Component
 * 
 * Displays products in a responsive grid with infinite scroll pagination.
 * Optimized for mobile-first design with efficient spacing.
 * Includes animations for filtering and product appearance.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { ProductCard, ProductCardSkeleton } from "@/ui/components/ProductCard";
import type { ProductListItemFragment, ProductOrder } from "@/gql/graphql";
import { type FilterState, hasActiveFilters as checkActiveFilters } from "@/lib/filters";
import { useFiltersText } from "@/providers/StoreConfigProvider";

interface ProductsGridProps {
  initialProducts: ProductListItemFragment[];
  channel: string;
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
  sortBy: ProductOrder;
  filters: FilterState;
}

export function ProductsGrid({
  initialProducts,
  channel,
  totalCount: _totalCount,
  hasNextPage: initialHasNextPage,
  endCursor: initialEndCursor,
  sortBy,
  filters,
}: ProductsGridProps) {
  const [products, setProducts] = useState<ProductListItemFragment[]>(initialProducts);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [endCursor, setEndCursor] = useState(initialEndCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<ProductListItemFragment[]>(initialProducts);
  const loaderRef = useRef<HTMLDivElement>(null);
  const prevFiltersRef = useRef<string>(JSON.stringify(filters));
  const prevSortRef = useRef<string>(JSON.stringify(sortBy));
  const filtersText = useFiltersText();

  // Detect filter/sort changes and show loading state
  useEffect(() => {
    const currentFiltersStr = JSON.stringify(filters);
    const currentSortStr = JSON.stringify(sortBy);
    
    const filtersChanged = prevFiltersRef.current !== currentFiltersStr;
    const sortChanged = prevSortRef.current !== currentSortStr;
    
    if (filtersChanged || sortChanged) {
      setIsFiltering(true);
      prevFiltersRef.current = currentFiltersStr;
      prevSortRef.current = currentSortStr;
      
      // Reset products when filters/sort change
      setProducts(initialProducts);
      setHasNextPage(initialHasNextPage);
      setEndCursor(initialEndCursor);
      
      // Hide loading after a short delay to allow for smooth transition
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [filters, sortBy, initialProducts, initialHasNextPage, initialEndCursor]);

  // Update display products with animation delay
  useEffect(() => {
    if (!isFiltering) {
      // Apply client-side filters for additional filtering after server-side
      // NOTE: Rating filtering is done client-side because Saleor GraphQL schema
      // does not support rating filtering directly in ProductFilterInput.
      // This is a limitation - if products have ratings, we filter them here.
      let filtered = products.filter((product) => {
        if (filters.inStock) {
          const hasStock = product.variants?.some(v => v.quantityAvailable && v.quantityAvailable > 0) ?? true;
          if (!hasStock) return false;
        }

        if (filters.onSale) {
          const currentPrice = product.pricing?.priceRange?.start?.gross?.amount;
          const originalPrice = product.pricing?.priceRangeUndiscounted?.start?.gross?.amount;
          if (!currentPrice || !originalPrice || currentPrice >= originalPrice) return false;
        }

        // Rating filter (client-side only - Saleor doesn't support it in GraphQL)
        if (filters.rating !== undefined && filters.rating !== null) {
          const productRating = (product as any).rating;
          if (productRating === null || productRating === undefined) {
            // If product has no rating, exclude it when filtering by rating
            return false;
          }
          // Round rating to nearest integer for comparison
          const roundedRating = Math.round(productRating);
          if (roundedRating < filters.rating) {
            return false;
          }
        }

        return true;
      });
      
      // Apply "sale" sort filter - show only products on sale (check URL parameter)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sortValue = urlParams.get("sort");
        if (sortValue === "sale") {
          filtered = filtered.filter((product) => {
            const currentPrice = product.pricing?.priceRange?.start?.gross?.amount;
            const originalPrice = product.pricing?.priceRangeUndiscounted?.start?.gross?.amount;
            return currentPrice && originalPrice && currentPrice < originalPrice;
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
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ProductListMore($first: Int!, $after: String!, $channel: String!, $sortBy: ProductOrder) {
              products(first: $first, after: $after, channel: $channel, sortBy: $sortBy) {
                totalCount
                edges {
                  node {
                    id
                    name
                    slug
                    pricing {
                      priceRange {
                        start {
                          gross { amount, currency }
                        }
                        stop {
                          gross { amount, currency }
                        }
                      }
                      priceRangeUndiscounted {
                        start {
                          gross { amount, currency }
                        }
                        stop {
                          gross { amount, currency }
                        }
                      }
                    }
                    category { id, name, slug }
                    thumbnail(size: 1024, format: WEBP) { url, alt }
                    variants { id, quantityAvailable }
                  }
                  cursor
                }
                pageInfo { hasNextPage, endCursor }
              }
            }
          `,
          variables: {
            first: 12,
            after: endCursor,
            channel,
            sortBy,
          },
        }),
      });

      const { data } = await response.json() as { data?: any };
      
      if (data?.products) {
        const newProducts = data.products.edges.map((edge: any) => edge.node);
        setProducts(prev => [...prev, ...newProducts]);
        setHasNextPage(data.products.pageInfo.hasNextPage);
        setEndCursor(data.products.pageInfo.endCursor);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasNextPage, endCursor, channel, sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasNextPage, isLoading, loadMore]);

  const hasFilters = checkActiveFilters(filters);

  if (displayProducts.length === 0 && !isLoading && !isFiltering) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white/80 py-16 px-4 text-center shadow-sm sm:py-20 animate-fade-in">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 sm:h-20 sm:w-20">
          <svg className="h-8 w-8 text-neutral-400 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-base font-semibold text-neutral-700 sm:text-lg">{filtersText.noProductsTitle}</p>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          {hasFilters ? filtersText.noProductsWithFilters : filtersText.noProductsEmpty}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay for Filtering */}
      {isFiltering && (
        <div className="relative mb-6 rounded-xl border border-neutral-200 bg-white/95 backdrop-blur-sm p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-transparent"></div>
              <div 
                className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent opacity-50"
                style={{ 
                  borderTopColor: "var(--store-primary, #3b82f6)",
                  animationDirection: "reverse",
                  animationDuration: "0.8s"
                }}
              ></div>
            </div>
            <p className="text-sm font-medium text-neutral-600">{filtersText.filteringProducts}</p>
          </div>
        </div>
      )}

      {/* Product Grid - 4 columns like SportZone */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-6 xl:grid-cols-4 xl:gap-6">
        {!isFiltering && displayProducts.map((product, index) => (
          <div
            key={product.id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
              animationFillMode: "both",
            }}
          >
            <ProductCard
              product={product}
              priority={index < 8}
              loading={index < 8 ? "eager" : "lazy"}
            />
          </div>
        ))}
        
        {/* Loading skeletons during filtering */}
        {isFiltering && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="animate-fade-in"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <ProductCardSkeleton />
              </div>
            ))}
          </>
        )}
        
        {/* Loading skeletons for pagination */}
        {isLoading && !isFiltering && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`pagination-skeleton-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="mt-6 flex items-center justify-center py-6 sm:mt-8 sm:py-8">
        {isLoading && !isFiltering && (
          <div className="flex items-center gap-2.5 text-neutral-500 animate-fade-in">
            <svg className="h-5 w-5 animate-spin sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium sm:text-base">{filtersText.loadingMore}</span>
          </div>
        )}
        {!hasNextPage && displayProducts.length > 0 && !isLoading && !isFiltering && (
          <div className="text-center animate-fade-in">
            <p className="text-sm font-medium text-neutral-600 sm:text-base">
              {filtersText.seenAllProducts.replace("{count}", displayProducts.length.toLocaleString())}
            </p>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              {filtersText.tryAdjustingFilters}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
