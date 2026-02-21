import { useState, useCallback, useEffect } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";

import { Box, Text, Input } from "@/components/ui/primitives";
import { NavBar } from "@/components/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";

import type { SourcedProduct } from "@/modules/source/types";
import {
  generateCSV,
  labelStyle,
  inputStyle,
  TYPE_SUGGESTIONS,
  CATEGORY_SUGGESTIONS,
  GENDER_SUGGESTIONS,
} from "@/modules/source/types";
import { SourcingTable } from "@/modules/source/sourcing-table";
import { UrlTab } from "@/modules/source/url-tab";
import { SearchTab } from "@/modules/source/search-tab";

// ---------------------------------------------------------------------------
// Tab bar styles
// ---------------------------------------------------------------------------

const tabStyle = {
  padding: "8px 20px",
  fontSize: "14px",
  fontWeight: 500 as const,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  cursor: "pointer",
  border: "none",
  borderBottom: "2px solid transparent",
  backgroundColor: "transparent",
  color: "#6b6b6f",
  transition: "color 0.15s, border-color 0.15s",
};

const tabActiveStyle = {
  ...tabStyle,
  color: "#111",
  fontWeight: 600 as const,
  borderBottomColor: "#2563eb",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SourceProducts() {
  const [activeTab, setActiveTab] = useState<"search" | "urls">("search");
  const [markup, setMarkup] = useState(2.5);
  const [defaultType, setDefaultType] = useState("Dropship Product");
  const [defaultCategory, setDefaultCategory] = useState("men-casual-shoes");
  const [defaultGender, setDefaultGender] = useState("Men");
  const [defaultCollections, setDefaultCollections] = useState("new-arrivals");
  const [destinationCountry, setDestinationCountry] = useState("IL");
  const [products, setProducts] = useState<SourcedProduct[]>([]);
  const [fetchErrors, setFetchErrors] = useState<Array<{ pid: string; error: string }>>([]);
  const [shippingLoading, setShippingLoading] = useState(false);

  const defaults = {
    type: defaultType,
    category: defaultCategory,
    gender: defaultGender,
    collections: defaultCollections,
    country: destinationCountry,
  };

  // ---------------------------------------------------------------------------
  // Shipping auto-fetch
  // ---------------------------------------------------------------------------

  const shippingMutation = trpcClient.source.fetchShipping.useMutation({
    onSuccess: (data) => {
      setProducts((prev) =>
        prev.map((p) => {
          // Assign per-variant shipping from results
          const updatedVariants = p.variants.map((v) => {
            const shipping = data.results.find((r) => r.pid === p.pid && r.vid === v.vid);
            if (!shipping) return v;
            return {
              ...v,
              shippingCost: shipping.shippingCost,
              shippingCarrier: shipping.carrier,
              shippingDays: shipping.deliveryDays,
            };
          });

          // Product-level summary: cheapest variant shipping
          const variantsWithShipping = updatedVariants.filter((v) => v.shippingCost != null);
          const cheapestVariant = variantsWithShipping.length > 0
            ? variantsWithShipping.reduce((best, v) =>
                (v.shippingCost ?? Infinity) < (best.shippingCost ?? Infinity) ? v : best,
              )
            : null;

          return {
            ...p,
            variants: updatedVariants,
            shippingCost: cheapestVariant?.shippingCost ?? null,
            shippingCarrier: cheapestVariant?.shippingCarrier ?? "",
            shippingDays: cheapestVariant?.shippingDays ?? "",
          };
        }),
      );
      setShippingLoading(false);
    },
    onError: () => {
      setShippingLoading(false);
    },
  });

  useEffect(() => {
    if (products.length === 0 || shippingLoading) return;
    // Check if any product still has variants without shipping
    const needsShipping = products.some((p) =>
      p.variants.some((v) => v.shippingCost === null),
    );
    if (!needsShipping) return;

    // Collect all variants that need shipping across all products
    const allVariants = products
      .filter((p) => p.variants.some((v) => v.shippingCost === null))
      .flatMap((p) =>
        p.variants
          .filter((v) => v.shippingCost === null)
          .map((v) => ({ pid: p.pid, vid: v.vid, weight: v.weight })),
      );

    if (allVariants.length === 0) return;

    setShippingLoading(true);
    shippingMutation.mutate({
      variants: allVariants,
      destinationCountry,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // ---------------------------------------------------------------------------
  // Shared handlers
  // ---------------------------------------------------------------------------

  const handleProductsFetched = useCallback(
    (newProducts: SourcedProduct[], errors: Array<{ pid: string; error: string }>) => {
      setProducts((prev) => {
        const existing = new Set(prev.map((p) => p.pid));
        const unique = newProducts.filter((p) => !existing.has(p.pid));
        return [...prev, ...unique];
      });
      if (errors.length > 0) {
        setFetchErrors((prev) => [...prev, ...errors]);
      }
    },
    [],
  );

  const updateProduct = useCallback(
    (pid: string, field: keyof SourcedProduct, value: string) => {
      setProducts((prev) =>
        prev.map((p) => (p.pid === pid ? { ...p, [field]: value } : p)),
      );
    },
    [],
  );

  const toggleVariants = useCallback((pid: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.pid === pid ? { ...p, showVariants: !p.showVariants } : p)),
    );
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (products.length === 0) return;

    const csv = generateCSV(products, markup);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `cj-sourced-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products, markup]);

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      {/* Header */}
      <Box>
        <Text variant="heading" size="large">Source Products</Text>
        <Text color="default2">
          Search CJ's catalog or paste product URLs, then download a Bulk Manager-ready CSV
        </Text>
      </Box>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e5e5e7" }}>
        <button
          style={activeTab === "search" ? tabActiveStyle : tabStyle}
          onClick={() => setActiveTab("search")}
        >
          Search Products
        </button>
        <button
          style={activeTab === "urls" ? tabActiveStyle : tabStyle}
          onClick={() => setActiveTab("urls")}
        >
          Paste URLs / PIDs
        </button>
      </div>

      {/* Active Tab */}
      {activeTab === "search" ? (
        <SearchTab
          defaults={defaults}
          existingPids={products.map((p) => p.pid)}
          onProductsFetched={handleProductsFetched}
        />
      ) : (
        <UrlTab
          defaults={defaults}
          onProductsFetched={handleProductsFetched}
        />
      )}

      {/* Defaults Row (shared across tabs) */}
      <Box
        padding={4}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
        display="flex"
        gap={4}
        flexWrap="wrap"
        alignItems="flex-end"
      >
        <Box __width="160px">
          <label style={labelStyle}>Product Type</label>
          <input
            list="type-suggestions"
            style={inputStyle}
            value={defaultType}
            onChange={(e) => setDefaultType(e.target.value)}
            placeholder="e.g. Shoes"
          />
          <datalist id="type-suggestions">
            {TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </Box>

        <Box __width="200px">
          <label style={labelStyle}>Category</label>
          <input
            list="category-suggestions"
            style={inputStyle}
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            placeholder="e.g. men-casual-shoes"
          />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Box>

        <Box __width="120px">
          <label style={labelStyle}>Gender</label>
          <input
            list="gender-suggestions"
            style={inputStyle}
            value={defaultGender}
            onChange={(e) => setDefaultGender(e.target.value)}
            placeholder="e.g. Men"
          />
          <datalist id="gender-suggestions">
            {GENDER_SUGGESTIONS.map((g) => <option key={g} value={g} />)}
          </datalist>
        </Box>

        <Box __width="150px">
          <label style={labelStyle}>Collections (;)</label>
          <input
            style={inputStyle}
            value={defaultCollections}
            onChange={(e) => setDefaultCollections(e.target.value)}
            placeholder="new-arrivals;sale"
          />
        </Box>

        <Box __width="80px">
          <label style={labelStyle}>Ship To</label>
          <input
            style={inputStyle}
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value.toUpperCase())}
            placeholder="IL"
            maxLength={2}
          />
        </Box>

        <Box __width="100px">
          <label style={labelStyle}>Markup (x)</label>
          <Input
            size="small"
            type="number"
            step="0.1"
            min="1"
            value={markup}
            onChange={(e) => setMarkup(parseFloat(e.target.value) || 1)}
          />
        </Box>
      </Box>

      {/* Fetch Warnings */}
      {fetchErrors.length > 0 && (
        <Box padding={4} borderRadius={4} backgroundColor="warning1">
          <Text color="warning1" variant="bodyStrong">
            {fetchErrors.length} product(s) failed to fetch
          </Text>
          {fetchErrors.map((e) => (
            <Text key={e.pid} variant="caption">
              PID {e.pid}: {e.error}
            </Text>
          ))}
        </Box>
      )}

      {/* Sourcing Table */}
      <SourcingTable
        products={products}
        markup={markup}
        shippingLoading={shippingLoading}
        onUpdateProduct={updateProduct}
        onToggleVariants={toggleVariants}
        onDownloadCSV={handleDownloadCSV}
      />

      {/* Empty State */}
      {products.length === 0 && (
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
            No products sourced yet
          </Text>
          <Text color="default2">
            Search for products or paste CJ URLs above to get started
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default function SourcePage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <SourceProducts />;
}
