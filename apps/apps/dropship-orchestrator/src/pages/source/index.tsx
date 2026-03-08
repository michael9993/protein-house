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
import { ComboboxInput } from "@/modules/source/combobox-input";
import { ComboboxMulti } from "@/modules/source/combobox-multi";

const inputCls =
  "w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20";
const selectCls = `${inputCls} cursor-pointer`;

function SourceProducts() {
  const [activeTab, setActiveTab] = useState<"search" | "urls">("urls");

  // ── Settings state ──
  const [markup, setMarkup] = useState(2.5);
  const [defaultType, setDefaultType] = useState("dropship-product");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultGender, setDefaultGender] = useState("Dog");
  const [defaultCollections, setDefaultCollections] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [destinationCountry, setDestinationCountry] = useState("IL");
  const [ilsRate, setIlsRate] = useState(3.6);

  // ── Product state ──
  const [products, setProducts] = useState<SourcedProduct[]>([]);
  const [fetchErrors, setFetchErrors] = useState<Array<{ pid: string; error: string }>>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
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

  // ── Shipping: fetch all warehouse options in one shot ──
  const parseDays = (s: string) => parseInt(s.match(/(\d+)/)?.[1] || "999", 10);

  function pickBestWarehouse(
    warehouses: SourcedProduct["warehouseOptions"],
    strategy: "cheapest" | "fastest",
  ) {
    return warehouses.reduce((best, wh) => {
      const pick = strategy === "cheapest" ? wh.cheapest : wh.fastest;
      const bestPick = strategy === "cheapest" ? best.cheapest : best.fastest;
      if (!pick) return best;
      if (!bestPick) return wh;
      if (strategy === "cheapest") return pick.cost < bestPick.cost ? wh : best;
      return parseDays(pick.days) < parseDays(bestPick.days) ? wh : best;
    });
  }

  const shippingMutation = trpcClient.source.fetchWarehouseShipping.useMutation({
    onSuccess: (data) => {
      setProducts((prev) =>
        prev.map((p) => {
          const match = data.results.find((r) => r.pid === p.pid);
          if (!match || match.warehouses.length === 0) return p;
          const bestWh = pickBestWarehouse(match.warehouses, warehouseStrategy);
          const pick = warehouseStrategy === "cheapest" ? bestWh.cheapest : bestWh.fastest;
          return {
            ...p,
            warehouseOptions: match.warehouses,
            selectedWarehouse: bestWh.origin,
            shippingCost: pick?.cost ?? null,
            shippingCarrier: pick?.carrier ?? "",
            shippingDays: pick?.days ?? "",
          };
        }),
      );
      setShippingLoading(false);
    },
    onError: () => setShippingLoading(false),
  });

  // Trigger when new products arrive that don't have warehouse options yet
  useEffect(() => {
    if (products.length === 0 || shippingLoading) return;
    const needsShipping = products.filter((p) => p.warehouseOptions.length === 0);
    if (needsShipping.length === 0) return;
    setShippingLoading(true);
    shippingMutation.mutate({
      products: needsShipping.map((p) => ({
        pid: p.pid,
        vid: p.variants[0]?.vid ?? "",
      })),
      destinationCountry,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // When strategy changes, re-apply warehouse selection from cached options
  useEffect(() => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.warehouseOptions.length === 0) return p;
        const bestWh = pickBestWarehouse(p.warehouseOptions, warehouseStrategy);
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

  // ── Import mutation (used per-product to avoid Cloudflare 524 timeout) ──
  const importMutation = trpcClient.source.importToAura.useMutation();
  const [importing, setImporting] = useState(false);

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

  const handleImport = useCallback(async () => {
    if (products.length === 0 || selectedChannels.length === 0) return;
    setImporting(true);
    setImportProgress({ total: products.length, done: 0, results: [] });

    const results: Array<{ name: string; status: "ok" | "error"; error?: string }> = [];

    // Import one product at a time to avoid Cloudflare 524 timeout
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        const data = await importMutation.mutateAsync({
          products: [{
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
              // Use product-level shipping as fallback (warehouse fetch only sets product-level)
              shippingCost: v.shippingCost ?? p.shippingCost,
              shippingCarrier: v.shippingCarrier || p.shippingCarrier,
              shippingDays: v.shippingDays || p.shippingDays,
            })),
            editName: p.editName,
            editType: defaultType,
            editCategory: defaultCategory,
            editCollections: defaultCollections.join(";"),
            editGender: defaultGender,
            shippingDays: p.shippingDays,
            shippingCarrier: p.shippingCarrier,
          }],
          channelSlugs: selectedChannels,
          markup,
          ilsRate: hasIlsChannel ? ilsRate : undefined,
        });
        for (const c of data.created) results.push({ name: c.name, status: "ok" });
        for (const e of data.errors) results.push({ name: e.name, status: "error", error: e.error });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ name: p.editName, status: "error", error: msg });
      }
      setImportProgress({ total: products.length, done: i + 1, results: [...results] });
    }

    setImporting(false);
  }, [products, selectedChannels, markup, ilsRate, hasIlsChannel, importMutation, defaultType, defaultCategory, defaultGender, defaultCollections]);

  const toggleChannel = (slug: string) => {
    setSelectedChannels((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  // toggleCollection removed — ComboboxMulti handles add/remove

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
                <ComboboxInput
                  value={defaultType}
                  onChange={setDefaultType}
                  options={meta?.productTypes?.map((t) => ({ value: t.slug, label: t.name })) ?? []}
                  placeholder="Type or select..."
                  className={inputCls}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
                <ComboboxInput
                  value={defaultCategory}
                  onChange={setDefaultCategory}
                  options={meta?.categories?.map((c) => ({
                    value: c.slug,
                    label: c.level > 0 ? "\u00A0".repeat(c.level * 2) + "└ " + c.name : c.name,
                  })) ?? []}
                  placeholder="Type or select..."
                  className={inputCls}
                />
              </div>

              {/* Pet Type */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Pet Type</label>
                <select className={selectCls} value={defaultGender} onChange={(e) => setDefaultGender(e.target.value)}>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Both">Both</option>
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

            {/* Collections (combobox multi-select) */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Collections <span className="font-normal text-text-muted">(type to add new or select existing)</span>
              </label>
              <ComboboxMulti
                values={defaultCollections}
                onChange={setDefaultCollections}
                options={meta?.collections?.map((col) => ({ value: col.slug, label: col.name })) ?? []}
                placeholder="Type collection name..."
                className={inputCls}
              />
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
                {shippingLoading && " | ⏳ Fetching shipping rates..."}
              </span>
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  onClick={handleDownloadCSV}
                  disabled={shippingLoading}
                >
                  <Download size={14} />
                  {shippingLoading ? "Loading rates..." : "Download CSV"}
                </button>
                <button
                  className="px-4 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
                  onClick={handleImport}
                  disabled={importing || selectedChannels.length === 0 || shippingLoading}
                >
                  {importing
                    ? `Importing ${importProgress?.done ?? 0}/${products.length}...`
                    : shippingLoading
                    ? "Fetching shipping rates..."
                    : `Import ${products.length} to Aura`}
                </button>
              </div>
            </div>

            {/* Import progress */}
            {importing && importProgress && (
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${((importProgress.done / importProgress.total) * 100).toFixed(0)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">
                  Importing product {importProgress.done}/{importProgress.total}...
                </p>
              </div>
            )}

            {/* Import results */}
            {importProgress && !importing && importProgress.done > 0 && (
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
