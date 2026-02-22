import { useState, useCallback, useEffect } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Download } from "lucide-react";

import { NavBar } from "@/components/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";

import type { SourcedProduct, CSVOverrides } from "@/modules/source/types";
import { generateCSV } from "@/modules/source/types";
import { SourcingTable } from "@/modules/source/sourcing-table";
import { UrlTab } from "@/modules/source/url-tab";
import { SearchTab } from "@/modules/source/search-tab";

const inputCls =
  "w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20";
const selectCls = `${inputCls} cursor-pointer`;

function SourceProducts() {
  const [activeTab, setActiveTab] = useState<"search" | "urls">("urls");

  // ── Settings state ──
  const [markup, setMarkup] = useState(2.5);
  const [defaultType, setDefaultType] = useState("dropship-product");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultGender, setDefaultGender] = useState("Men");
  const [defaultCollections, setDefaultCollections] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [destinationCountry, setDestinationCountry] = useState("IL");
  const [ilsRate, setIlsRate] = useState(3.6);

  // ── Product state ──
  const [products, setProducts] = useState<SourcedProduct[]>([]);
  const [fetchErrors, setFetchErrors] = useState<Array<{ pid: string; error: string }>>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [warehouseStrategy, setWarehouseStrategy] = useState<"cheapest" | "fastest">("cheapest");

  // ── Import state ──
  const [importProgress, setImportProgress] = useState<{
    total: number;
    done: number;
    results: Array<{ name: string; status: "ok" | "error"; error?: string }>;
  } | null>(null);

  // ── Fetch Saleor metadata ──
  const metadataQuery = trpcClient.source.saleorMetadata.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const meta = metadataQuery.data;

  // Auto-select all channels on first load
  useEffect(() => {
    if (meta?.channels && selectedChannels.length === 0) {
      setSelectedChannels(meta.channels.map((c) => c.slug));
    }
  }, [meta?.channels]);

  const defaults = {
    type: defaultType,
    category: defaultCategory,
    gender: defaultGender,
    collections: defaultCollections.join(";"),
    country: destinationCountry,
  };

  const hasIlsChannel = selectedChannels.some((slug) => {
    const ch = meta?.channels?.find((c) => c.slug === slug);
    return ch?.currencyCode === "ILS";
  });

  // ── Shipping auto-fetch ──
  const shippingMutation = trpcClient.source.fetchShipping.useMutation({
    onSuccess: (data) => {
      setProducts((prev) =>
        prev.map((p) => {
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
          const withShipping = updatedVariants.filter((v) => v.shippingCost != null);
          const cheapest = withShipping.length > 0
            ? withShipping.reduce((best, v) =>
                (v.shippingCost ?? Infinity) < (best.shippingCost ?? Infinity) ? v : best)
            : null;
          return {
            ...p,
            variants: updatedVariants,
            shippingCost: cheapest?.shippingCost ?? null,
            shippingCarrier: cheapest?.shippingCarrier ?? "",
            shippingDays: cheapest?.shippingDays ?? "",
          };
        }),
      );
      setShippingLoading(false);
    },
    onError: () => setShippingLoading(false),
  });

  useEffect(() => {
    if (products.length === 0 || shippingLoading) return;
    const allVariants = products
      .filter((p) => p.variants.some((v) => v.shippingCost === null))
      .flatMap((p) =>
        p.variants
          .filter((v) => v.shippingCost === null)
          .map((v) => ({ pid: p.pid, vid: v.vid, weight: v.weight })),
      );
    if (allVariants.length === 0) return;
    setShippingLoading(true);
    shippingMutation.mutate({ variants: allVariants, destinationCountry });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // ── Warehouse shipping auto-fetch ──
  const warehouseMutation = trpcClient.source.fetchWarehouseShipping.useMutation({
    onSuccess: (data) => {
      setProducts((prev) =>
        prev.map((p) => {
          const match = data.results.find((r) => r.pid === p.pid);
          if (!match || match.warehouses.length === 0) return p;
          // Pick best warehouse based on strategy
          const bestWh = match.warehouses.reduce((best, wh) => {
            const pick = warehouseStrategy === "cheapest" ? wh.cheapest : wh.fastest;
            const bestPick = warehouseStrategy === "cheapest" ? best.cheapest : best.fastest;
            if (!pick) return best;
            if (!bestPick) return wh;
            if (warehouseStrategy === "cheapest") return pick.cost < bestPick.cost ? wh : best;
            // fastest — compare days (parse first number)
            const parseDays = (s: string) => parseInt(s.match(/(\d+)/)?.[1] || "999", 10);
            return parseDays(pick.days) < parseDays(bestPick.days) ? wh : best;
          });
          const selected = bestWh.origin;
          const pick = warehouseStrategy === "cheapest" ? bestWh.cheapest : bestWh.fastest;
          return {
            ...p,
            warehouseOptions: match.warehouses,
            selectedWarehouse: selected,
            shippingCost: pick?.cost ?? p.shippingCost,
            shippingCarrier: pick?.carrier ?? p.shippingCarrier,
            shippingDays: pick?.days ?? p.shippingDays,
          };
        }),
      );
      setWarehouseLoading(false);
    },
    onError: () => setWarehouseLoading(false),
  });

  // Trigger warehouse fetch after basic shipping resolves
  useEffect(() => {
    if (products.length === 0 || warehouseLoading) return;
    // Only fetch warehouses for products that don't have options yet
    const needsWarehouse = products.filter(
      (p) => p.warehouseOptions.length === 0 && p.shippingCost != null,
    );
    if (needsWarehouse.length === 0) return;
    setWarehouseLoading(true);
    warehouseMutation.mutate({
      products: needsWarehouse.map((p) => ({
        pid: p.pid,
        vid: p.variants[0]?.vid ?? "",
      })),
      destinationCountry,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.map((p) => `${p.pid}:${p.shippingCost}`).join(",")]);

  // When strategy changes, re-apply warehouse selection
  useEffect(() => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.warehouseOptions.length === 0) return p;
        const bestWh = p.warehouseOptions.reduce((best, wh) => {
          const pick = warehouseStrategy === "cheapest" ? wh.cheapest : wh.fastest;
          const bestPick = warehouseStrategy === "cheapest" ? best.cheapest : best.fastest;
          if (!pick) return best;
          if (!bestPick) return wh;
          if (warehouseStrategy === "cheapest") return pick.cost < bestPick.cost ? wh : best;
          const parseDays = (s: string) => parseInt(s.match(/(\d+)/)?.[1] || "999", 10);
          return parseDays(pick.days) < parseDays(bestPick.days) ? wh : best;
        });
        const pick = warehouseStrategy === "cheapest" ? bestWh.cheapest : bestWh.fastest;
        return {
          ...p,
          selectedWarehouse: bestWh.origin,
          shippingCost: pick?.cost ?? p.shippingCost,
          shippingCarrier: pick?.carrier ?? p.shippingCarrier,
          shippingDays: pick?.days ?? p.shippingDays,
        };
      }),
    );
  }, [warehouseStrategy]);

  // ── Import mutation ──
  const importMutation = trpcClient.source.importToAura.useMutation({
    onSuccess: (data) => {
      const results: Array<{ name: string; status: "ok" | "error"; error?: string }> = [];
      for (const c of data.created) results.push({ name: c.name, status: "ok" });
      for (const e of data.errors) results.push({ name: e.name, status: "error", error: e.error });
      setImportProgress({ total: products.length, done: products.length, results });
    },
    onError: (err) => {
      setImportProgress({
        total: products.length,
        done: products.length,
        results: [{ name: "Import", status: "error", error: err.message }],
      });
    },
  });

  // ── Handlers ──
  const handleProductsFetched = useCallback(
    (newProducts: SourcedProduct[], errors: Array<{ pid: string; error: string }>) => {
      setProducts((prev) => {
        const existing = new Set(prev.map((p) => p.pid));
        const unique = newProducts.filter((p) => !existing.has(p.pid));
        return [...prev, ...unique];
      });
      if (errors.length > 0) setFetchErrors((prev) => [...prev, ...errors]);
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

  const removeProduct = useCallback((pid: string) => {
    setProducts((prev) => prev.filter((p) => p.pid !== pid));
  }, []);

  const toggleVariants = useCallback((pid: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.pid === pid ? { ...p, showVariants: !p.showVariants } : p)),
    );
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (products.length === 0) return;
    const overrides: CSVOverrides = {
      type: defaultType,
      category: defaultCategory,
      gender: defaultGender,
      collections: defaultCollections.join(";"),
    };
    const csv = generateCSV(products, markup, overrides);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cj-sourced-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products, markup, defaultType, defaultCategory, defaultGender, defaultCollections]);

  const handleImport = useCallback(() => {
    if (products.length === 0 || selectedChannels.length === 0) return;
    setImportProgress({ total: products.length, done: 0, results: [] });
    importMutation.mutate({
      products: products.map((p) => ({
        pid: p.pid,
        name: p.editName,
        description: p.description,
        images: p.images,
        costPrice: p.costPrice,
        weight: p.weight,
        variants: p.variants.map((v) => ({
          vid: v.vid,
          sku: v.sku,
          price: v.price,
          weight: v.weight,
          image: v.image,
          attributes: v.attributes,
          shippingCost: v.shippingCost,
          shippingCarrier: v.shippingCarrier,
          shippingDays: v.shippingDays,
        })),
        editName: p.editName,
        editType: defaultType,
        editCategory: defaultCategory,
        editCollections: defaultCollections.join(";"),
        editGender: defaultGender,
        shippingDays: p.shippingDays,
        shippingCarrier: p.shippingCarrier,
      })),
      channelSlugs: selectedChannels,
      markup,
      ilsRate: hasIlsChannel ? ilsRate : undefined,
    });
  }, [products, selectedChannels, markup, ilsRate, hasIlsChannel, importMutation, defaultType, defaultCategory, defaultGender, defaultCollections]);

  const toggleChannel = (slug: string) => {
    setSelectedChannels((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const toggleCollection = (slug: string) => {
    setDefaultCollections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  const okCount = importProgress?.results.filter((r) => r.status === "ok").length ?? 0;
  const errCount = importProgress?.results.filter((r) => r.status === "error").length ?? 0;

  const tabs = [
    { id: "urls" as const, label: "Paste URLs / PIDs" },
    { id: "search" as const, label: "Search Products" },
  ];

  return (
    <div className="space-y-6">
      <NavBar />

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Source Products</h1>
        <p className="text-sm text-text-muted mt-1">
          Paste CJ product URLs or search their catalog, configure settings, then import to Aura or download CSV
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab */}
      {activeTab === "search" ? (
        <SearchTab
          defaults={defaults}
          existingPids={products.map((p) => p.pid)}
          onProductsFetched={handleProductsFetched}
        />
      ) : (
        <UrlTab defaults={defaults} onProductsFetched={handleProductsFetched} />
      )}

      {/* Fetch warnings */}
      {fetchErrors.length > 0 && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">
            {fetchErrors.length} product(s) failed to fetch
          </p>
          {fetchErrors.map((e) => (
            <p key={e.pid} className="text-xs text-yellow-700 mt-1">
              PID {e.pid}: {e.error}
            </p>
          ))}
        </div>
      )}

      {/* ── Settings + Products Panel (shown when products exist) ── */}
      {products.length > 0 && (
        <>
          {/* Settings Panel */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Import & CSV Settings</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Product Type */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Product Type</label>
                <select className={selectCls} value={defaultType} onChange={(e) => setDefaultType(e.target.value)}>
                  {meta?.productTypes?.map((t) => (
                    <option key={t.slug} value={t.slug}>{t.name}</option>
                  )) ?? <option value="dropship-product">Dropship Product</option>}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
                <select className={selectCls} value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)}>
                  <option value="">-- None --</option>
                  {meta?.categories?.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.level > 0 ? "\u00A0".repeat(c.level * 2) + "└ " : ""}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Gender</label>
                <select className={selectCls} value={defaultGender} onChange={(e) => setDefaultGender(e.target.value)}>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              {/* Markup */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Markup (x)</label>
                <input type="number" step="0.1" min="1" className={inputCls} value={markup}
                  onChange={(e) => setMarkup(parseFloat(e.target.value) || 1)} />
              </div>

              {/* Ship To */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Ship To</label>
                <input className={inputCls} value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value.toUpperCase())} placeholder="IL" maxLength={2} />
              </div>

              {/* Warehouse Strategy */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Warehouse Priority</label>
                <select className={selectCls} value={warehouseStrategy} onChange={(e) => setWarehouseStrategy(e.target.value as "cheapest" | "fastest")}>
                  <option value="cheapest">Cheapest Shipping</option>
                  <option value="fastest">Fastest Delivery</option>
                </select>
              </div>

              {/* ILS Rate */}
              {hasIlsChannel && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">USD &rarr; ILS Rate</label>
                  <input type="number" step="0.01" min="1" className={inputCls} value={ilsRate}
                    onChange={(e) => setIlsRate(parseFloat(e.target.value) || 3.6)} />
                </div>
              )}
            </div>

            {/* Collections (multi-select chips) */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Collections <span className="font-normal text-text-muted">(multi-select)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {meta?.collections?.map((col) => {
                  const isSelected = defaultCollections.includes(col.slug);
                  return (
                    <button
                      key={col.slug}
                      onClick={() => toggleCollection(col.slug)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-text-muted border-border hover:border-gray-400"
                      }`}
                    >
                      {col.name}
                    </button>
                  );
                }) ?? <span className="text-xs text-text-muted">Loading...</span>}
              </div>
            </div>

            {/* Channels (multi-select chips) */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Channels <span className="font-normal text-text-muted">(multi-select)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {meta?.channels?.map((ch) => {
                  const isSelected = selectedChannels.includes(ch.slug);
                  return (
                    <button
                      key={ch.slug}
                      onClick={() => toggleChannel(ch.slug)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-text-muted border-border hover:border-gray-400"
                      }`}
                    >
                      {ch.slug} ({ch.currencyCode})
                    </button>
                  );
                }) ?? <span className="text-xs text-text-muted">Loading channels...</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs text-text-muted">
                {products.length} products, {totalVariants} variants | Markup: {markup}x | Margin: ~{((1 - 1 / markup) * 100).toFixed(0)}%
              </span>
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 transition-colors"
                  onClick={handleDownloadCSV}
                >
                  <Download size={14} />
                  Download CSV
                </button>
                <button
                  className="px-4 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
                  onClick={handleImport}
                  disabled={importMutation.isLoading || selectedChannels.length === 0}
                >
                  {importMutation.isLoading ? "Importing..." : `Import ${products.length} to Aura`}
                </button>
              </div>
            </div>

            {/* Import progress */}
            {importMutation.isLoading && (
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: "100%" }} />
                </div>
                <p className="text-xs text-text-muted">Importing products to Aura...</p>
              </div>
            )}

            {/* Import results */}
            {importProgress && !importMutation.isLoading && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Import complete: {okCount} succeeded, {errCount} failed
                </p>
                <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                  {importProgress.results.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center py-1.5 text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        r.status === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {r.status === "ok" ? "OK" : "ERR"}
                      </span>
                      <span className="truncate">{r.name}</span>
                      {r.error && <span className="text-xs text-red-700 truncate">{r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sourcing table */}
          <SourcingTable
            products={products}
            markup={markup}
            shippingLoading={shippingLoading}
            warehouseLoading={warehouseLoading}
            warehouseStrategy={warehouseStrategy}
            onUpdateProduct={updateProduct}
            onRemoveProduct={removeProduct}
            onToggleVariants={toggleVariants}
            onSelectWarehouse={(pid, origin) => {
              setProducts((prev) =>
                prev.map((p) => {
                  if (p.pid !== pid) return p;
                  const wh = p.warehouseOptions.find((w) => w.origin === origin);
                  if (!wh) return p;
                  const pick = warehouseStrategy === "cheapest" ? wh.cheapest : wh.fastest;
                  return {
                    ...p,
                    selectedWarehouse: origin,
                    shippingCost: pick?.cost ?? p.shippingCost,
                    shippingCarrier: pick?.carrier ?? p.shippingCarrier,
                    shippingDays: pick?.days ?? p.shippingDays,
                  };
                }),
              );
            }}
          />
        </>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <div className="py-12 rounded-lg border border-dashed border-gray-300 flex flex-col items-center gap-2">
          <p className="text-base font-medium text-text-muted">No products sourced yet</p>
          <p className="text-sm text-text-muted">
            Search for products or paste CJ URLs above to get started
          </p>
        </div>
      )}
    </div>
  );
}

export default function SourcePage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8 text-sm text-text-muted">
        Connecting to Saleor Dashboard...
      </div>
    );
  }

  return <SourceProducts />;
}
