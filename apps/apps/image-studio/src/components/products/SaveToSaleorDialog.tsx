import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ProductCard } from "./ProductCard";

interface SaveToSaleorDialogProps {
  imageBase64: string;
  format: "png" | "jpeg";
  onClose: () => void;
  onSaved: (productId: string, mediaId: string) => void;
}

type Step = "select-product" | "confirm";

export function SaveToSaleorDialog({
  imageBase64,
  format,
  onClose,
  onSaved,
}: SaveToSaleorDialogProps) {
  const [step, setStep] = useState<Step>("select-product");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [altText, setAltText] = useState("");

  const { data: channels } = trpcClient.products.channels.useQuery(undefined, {
    onSuccess: (data: any[]) => {
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0].slug);
      }
    },
  });

  const { data, isLoading } = trpcClient.products.list.useQuery(
    { channel: selectedChannel, first: 20, search: searchQuery || undefined },
    { enabled: !!selectedChannel }
  );

  const uploadMutation = trpcClient.media.uploadToProduct.useMutation({
    onSuccess: (result) => {
      onSaved(selectedProduct.id, result.mediaId ?? "");
    },
  });

  const handleSelectProduct = useCallback((productId: string) => {
    const product = data?.products?.find((p: any) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setAltText(product.name);
      setStep("confirm");
    }
  }, [data]);

  const handleUpload = useCallback(() => {
    if (!selectedProduct) return;
    uploadMutation.mutate({
      productId: selectedProduct.id,
      imageBase64,
      alt: altText,
      format,
    });
  }, [selectedProduct, imageBase64, altText, format, uploadMutation]);

  const products = data?.products ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-[560px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {step === "select-product" ? "Save to Product" : "Confirm Upload"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === "select-product" && (
            <>
              {/* Channel + Search */}
              <div className="flex gap-2 mb-4">
                {channels && channels.length > 1 && (
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="px-2 py-1.5 text-sm rounded-md border bg-background"
                  >
                    {channels.map((ch: any) => (
                      <option key={ch.slug} value={ch.slug}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex-1 flex gap-1.5">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setSearchQuery(search)}
                    placeholder="Search products..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
                  />
                  <button
                    onClick={() => setSearchQuery(search)}
                    className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Product grid */}
              {isLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-2" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No products found
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {products.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={handleSelectProduct}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {step === "confirm" && selectedProduct && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-lg border overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={imageBase64}
                    alt="Canvas export"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: {format.toUpperCase()}
                  </p>
                  <button
                    onClick={() => setStep("select-product")}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Change product
                  </button>
                </div>
              </div>

              {/* Alt text */}
              <div>
                <label className="text-xs text-muted-foreground">Alt Text</label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image..."
                  className="w-full px-3 py-2 text-sm rounded-md border bg-background mt-1"
                />
              </div>

              {/* Error */}
              {uploadMutation.error && (
                <p className="text-xs text-destructive">
                  {uploadMutation.error.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "confirm" && (
          <div className="px-5 py-3 border-t flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
              disabled={uploadMutation.isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isLoading}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {uploadMutation.isLoading ? "Uploading..." : "Save to Product"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
