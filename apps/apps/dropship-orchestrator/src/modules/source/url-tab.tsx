import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import type { SourcedProduct } from "./types";

interface UrlTabProps {
  defaults: {
    type: string;
    category: string;
    gender: string;
    collections: string;
    country: string;
  };
  onProductsFetched: (
    products: SourcedProduct[],
    errors: Array<{ pid: string; error: string }>,
  ) => void;
}

export function UrlTab({ defaults, onProductsFetched }: UrlTabProps) {
  const [urlText, setUrlText] = useState("");

  const fetchMutation = trpcClient.source.fetchProducts.useMutation({
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
        warehouseOptions: [],
        selectedWarehouse: "CN",
        showVariants: false,
      }));
      onProductsFetched(sourced, data.errors);
      setUrlText("");
    },
  });

  const handleFetch = useCallback(() => {
    const urls = urlText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    fetchMutation.mutate({ urls });
  }, [urlText, fetchMutation]);

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">
          CJ Product URLs, PIDs, UUIDs, or SKUs (one per line)
        </label>
        <textarea
          className="w-full min-h-[120px] px-3 py-2 text-sm border border-border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder={"https://cjdropshipping.com/product/detail/1005006839284893.html\n1005006839284893\n77501FB4-7146-452E-9889-CDF41697E5CF\nCJJSBGBG01517"}
        />
      </div>

      <div className="flex gap-3 items-center">
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
          onClick={handleFetch}
          disabled={fetchMutation.isLoading || !urlText.trim()}
        >
          {fetchMutation.isLoading ? "Fetching..." : "Fetch from CJ"}
        </button>
        <span className="text-xs text-text-muted">Paste product URLs or IDs, one per line</span>
      </div>

      {fetchMutation.error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-700">{fetchMutation.error.message}</p>
        </div>
      )}
    </div>
  );
}
