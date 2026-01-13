"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/ui/components/ProductCard";
import type { ProductListItemFragment } from "@/gql/graphql";

interface SearchProductsGridProps {
  initialProducts: ProductListItemFragment[];
  searchQuery: string;
  channel: string;
  totalCount: number;
  minPriceFilter?: number;
  maxPriceFilter?: number;
  inStockFilter?: boolean;
  onSaleFilter?: boolean;
}

export function SearchProductsGrid({
  initialProducts,
  searchQuery,
  channel: _channel,
  totalCount: _totalCount,
  minPriceFilter,
  maxPriceFilter,
  inStockFilter,
  onSaleFilter,
}: SearchProductsGridProps) {
  const [products, setProducts] = useState<ProductListItemFragment[]>(initialProducts);

  // Reset products when filters change
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Apply client-side filters
  const filteredProducts = products.filter((product) => {
    // Price filter
    const price = product.pricing?.priceRange?.start?.gross?.amount;
    if (price !== undefined) {
      if (minPriceFilter !== undefined && price < minPriceFilter) return false;
      if (maxPriceFilter !== undefined && price > maxPriceFilter) return false;
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

  const hasActiveFilters = minPriceFilter !== undefined || maxPriceFilter !== undefined || inStockFilter || onSaleFilter;

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 text-center shadow-sm">
        <svg className="mb-4 h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-lg font-medium text-neutral-600">No products found</p>
        <p className="mt-1 text-sm text-neutral-500">
          {hasActiveFilters ? "Try adjusting your filters" : "Try a different search term"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 8}
            loading={index < 8 ? "eager" : "lazy"}
          />
        ))}
      </div>

      {/* End message */}
      {filteredProducts.length > 0 && (
        <div className="mt-8 flex items-center justify-center py-4">
          <p className="text-sm text-neutral-500">
            Showing all {filteredProducts.length} results for "{searchQuery}"
          </p>
        </div>
      )}
    </>
  );
}

