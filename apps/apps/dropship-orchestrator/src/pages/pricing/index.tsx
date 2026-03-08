import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useState, useEffect } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type PricingTab = "rules" | "rates" | "preview";

const RULE_TYPE_LABELS: Record<string, string> = {
  global: "Global (all products)",
  supplier: "By Supplier",
  category: "By Category",
  region: "By Region",
};

const STRATEGY_LABELS: Record<string, string> = {
  percentage_markup: "Percentage Markup",
  fixed_markup: "Fixed Markup ($)",
  margin_target: "Target Margin (%)",
};

function RulesTab() {
  const { data, isLoading, error, refetch } = trpcClient.pricing.getRules.useQuery();
  const saveMutation = trpcClient.pricing.saveRules.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Pricing rules saved" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const [rules, setRules] = useState<Array<{
    id: string;
    name: string;
    type: string;
    matchValue?: string;
    strategy: string;
    value: number;
    priority: number;
    active: boolean;
  }>>([]);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (data?.rules) {
      setRules(data.rules);
    }
  }, [data]);

  if (isLoading) return <p className="text-sm">Loading pricing rules...</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>;

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        name: "New Rule",
        type: "global",
        strategy: "percentage_markup",
        value: 2.5,
        priority: prev.length,
        active: true,
      },
    ]);
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRule(id: string, field: string, value: string | number | boolean) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Pricing Rules</h2>
          <span className="text-xs text-text-muted">
            Rules are applied in priority order. Higher priority wins when multiple match.
          </span>
        </div>
        <button
          className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          onClick={addRule}
        >
          + Add Rule
        </button>
      </div>

      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`p-4 rounded-lg border flex flex-col gap-3 ${
            rule.active ? "border-border opacity-100" : "border-gray-200 opacity-60"
          }`}
        >
          {/* Row 1: Name + Active toggle + Delete */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <span className="text-xs text-text-muted block">Name</span>
              <input
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                value={rule.name}
                onChange={(e) => updateRule(rule.id, "name", e.target.value)}
              />
            </div>
            <button
              className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
                rule.active
                  ? "text-white bg-brand hover:bg-brand-light"
                  : "border border-border hover:bg-gray-50"
              }`}
              onClick={() => updateRule(rule.id, "active", !rule.active)}
            >
              {rule.active ? "Active" : "Inactive"}
            </button>
            <button
              className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
              onClick={() => removeRule(rule.id)}
            >
              Delete
            </button>
          </div>

          {/* Row 2: Type + Match Value + Strategy + Value + Priority */}
          <div className="flex gap-3 flex-wrap items-end">
            <div style={{ width: "160px" }}>
              <span className="text-xs text-text-muted block">Type</span>
              <select
                value={rule.type}
                onChange={(e) => updateRule(rule.id, "type", e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {Object.entries(RULE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {rule.type !== "global" && (
              <div style={{ width: "160px" }}>
                <span className="text-xs text-text-muted block">
                  {rule.type === "supplier" ? "Supplier ID" : rule.type === "category" ? "Category Slug" : "Region"}
                </span>
                <input
                  className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                  value={rule.matchValue || ""}
                  onChange={(e) => updateRule(rule.id, "matchValue", e.target.value)}
                  placeholder={rule.type === "supplier" ? "cj" : rule.type === "category" ? "dog-toys" : "IL"}
                />
              </div>
            )}

            <div style={{ width: "180px" }}>
              <span className="text-xs text-text-muted block">Strategy</span>
              <select
                value={rule.strategy}
                onChange={(e) => updateRule(rule.id, "strategy", e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {Object.entries(STRATEGY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ width: "100px" }}>
              <span className="text-xs text-text-muted block">
                {rule.strategy === "percentage_markup" ? "Multiplier" : rule.strategy === "fixed_markup" ? "Amount ($)" : "Target (%)"}
              </span>
              <input
                type="number"
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                step="0.1"
                min="0"
                value={String(rule.value)}
                onChange={(e) => updateRule(rule.id, "value", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div style={{ width: "80px" }}>
              <span className="text-xs text-text-muted block">Priority</span>
              <input
                type="number"
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                min="0"
                value={String(rule.priority)}
                onChange={(e) => updateRule(rule.id, "priority", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      ))}

      {rules.length === 0 && (
        <div className="p-6 rounded-lg border border-dashed border-gray-300 flex justify-center">
          <span className="text-sm text-text-muted">No pricing rules configured. Add a rule to get started.</span>
        </div>
      )}

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <button
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
        disabled={saveMutation.isLoading}
        onClick={() => saveMutation.mutate({ rules })}
      >
        {saveMutation.isLoading ? "Saving..." : "Save Rules"}
      </button>
    </div>
  );
}

function RatesTab() {
  const { data, isLoading, error, refetch } = trpcClient.pricing.getRates.useQuery();
  const saveMutation = trpcClient.pricing.saveRates.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Exchange rates saved" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const [rates, setRates] = useState<Array<{
    from: string;
    to: string;
    rate: number;
    updatedAt: string;
  }>>([]);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (data?.rates) {
      setRates(data.rates);
    }
  }, [data]);

  if (isLoading) return <p className="text-sm">Loading exchange rates...</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>;

  function addRate() {
    setRates((prev) => [
      ...prev,
      { from: "USD", to: "", rate: 1, updatedAt: new Date().toISOString() },
    ]);
  }

  function removeRate(index: number) {
    setRates((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRate(index: number, field: string, value: string | number) {
    setRates((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, [field]: value, ...(field === "rate" ? { updatedAt: new Date().toISOString() } : {}) }
          : r,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Exchange Rates</h2>
          <span className="text-xs text-text-muted">
            Manual exchange rates for multi-channel pricing. Update regularly for accuracy.
          </span>
        </div>
        <button
          className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          onClick={addRate}
        >
          + Add Rate
        </button>
      </div>

      {/* Staleness warnings */}
      {data?.warnings && data.warnings.length > 0 && (
        <div className="p-4 rounded-lg bg-yellow-50">
          <span className="font-semibold text-yellow-800">Stale Rate Warnings</span>
          {data.warnings.map((w) => (
            <span key={w.pair} className="text-xs text-yellow-800 block">
              {w.message}
            </span>
          ))}
        </div>
      )}

      {rates.map((rate, idx) => (
        <div
          key={idx}
          className="p-4 rounded-lg border border-border flex gap-3 items-end"
        >
          <div style={{ width: "100px" }}>
            <span className="text-xs text-text-muted block">From</span>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={rate.from}
              onChange={(e) => updateRate(idx, "from", e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="USD"
            />
          </div>
          <div style={{ width: "100px" }}>
            <span className="text-xs text-text-muted block">To</span>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={rate.to}
              onChange={(e) => updateRate(idx, "to", e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="ILS"
            />
          </div>
          <div style={{ width: "120px" }}>
            <span className="text-xs text-text-muted block">Rate</span>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              step="0.01"
              min="0"
              value={String(rate.rate)}
              onChange={(e) => updateRate(idx, "rate", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex-1">
            <span className="text-xs text-text-muted">
              Updated: {new Date(rate.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <button
            className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
            onClick={() => removeRate(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      {rates.length === 0 && (
        <div className="p-6 rounded-lg border border-dashed border-gray-300 flex justify-center">
          <span className="text-sm text-text-muted">No exchange rates configured. Add a rate for multi-currency support.</span>
        </div>
      )}

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <button
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
        disabled={saveMutation.isLoading}
        onClick={() => saveMutation.mutate({ rates })}
      >
        {saveMutation.isLoading ? "Saving..." : "Save Rates"}
      </button>
    </div>
  );
}

function PreviewTab() {
  const previewMutation = trpcClient.pricing.previewPricing.useMutation();

  const [products, setProducts] = useState<Array<{
    name: string;
    costPrice: number;
    supplierId: string;
    categorySlug: string;
  }>>([
    { name: "Sample Product", costPrice: 10, supplierId: "cj", categorySlug: "dog-toys" },
  ]);
  const [targetCurrency, setTargetCurrency] = useState("USD");

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      { name: "", costPrice: 0, supplierId: "cj", categorySlug: "" },
    ]);
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateProduct(index: number, field: string, value: string | number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function runPreview() {
    previewMutation.mutate({ products, targetCurrency });
  }

  function marginColorCls(value: number, threshold: number): string {
    return value > threshold ? "text-green-700" : "text-yellow-700";
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Pricing Preview</h2>
        <span className="text-xs text-text-muted">
          Enter product costs to preview retail prices based on your active rules.
        </span>
      </div>

      {/* Target currency */}
      <div style={{ width: "120px" }}>
        <span className="text-xs text-text-muted block">Target Currency</span>
        <input
          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
          value={targetCurrency}
          onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          placeholder="USD"
        />
      </div>

      {/* Product inputs */}
      {products.map((p, idx) => (
        <div
          key={idx}
          className="p-4 rounded-lg border border-border flex gap-3 items-end flex-wrap"
        >
          <div style={{ width: "180px" }}>
            <span className="text-xs text-text-muted block">Product Name</span>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={p.name}
              onChange={(e) => updateProduct(idx, "name", e.target.value)}
              placeholder="Product name"
            />
          </div>
          <div style={{ width: "100px" }}>
            <span className="text-xs text-text-muted block">Cost ($)</span>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              step="0.01"
              min="0"
              value={String(p.costPrice)}
              onChange={(e) => updateProduct(idx, "costPrice", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div style={{ width: "120px" }}>
            <span className="text-xs text-text-muted block">Supplier</span>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={p.supplierId}
              onChange={(e) => updateProduct(idx, "supplierId", e.target.value)}
              placeholder="cj"
            />
          </div>
          <div style={{ width: "160px" }}>
            <span className="text-xs text-text-muted block">Category</span>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={p.categorySlug}
              onChange={(e) => updateProduct(idx, "categorySlug", e.target.value)}
              placeholder="dog-toys"
            />
          </div>
          <button
            className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
            onClick={() => removeProduct(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          onClick={addProduct}
        >
          + Add Product
        </button>
        <button
          className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
          disabled={previewMutation.isLoading || products.length === 0}
          onClick={runPreview}
        >
          {previewMutation.isLoading ? "Computing..." : "Preview Pricing"}
        </button>
      </div>

      {/* Results */}
      {previewMutation.data?.results && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Results</h3>

          {/* Header */}
          <div
            className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg"
            style={{ gridTemplateColumns: "1fr 90px 90px 90px 80px 1fr" }}
          >
            <span className="text-xs text-text-muted">Product</span>
            <span className="text-xs text-text-muted">Cost</span>
            <span className="text-xs text-text-muted">Retail</span>
            <span className="text-xs text-text-muted">Margin</span>
            <span className="text-xs text-text-muted">Margin %</span>
            <span className="text-xs text-text-muted">Rule Applied</span>
          </div>

          {previewMutation.data.results.map((r, idx) => (
            <div
              key={idx}
              className="grid gap-2 px-4 py-3 border border-border rounded-lg items-center"
              style={{ gridTemplateColumns: "1fr 90px 90px 90px 80px 1fr" }}
            >
              <span className="text-xs">{r.name}</span>
              <span className="text-xs">{r.currency} {r.costPrice.toFixed(2)}</span>
              <span className="font-semibold text-sm">{r.currency} {r.retailPrice.toFixed(2)}</span>
              <span className={`text-xs ${marginColorCls(r.margin, 0)}`}>
                {r.currency} {r.margin.toFixed(2)}
              </span>
              <span className={`text-xs ${marginColorCls(r.marginPercent, 30)}`}>
                {r.marginPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-text-muted">{r.appliedRule}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingContent() {
  const [activeTab, setActiveTab] = useState<PricingTab>("rules");

  const tabs: Array<{ value: PricingTab; label: string }> = [
    { value: "rules", label: "Pricing Rules" },
    { value: "rates", label: "Exchange Rates" },
    { value: "preview", label: "Preview" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div>
        <h1 className="text-xl font-semibold text-text-primary">Pricing Engine</h1>
        <p className="text-sm text-text-muted">
          Configure markup rules, exchange rates, and preview retail pricing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
              activeTab === tab.value
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "rules" && <RulesTab />}
      {activeTab === "rates" && <RatesTab />}
      {activeTab === "preview" && <PreviewTab />}
    </div>
  );
}

export default function PricingPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <PricingContent />;
}
