"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ProductCard, ProductCardSkeleton } from "@/ui/components/ProductCard";
import type { ProductListItemFragment, ProductOrder } from "@/gql/graphql";

// Price range definitions - must match the filter component
const PRICE_RANGES = [
  { id: "0-25", min: 0, max: 25 },
  { id: "25-50", min: 25, max: 50 },
  { id: "50-100", min: 50, max: 100 },
  { id: "100-200", min: 100, max: 200 },
  { id: "200+", min: 200, max: null },
];

interface ProductsGridProps {
  initialProducts: ProductListItemFragment[];
  channel: string;
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
  sortBy: ProductOrder;
  categoryFilter?: string[];
  minPriceFilter?: number;
  maxPriceFilter?: number;
  priceRangesFilter?: string[];
  inStockFilter?: boolean;
  onSaleFilter?: boolean;
}

export function ProductsGrid({
  initialProducts,
  channel,
  totalCount,
  hasNextPage: initialHasNextPage,
  endCursor: initialEndCursor,
  sortBy,
  categoryFilter = [],
  minPriceFilter,
  maxPriceFilter,
  priceRangesFilter = [],
  inStockFilter,
  onSaleFilter,
}: ProductsGridProps) {
  const [products, setProducts] = useState<ProductListItemFragment[]>(initialProducts);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [endCursor, setEndCursor] = useState(initialEndCursor);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset products when filters/sort change
  useEffect(() => {
    setProducts(initialProducts);
    setHasNextPage(initialHasNextPage);
    setEndCursor(initialEndCursor);
  }, [initialProducts, initialHasNextPage, initialEndCursor]);

  // Check if price matches any of the selected price ranges
  const matchesPriceRanges = (price: number, ranges: string[]): boolean => {
    if (ranges.length === 0) return true;
    
    return ranges.some(rangeId => {
      const range = PRICE_RANGES.find(r => r.id === rangeId);
      if (!range) return false;
      
      const aboveMin = price >= range.min;
      const belowMax = range.max === null || price <= range.max;
      return aboveMin && belowMax;
    });
  };

  // Apply client-side filters
  // Note: Category filtering is now done server-side, so we skip client-side category filtering
  const filteredProducts = products.filter((product) => {

    // Price filter - support both legacy (min/max) and new (price ranges)
    const price = product.pricing?.priceRange?.start?.gross?.amount;
    if (price !== undefined) {
      // New price ranges filter (multiple checkboxes)
      if (priceRangesFilter.length > 0) {
        if (!matchesPriceRanges(price, priceRangesFilter)) {
          return false;
        }
      }
      // Legacy min/max price filter (for backward compatibility)
      else {
        if (minPriceFilter !== undefined && price < minPriceFilter) return false;
        if (maxPriceFilter !== undefined && price > maxPriceFilter) return false;
      }
    }

    // In stock filter
    if (inStockFilter) {
      const hasStock = product.variants?.some(v => v.quantityAvailable && v.quantityAvailable > 0) ?? true;
      if (!hasStock) return false;
    }

    // On sale filter
    if (onSaleFilter) {
      const currentPrice = product.pricing?.priceRange?.start?.gross?.amount;
      const originalPrice = product.pricing?.priceRangeUndiscounted?.start?.gross?.amount;
      if (!currentPrice || !originalPrice || currentPrice >= originalPrice) return false;
    }

    return true;
  });

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
        headers: {
          "Content-Type": "application/json",
        },
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
                          gross {
                            amount
                            currency
                          }
                        }
                        stop {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                      priceRangeUndiscounted {
                        start {
                          gross {
                            amount
                            currency
                          }
                        }
                        stop {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                    }
                    category {
                      id
                      name
                      slug
                    }
                    thumbnail(size: 1024, format: WEBP) {
                      url
                      alt
                    }
                    variants {
                      id
                      quantityAvailable
                    }
                  }
                  cursor
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
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

      const { data } = await response.json();
      
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

  const hasActiveFilters = categoryFilter.length > 0 || priceRangesFilter.length > 0 || minPriceFilter !== undefined || maxPriceFilter !== undefined || inStockFilter || onSaleFilter;

  if (filteredProducts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 text-center shadow-sm">
        <svg className="mb-4 h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-lg font-medium text-neutral-600">No products found</p>
        <p className="mt-1 text-sm text-neutral-500">
          {hasActiveFilters ? "Try adjusting your filters" : "Check back later for new products"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 8}
            loading={index < 8 ? "eager" : "lazy"}
          />
        ))}
        
        {/* Loading skeletons */}
        {isLoading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="mt-8 flex items-center justify-center py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-500">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading more products...</span>
          </div>
        )}
        {!hasNextPage && filteredProducts.length > 0 && !isLoading && (
          <p className="text-sm text-neutral-500">
            You've seen all {filteredProducts.length} products
          </p>
        )}
      </div>
    </>
  );
}
