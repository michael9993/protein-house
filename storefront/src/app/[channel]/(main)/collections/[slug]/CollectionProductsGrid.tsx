"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/ui/components/ProductCard";
import type { ProductListItemFragment } from "@/gql/graphql";

interface CollectionProductsGridProps {
  initialProducts: ProductListItemFragment[];
  collectionSlug: string;
  channel: string;
  totalCount: number;
  minPriceFilter?: number;
  maxPriceFilter?: number;
  inStockFilter?: boolean;
  onSaleFilter?: boolean;
}

export function CollectionProductsGrid({
  initialProducts,
  collectionSlug: _collectionSlug,
  channel: _channel,
  totalCount: _totalCount,
  minPriceFilter,
  maxPriceFilter,
  inStockFilter,
  onSaleFilter,
}: CollectionProductsGridProps) {
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
            Showing all {filteredProducts.length} products in this collection
          </p>
        </div>
      )}
    </>
  );
}

