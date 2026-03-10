import { useState, useCallback, useRef } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import type { SourcedProduct } from "./types";

/** Max SKUs per API call — CJ rate limit is 1 req/sec, so 25 SKUs ≈ 25-50s */
const CHUNK_SIZE = 25;

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
  const [progress, setProgress] = useState<{ current: number; total: number; fetched: number; failed: number } | null>(null);
  const abortRef = useRef(false);

  const fetchMutation = trpcClient.source.fetchProducts.useMutation();

  const mapToSourced = useCallback(
    (products: typeof fetchMutation extends { data: infer D } ? NonNullable<D>["products"] : never) =>
      products.map((p) => ({
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
        // Enrichment defaults (populated by enrichProducts)
        categoryPath: [],
        suggestedType: "",
        suggestedCollections: [],
        seoTitle: "",
        seoDescription: "",
        shippingCost: null,
        shippingCarrier: "",
        shippingDays: "",
        warehouseOptions: [],
        selectedWarehouse: "CN",
        showVariants: false,
      })) as SourcedProduct[],
    [defaults],
  );

  const handleFetch = useCallback(async () => {
    const urls = urlText
      .split(/[\n,]+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];
        if (trimmed.includes("://")) return [trimmed];
        return trimmed.split(/\s+/);
      })
      .filter(Boolean);
    if (urls.length === 0) return;

    // Small batch — send directly
    if (urls.length <= CHUNK_SIZE) {
      try {
        setProgress({ current: 1, total: 1, fetched: 0, failed: 0 });
        const data = await fetchMutation.mutateAsync({ urls });
        const sourced = mapToSourced(data.products);
        onProductsFetched(sourced, data.errors);
        setUrlText("");
      } finally {
        setProgress(null);
      }
      return;
    }

    // Large batch — chunk and send sequentially with progress
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
      chunks.push(urls.slice(i, i + CHUNK_SIZE));
    }

    abortRef.current = false;
    const allProducts: SourcedProduct[] = [];
    const allErrors: Array<{ pid: string; error: string }> = [];

    for (let i = 0; i < chunks.length; i++) {
      if (abortRef.current) break;

      setProgress({
        current: i + 1,
        total: chunks.length,
        fetched: allProducts.length,
        failed: allErrors.length,
      });

      try {
        const data = await fetchMutation.mutateAsync({ urls: chunks[i] });
        const sourced = mapToSourced(data.products);
        allProducts.push(...sourced);
        allErrors.push(...data.errors);
      } catch (e) {
        // If a chunk fails entirely, record errors for all its SKUs
        for (const url of chunks[i]) {
          allErrors.push({ pid: url, error: e instanceof Error ? e.message : "Request failed" });
        }
      }
    }

    // Deliver accumulated results
    onProductsFetched(allProducts, allErrors);
    setUrlText("");
    setProgress(null);
  }, [urlText, fetchMutation, mapToSourced, onProductsFetched]);

  const handleAbort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const isLoading = progress !== null;

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
          placeholder={"https://cjdropshipping.com/product/pet-brush-p-1561538210651066368.html\nCJGD2040116 CJMY1152072\n1005006839284893\n77501FB4-7146-452E-9889-CDF41697E5CF"}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3 items-center">
        {isLoading && progress && progress.total > 1 ? (
          <>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
              onClick={handleAbort}
            >
              Stop
            </button>
            <span className="text-xs text-text-muted">
              Batch {progress.current}/{progress.total} — {progress.fetched} fetched, {progress.failed} failed
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
              onClick={handleFetch}
              disabled={isLoading || !urlText.trim()}
            >
              {isLoading ? "Fetching..." : "Fetch from CJ"}
            </button>
            <span className="text-xs text-text-muted">Paste product URLs, PIDs, or CJ SKUs (one per line, or space/comma separated)</span>
          </>
        )}
      </div>

      {fetchMutation.error && !isLoading && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-700">{fetchMutation.error.message}</p>
        </div>
      )}
    </div>
  );
}
