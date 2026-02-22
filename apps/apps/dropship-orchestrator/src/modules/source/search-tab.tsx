import { useState, useCallback, useMemo } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import type { SourcedProduct } from "./types";

interface SearchTabProps {
  defaults: {
    type: string;
    category: string;
    gender: string;
    collections: string;
    country: string;
  };
  existingPids: string[];
  onProductsFetched: (
    products: SourcedProduct[],
    errors: Array<{ pid: string; error: string }>,
  ) => void;
}

const SORT_OPTIONS = [
  { value: "default", label: "Relevance" },
  { value: "price", label: "Price: Low to High" },
  { value: "priceDesc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "hot", label: "Most Popular" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const inputCls = "w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";
const selectCls = `${inputCls} cursor-pointer`;

export function SearchTab({ defaults, existingPids, onProductsFetched }: SearchTabProps) {
  const [keyWord, setKeyWord] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortValue>("default");

  const [submittedParams, setSubmittedParams] = useState<{
    keyWord?: string;
    page: number;
    size: number;
    categoryId?: string;
    startSellPrice?: number;
    endSellPrice?: number;
    sort: SortValue;
  } | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null);

  const categoriesQuery = trpcClient.source.getCategories.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const searchQuery = trpcClient.source.searchProducts.useQuery(
    submittedParams ?? { page: 1, size: 20, sort: "default" },
    { enabled: submittedParams !== null, keepPreviousData: true, refetchOnWindowFocus: false },
  );

  const fetchDetailsMutation = trpcClient.source.fetchProducts.useMutation({
    onSuccess: (data) => {
      const sourced: SourcedProduct[] = data.products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({ ...v, shippingCost: null, shippingCarrier: "", shippingDays: "" })),
        editName: p.name,
        editType: defaults.type,
        editCategory: defaults.category,
        editCollections: defaults.collections,
        editGender: defaults.gender,
        shippingCost: null,
        shippingCarrier: "",
        shippingDays: "",
        warehouseOptions: [],
        selectedWarehouse: "CN",
        showVariants: false,
      }));
      onProductsFetched(sourced, data.errors);
      setSelected(new Set());
      setFetchProgress(null);
    },
    onError: () => setFetchProgress(null),
  });

  const handleSearch = useCallback(() => {
    setSubmittedParams({
      keyWord: keyWord || undefined,
      page: 1,
      size: 20,
      categoryId: categoryId || undefined,
      startSellPrice: minPrice ? parseFloat(minPrice) : undefined,
      endSellPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort,
    });
  }, [keyWord, categoryId, minPrice, maxPrice, sort]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); },
    [handleSearch],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(() => {
    const existingSet = new Set(existingPids);
    const pidsToFetch = Array.from(selected).filter((id) => !existingSet.has(id));
    if (pidsToFetch.length === 0) return;
    setFetchProgress({ done: 0, total: pidsToFetch.length });
    fetchDetailsMutation.mutate({ urls: pidsToFetch });
  }, [selected, existingPids, fetchDetailsMutation]);

  const handlePageChange = useCallback((newPage: number) => {
    setSubmittedParams((prev) => prev ? { ...prev, page: newPage } : prev);
  }, []);

  const categoryOptions = useMemo(() => {
    if (!categoriesQuery.data?.categories) return [];
    const options: Array<{ value: string; label: string }> = [];
    for (const first of categoriesQuery.data.categories) {
      options.push({ value: "", label: `--- ${first.name} ---` });
      for (const second of first.children) {
        options.push({ value: "", label: `  ${second.name}` });
        for (const third of second.children) {
          options.push({ value: third.id, label: `    ${third.name}` });
        }
      }
    }
    return options;
  }, [categoriesQuery.data]);

  const results = searchQuery.data;
  const existingSet = new Set(existingPids);
  const selectedCount = selected.size;
  const newSelectedCount = Array.from(selected).filter((id) => !existingSet.has(id)).length;

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-muted mb-1">Search CJ Products</label>
            <input
              className={inputCls}
              value={keyWord}
              onChange={(e) => setKeyWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. men shoes, summer dress, phone case..."
            />
          </div>
          <button
            className="px-4 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
            onClick={handleSearch}
            disabled={searchQuery.isFetching}
          >
            {searchQuery.isFetching ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-[220px]">
            <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
            <select className={selectCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All Categories</option>
              {categoryOptions.map((opt, i) =>
                opt.value
                  ? <option key={opt.value} value={opt.value}>{opt.label}</option>
                  : <option key={`g-${i}`} disabled>{opt.label}</option>
              )}
            </select>
          </div>
          <div className="w-[110px]">
            <label className="block text-xs font-medium text-text-muted mb-1">Min Price ($)</label>
            <input type="number" className={inputCls} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" min="0" step="0.01" />
          </div>
          <div className="w-[110px]">
            <label className="block text-xs font-medium text-text-muted mb-1">Max Price ($)</label>
            <input type="number" className={inputCls} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="999" min="0" step="0.01" />
          </div>
          <div className="w-[180px]">
            <label className="block text-xs font-medium text-text-muted mb-1">Sort By</label>
            <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as SortValue)}>
              {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {searchQuery.isError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-800">Search Error</p>
          <p className="text-sm text-red-700">{searchQuery.error.message}</p>
        </div>
      )}

      {submittedParams !== null && !searchQuery.isError && (
        <>
          {/* Results header */}
          {results && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">
                {results.pagination.totalRecords} results
                {keyWord ? ` for "${keyWord}"` : ""}
                {" "}(page {results.pagination.page} of {results.pagination.totalPages})
              </span>
              {selectedCount > 0 && (
                <span className="text-xs text-text-muted">
                  {selectedCount} selected
                  {newSelectedCount < selectedCount ? ` (${selectedCount - newSelectedCount} already in table)` : ""}
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          {results && results.products.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3">
              {results.products.map((product) => {
                const isSelected = selected.has(product.id);
                const isExisting = existingSet.has(product.id);
                const hasDiscount = product.nowPrice < product.sellPrice && product.sellPrice > 0;

                return (
                  <div
                    key={product.id}
                    className={`
                      flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected ? "border-brand shadow-[0_0_0_2px_rgba(24,24,27,0.15)]" : "border-border hover:border-gray-300 hover:shadow-sm"}
                    `}
                    onClick={() => !isExisting && toggleSelect(product.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isExisting}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 shrink-0 mt-0.5 cursor-pointer accent-brand"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-md border border-border shrink-0" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center shrink-0 text-xs text-text-muted">No img</div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold leading-tight line-clamp-2 ${isExisting ? "text-text-muted" : "text-text-primary"}`} title={product.name}>
                        {product.name}
                        {isExisting && <span className="font-normal text-text-muted ml-1">(already added)</span>}
                      </div>
                      <div className="mt-1 flex gap-1.5 items-baseline">
                        <span className="text-sm font-bold text-text-primary">${product.nowPrice.toFixed(2)}</span>
                        {hasDiscount && <span className="text-xs text-text-muted line-through">${product.sellPrice.toFixed(2)}</span>}
                      </div>
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {product.freeShipping && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700">Free Shipping</span>}
                        {product.inventory > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{product.inventory} in stock</span>}
                        {product.deliveryCycle && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">{product.deliveryCycle}</span>}
                        {product.listedNum > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-text-muted">{product.listedNum} listed</span>}
                      </div>
                      <div className="mt-1 text-[11px] text-text-muted">
                        {product.supplierName}{product.categoryName ? ` \u00B7 ${product.categoryName}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {results && results.products.length === 0 && (
            <div className="p-8 rounded-lg border border-dashed border-border flex flex-col items-center gap-2">
              <p className="text-base font-medium text-text-muted">No products found</p>
              <p className="text-sm text-text-muted">Try different keywords or adjust your filters</p>
            </div>
          )}

          {/* Loading */}
          {searchQuery.isFetching && !results && (
            <div className="p-6 flex justify-center">
              <span className="text-sm text-text-muted">Searching CJ products...</span>
            </div>
          )}

          {/* Pagination */}
          {results && results.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-3 items-center">
              <button
                className="px-4 py-1.5 text-sm border border-border rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
                disabled={(submittedParams?.page ?? 1) <= 1}
                onClick={() => handlePageChange((submittedParams?.page ?? 1) - 1)}
              >
                Previous
              </button>
              <span className="text-xs text-text-muted">Page {results.pagination.page} of {results.pagination.totalPages}</span>
              <button
                className="px-4 py-1.5 text-sm border border-border rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
                disabled={(submittedParams?.page ?? 1) >= results.pagination.totalPages}
                onClick={() => handlePageChange((submittedParams?.page ?? 1) + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Selection Bar */}
      {selectedCount > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 flex justify-between items-center z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <span className="text-sm">
            {newSelectedCount} product{newSelectedCount !== 1 ? "s" : ""} ready to add
            {newSelectedCount < selectedCount && (
              <span className="text-text-muted"> ({selectedCount - newSelectedCount} already in table, will be skipped)</span>
            )}
          </span>
          {fetchProgress ? (
            <span className="text-sm text-text-muted">
              Fetching product details... ({fetchProgress.done}/{fetchProgress.total})
            </span>
          ) : (
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
              onClick={handleAddSelected}
              disabled={newSelectedCount === 0 || fetchDetailsMutation.isLoading}
            >
              Add {newSelectedCount} Selected to Sourcing Table
            </button>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {submittedParams === null && (
        <div className="p-8 rounded-lg border border-dashed border-border flex flex-col items-center gap-2">
          <p className="text-base font-medium text-text-muted">Search CJ's product catalog</p>
          <p className="text-sm text-text-muted">Enter keywords above and click "Search" to discover products</p>
        </div>
      )}
    </div>
  );
}
