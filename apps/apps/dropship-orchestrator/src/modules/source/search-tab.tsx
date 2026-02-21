import { useState, useCallback, useMemo } from "react";

import { Box, Text, Button } from "@/components/ui/primitives";
import { trpcClient } from "@/modules/trpc/trpc-client";

import type { SourcedProduct } from "./types";
import { labelStyle, inputStyle } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "default", label: "Relevance" },
  { value: "price", label: "Price: Low to High" },
  { value: "priceDesc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "hot", label: "Most Popular" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const selectStyle = {
  ...inputStyle,
  cursor: "pointer" as const,
  appearance: "auto" as const,
};

const cardStyle = {
  border: "1px solid #e5e5e7",
  borderRadius: "8px",
  padding: "12px",
  backgroundColor: "#fff",
  cursor: "pointer",
  transition: "border-color 0.15s, box-shadow 0.15s",
  position: "relative" as const,
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
};

const cardSelectedStyle = {
  ...cardStyle,
  borderColor: "#2563eb",
  boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.15)",
};

const checkboxStyle = {
  width: "16px",
  height: "16px",
  flexShrink: 0,
  marginTop: "2px",
  cursor: "pointer",
  accentColor: "#2563eb",
};

const badgeStyle = {
  display: "inline-block",
  fontSize: "10px",
  fontWeight: 500 as const,
  padding: "1px 6px",
  borderRadius: "4px",
  lineHeight: "16px",
};

const paginationBtnStyle = {
  padding: "6px 16px",
  fontSize: "13px",
  border: "1px solid #dcdcde",
  borderRadius: "6px",
  backgroundColor: "#fff",
  cursor: "pointer",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchTab({ defaults, existingPids, onProductsFetched }: SearchTabProps) {
  // Form state (live, changes on every keystroke — NOT used by query)
  const [keyWord, setKeyWord] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortValue>("default");

  // Submitted state (frozen — only updates on explicit search action)
  const [submittedParams, setSubmittedParams] = useState<{
    keyWord?: string;
    page: number;
    size: number;
    categoryId?: string;
    startSellPrice?: number;
    endSellPrice?: number;
    sort: SortValue;
  } | null>(null);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch detail progress
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null);

  // Categories query
  const categoriesQuery = trpcClient.source.getCategories.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // cache 10 min
    refetchOnWindowFocus: false,
  });

  // Search query — ONLY fires when submittedParams is set (user clicked Search)
  const searchQuery = trpcClient.source.searchProducts.useQuery(
    submittedParams ?? { page: 1, size: 20, sort: "default" },
    {
      enabled: submittedParams !== null,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    },
  );

  // Fetch details mutation (reuses existing fetchProducts)
  const fetchDetailsMutation = trpcClient.source.fetchProducts.useMutation({
    onSuccess: (data) => {
      const sourced: SourcedProduct[] = data.products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          shippingCost: null,
          shippingCarrier: "",
          shippingDays: "",
        })),
        editName: p.name,
        editType: defaults.type,
        editCategory: defaults.category,
        editCollections: defaults.collections,
        editGender: defaults.gender,
        shippingCost: null,
        shippingCarrier: "",
        shippingDays: "",
        showVariants: false,
      }));
      onProductsFetched(sourced, data.errors);
      setSelected(new Set());
      setFetchProgress(null);
    },
    onError: () => {
      setFetchProgress(null);
    },
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
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(() => {
    // Filter out products already in sourcing table
    const existingSet = new Set(existingPids);
    const pidsToFetch = Array.from(selected).filter((id) => !existingSet.has(id));

    if (pidsToFetch.length === 0) return;

    setFetchProgress({ done: 0, total: pidsToFetch.length });
    fetchDetailsMutation.mutate({ urls: pidsToFetch });
  }, [selected, existingPids, fetchDetailsMutation]);

  const handlePageChange = useCallback((newPage: number) => {
    setSubmittedParams((prev) => prev ? { ...prev, page: newPage } : prev);
  }, []);

  // Build category options for the select
  const categoryOptions = useMemo(() => {
    if (!categoriesQuery.data?.categories) return [];
    const options: Array<{ value: string; label: string; level: number }> = [];
    for (const first of categoriesQuery.data.categories) {
      options.push({ value: "", label: `--- ${first.name} ---`, level: 0 });
      for (const second of first.children) {
        options.push({ value: "", label: `  ${second.name}`, level: 1 });
        for (const third of second.children) {
          options.push({ value: third.id, label: `    ${third.name}`, level: 2 });
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
    <Box display="flex" flexDirection="column" gap={4}>
      {/* Search Form */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        {/* Keyword + Search button */}
        <Box display="flex" gap={3} alignItems="flex-end">
          <Box __width="100%" style={{ flex: 1 }}>
            <label style={labelStyle}>Search CJ Products</label>
            <input
              style={inputStyle}
              value={keyWord}
              onChange={(e) => setKeyWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. men shoes, summer dress, phone case..."
            />
          </Box>
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={searchQuery.isFetching}
          >
            {searchQuery.isFetching ? "Searching..." : "Search"}
          </Button>
        </Box>

        {/* Filters row */}
        <Box display="flex" gap={3} flexWrap="wrap" alignItems="flex-end">
          <Box __width="220px">
            <label style={labelStyle}>Category</label>
            <select
              style={selectStyle}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
              }}
            >
              <option value="">All Categories</option>
              {categoryOptions.map((opt, i) =>
                opt.value ? (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ) : (
                  <option key={`group-${i}`} disabled>
                    {opt.label}
                  </option>
                ),
              )}
            </select>
          </Box>

          <Box __width="110px">
            <label style={labelStyle}>Min Price ($)</label>
            <input
              type="number"
              style={inputStyle}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </Box>

          <Box __width="110px">
            <label style={labelStyle}>Max Price ($)</label>
            <input
              type="number"
              style={inputStyle}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="999"
              min="0"
              step="0.01"
            />
          </Box>

          <Box __width="180px">
            <label style={labelStyle}>Sort By</label>
            <select
              style={selectStyle}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortValue);
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Box>
        </Box>
      </Box>

      {/* Search Results */}
      {searchQuery.isError && (
        <Box padding={4} borderRadius={4} backgroundColor="critical1">
          <Text color="critical1" variant="bodyStrong">Search Error</Text>
          <Text>{searchQuery.error.message}</Text>
        </Box>
      )}

      {submittedParams !== null && !searchQuery.isError && (
        <>
          {/* Results header */}
          {results && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text color="default2" variant="caption">
                {results.pagination.totalRecords} results
                {keyWord ? ` for "${keyWord}"` : ""}
                {" "} (page {results.pagination.page} of {results.pagination.totalPages})
              </Text>
              {selectedCount > 0 && (
                <Text variant="caption" color="default2">
                  {selectedCount} selected
                  {newSelectedCount < selectedCount
                    ? ` (${selectedCount - newSelectedCount} already in table)`
                    : ""}
                </Text>
              )}
            </Box>
          )}

          {/* Product Grid */}
          {results && results.products.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "12px",
              }}
            >
              {results.products.map((product) => {
                const isSelected = selected.has(product.id);
                const isExisting = existingSet.has(product.id);
                const hasDiscount = product.nowPrice < product.sellPrice && product.sellPrice > 0;

                return (
                  <div
                    key={product.id}
                    style={isSelected ? cardSelectedStyle : cardStyle}
                    onClick={() => !isExisting && toggleSelect(product.id)}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isExisting}
                      onChange={() => toggleSelect(product.id)}
                      style={checkboxStyle}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Image */}
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid #e5e5e7",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          backgroundColor: "#f5f5f5",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "11px",
                          color: "#9ca3af",
                        }}
                      >
                        No img
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          lineHeight: "1.3",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          color: isExisting ? "#9ca3af" : "#111",
                        }}
                        title={product.name}
                      >
                        {product.name}
                        {isExisting && (
                          <span style={{ fontWeight: 400, color: "#6b6b6f", marginLeft: "4px" }}>
                            (already added)
                          </span>
                        )}
                      </div>

                      {/* Price row */}
                      <div style={{ marginTop: "4px", display: "flex", gap: "6px", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>
                          ${product.nowPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span style={{ fontSize: "12px", color: "#9ca3af", textDecoration: "line-through" }}>
                            ${product.sellPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div style={{ marginTop: "4px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {product.freeShipping && (
                          <span style={{ ...badgeStyle, backgroundColor: "#ecfdf5", color: "#059669" }}>
                            Free Shipping
                          </span>
                        )}
                        {product.inventory > 0 && (
                          <span style={{ ...badgeStyle, backgroundColor: "#f0f9ff", color: "#2563eb" }}>
                            {product.inventory} in stock
                          </span>
                        )}
                        {product.deliveryCycle && (
                          <span style={{ ...badgeStyle, backgroundColor: "#fefce8", color: "#a16207" }}>
                            {product.deliveryCycle}
                          </span>
                        )}
                        {product.listedNum > 0 && (
                          <span style={{ ...badgeStyle, backgroundColor: "#f5f5f5", color: "#6b6b6f" }}>
                            {product.listedNum} listed
                          </span>
                        )}
                      </div>

                      {/* Caption */}
                      <div style={{ marginTop: "4px", fontSize: "11px", color: "#9ca3af" }}>
                        {product.supplierName}
                        {product.categoryName ? ` \u00B7 ${product.categoryName}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {results && results.products.length === 0 && (
            <Box
              padding={8}
              borderRadius={4}
              borderWidth={1}
              borderStyle="dashed"
              borderColor="default2"
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={2}
            >
              <Text variant="heading" size="medium" color="default2">
                No products found
              </Text>
              <Text color="default2">
                Try different keywords or adjust your filters
              </Text>
            </Box>
          )}

          {/* Loading state */}
          {searchQuery.isFetching && !results && (
            <Box padding={6} display="flex" justifyContent="center">
              <Text color="default2">Searching CJ products...</Text>
            </Box>
          )}

          {/* Pagination */}
          {results && results.pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" gap={3} alignItems="center">
              <button
                style={{
                  ...paginationBtnStyle,
                  opacity: (submittedParams?.page ?? 1) <= 1 ? 0.4 : 1,
                  cursor: (submittedParams?.page ?? 1) <= 1 ? "default" : "pointer",
                }}
                disabled={(submittedParams?.page ?? 1) <= 1}
                onClick={() => handlePageChange((submittedParams?.page ?? 1) - 1)}
              >
                Previous
              </button>
              <Text variant="caption" color="default2">
                Page {results.pagination.page} of {results.pagination.totalPages}
              </Text>
              <button
                style={{
                  ...paginationBtnStyle,
                  opacity: (submittedParams?.page ?? 1) >= results.pagination.totalPages ? 0.4 : 1,
                  cursor: (submittedParams?.page ?? 1) >= results.pagination.totalPages ? "default" : "pointer",
                }}
                disabled={(submittedParams?.page ?? 1) >= results.pagination.totalPages}
                onClick={() => handlePageChange((submittedParams?.page ?? 1) + 1)}
              >
                Next
              </button>
            </Box>
          )}
        </>
      )}

      {/* Selection Bar */}
      {selectedCount > 0 && (
        <div
          style={{
            position: "sticky",
            bottom: "0",
            backgroundColor: "#fff",
            borderTop: "1px solid #e5e5e7",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Text>
            {newSelectedCount} product{newSelectedCount !== 1 ? "s" : ""} ready to add
            {newSelectedCount < selectedCount && (
              <span style={{ color: "#9ca3af" }}>
                {" "}({selectedCount - newSelectedCount} already in table, will be skipped)
              </span>
            )}
          </Text>

          {fetchProgress ? (
            <Text color="default2">
              Fetching product details... ({fetchProgress.done}/{fetchProgress.total})
              {" "}&mdash; this takes ~{fetchProgress.total} seconds
            </Text>
          ) : (
            <Button
              variant="primary"
              onClick={handleAddSelected}
              disabled={newSelectedCount === 0 || fetchDetailsMutation.isLoading}
            >
              Add {newSelectedCount} Selected to Sourcing Table
            </Button>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {submittedParams === null && (
        <Box
          padding={8}
          borderRadius={4}
          borderWidth={1}
          borderStyle="dashed"
          borderColor="default2"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <Text variant="heading" size="medium" color="default2">
            Search CJ's product catalog
          </Text>
          <Text color="default2">
            Enter keywords above and click "Search" to discover products
          </Text>
        </Box>
      )}
    </Box>
  );
}
