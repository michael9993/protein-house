"use client";

/**
 * ProductsContent - Unified products content with display mode toggle
 *
 * Combines results header, display mode toggle, and products grid
 * in a clean, professional layout with all controls in one row.
 */

import { SortBy } from "@/ui/components/SortBy";
import { SearchBar } from "@/ui/components/nav/components/SearchBar";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { ProductFiltersWrapper } from "./ProductFiltersWrapper";
import { ActiveFiltersTags } from "./ActiveFiltersTags";
import { ProductsGrid } from "./ProductsGrid";
import {
  DisplayModeToggle,
  useDisplayMode,
} from "./components/DisplayModeToggle";
import { useFiltersText } from "@/providers/StoreConfigProvider";
import type { FilterState } from "@/lib/filters";
import type { ProductListItemFragment, ProductOrder } from "@/gql/graphql";
import type { Category } from "@/ui/components/Filters/ProductFilters";

interface ProductsContentProps {
  channel: string;
  filters: FilterState;
  productCount: number;
  clearSearchHref: string | null;
  initialProducts: ProductListItemFragment[];
  hasNextPage: boolean;
  endCursor: string | null;
  sortBy: ProductOrder;
  activeFilters: boolean;
  // Filter data
  categoriesForFilter: Category[];
  brandsForQuickFilters: Array<{ slug: string; name: string; productCount?: number }>;
  sizesForFilters: Array<{ slug: string; name: string }>;
  colorsForFilters: Array<{ slug: string; name: string }>;
  collectionsForQuickFilters: Array<{ slug: string; name: string }>;
}

export function ProductsContent({
  channel,
  filters,
  productCount,
  clearSearchHref,
  initialProducts,
  hasNextPage,
  endCursor,
  sortBy,
  activeFilters,
  categoriesForFilter,
  brandsForQuickFilters,
  sizesForFilters,
  colorsForFilters,
  collectionsForQuickFilters,
}: ProductsContentProps) {
  const filtersText = useFiltersText();
  const [displayMode, setDisplayMode] = useDisplayMode(4);

  // Convert Category[] to the shape needed by ActiveFiltersTags
  const categoriesForTags = categoriesForFilter.map((c) => ({
    slug: c.slug,
    name: c.name,
    children: c.children?.map((ch) => ({
      slug: ch.slug,
      name: ch.name,
      children: ch.children?.map((gch) => ({
        slug: gch.slug,
        name: gch.name,
      })),
    })),
  }));

  return (
    <>
      {/* Unified Results Header - All controls in one row */}
      <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          {/* Left side: Filters (mobile), Search */}
          <div className="flex flex-1 items-center gap-2 sm:gap-3">
            {/* Mobile Filter Button */}
            <div className="shrink-0 lg:hidden">
              <ProductFiltersWrapper
                channel={channel}
                mobileOnly
                initialCategories={categoriesForFilter}
                initialBrands={brandsForQuickFilters.map(b => ({ id: b.slug, ...b }))}
                initialSizes={sizesForFilters.map(s => ({ id: s.slug, ...s }))}
                initialColors={colorsForFilters.map(c => ({ id: c.slug, ...c }))}
              />
            </div>

            {/* Search Bar */}
            <div className="min-w-0 flex-1 sm:max-w-xs md:max-w-sm">
              <SearchBar
                key={filters.search ?? "_"}
                channel={channel}
                initialQuery={filters.search ?? ""}
              />
            </div>

            {/* Clear Search Button */}
            {clearSearchHref && (
              <LinkWithChannel
                href={clearSearchHref}
                className="shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100"
              >
                ✕
              </LinkWithChannel>
            )}
          </div>

          {/* Right side: Results count, Sort, Display Mode */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:justify-end">
            {/* Results Count */}
            <div className="min-w-0 text-sm text-neutral-600">
              {filters.search ? (
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-neutral-900">
                    {productCount.toLocaleString()}
                  </span>
                  <span className="hidden sm:inline">
                    {filtersText.searchForText || "for"}
                  </span>
                  <span className="hidden max-w-[120px] truncate font-semibold text-neutral-900 sm:inline">
                    &quot;{filters.search}&quot;
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-neutral-900">
                    {productCount.toLocaleString()}
                  </span>
                  <span>{filtersText.resultsText}</span>
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-neutral-200" />

            {/* Sort */}
            <div className="shrink-0">
              <SortBy />
            </div>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-neutral-200 sm:block" />

            {/* Display Mode Toggle */}
            <div className="hidden shrink-0 sm:block">
              <DisplayModeToggle
                value={displayMode}
                onChange={setDisplayMode}
              />
            </div>
          </div>
        </div>

        {/* Mobile Display Mode Toggle - Below on small screens */}
        <div className="mt-3 flex justify-end sm:hidden">
          <DisplayModeToggle
            value={displayMode}
            onChange={setDisplayMode}
          />
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFilters && (
        <div className="mb-4">
          <ActiveFiltersTags
            filters={filters}
            channel={channel}
            categories={categoriesForTags}
            collections={collectionsForQuickFilters}
            brands={brandsForQuickFilters}
            sizes={sizesForFilters}
            colors={colorsForFilters}
          />
        </div>
      )}

      {/* Products Grid */}
      <ProductsGrid
        initialProducts={initialProducts}
        channel={channel}
        totalCount={productCount}
        hasNextPage={hasNextPage}
        endCursor={endCursor}
        sortBy={sortBy}
        filters={filters}
        showDisplayToggle={false}
        displayMode={displayMode}
      />
    </>
  );
}
