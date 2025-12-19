"use client";

import { ProductCard, ProductCardSkeleton } from "@/ui/components/ProductCard";
import type { ProductListItemFragment } from "@/gql/graphql";
import { storeConfig } from "@/config";

interface ProductGridProps {
  products: readonly ProductListItemFragment[];
  columns?: 2 | 3 | 4 | 5;
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  columns = 4,
  title,
  subtitle,
  showViewAll = false,
  viewAllHref = "/products",
  isLoading = false,
  emptyMessage = "No products found",
}: ProductGridProps) {
  const { branding } = storeConfig;
  
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {title && (
            <div className="mb-8">
              <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
              {subtitle && <div className="mt-2 h-5 w-64 animate-pulse rounded bg-neutral-200" />}
            </div>
          )}
          <div className={`grid gap-6 ${gridCols[columns]}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {title && (
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: branding.colors.text }}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-neutral-600">{subtitle}</p>
              )}
            </div>
          )}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium text-neutral-600">{emptyMessage}</p>
            <p className="mt-1 text-sm text-neutral-500">Check back later for new arrivals</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {title && (
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: branding.colors.text }}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-neutral-600">{subtitle}</p>
              )}
            </div>
            {showViewAll && (
              <a
                href={viewAllHref}
                className="hidden items-center gap-1 text-sm font-medium transition-colors hover:opacity-80 sm:flex"
                style={{ color: branding.colors.primary }}
              >
                View All
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Product Grid */}
        <div className={`grid gap-4 sm:gap-6 ${gridCols[columns]}`}>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              loading={index < 4 ? "eager" : "lazy"}
            />
          ))}
        </div>

        {/* Mobile View All */}
        {showViewAll && (
          <div className="mt-8 text-center sm:hidden">
            <a
              href={viewAllHref}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: branding.colors.primary }}
            >
              View All Products
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

