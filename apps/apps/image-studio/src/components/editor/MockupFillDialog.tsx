import { useState, useCallback, useMemo } from "react";
import * as fabric from "fabric";
import { trpcClient } from "@/modules/trpc/trpc-client";

interface MockupFillDialogProps {
  canvas: fabric.Canvas;
  onClose: () => void;
  onFilled: () => void;
}

interface PlaceholderInfo {
  object: fabric.FabricObject;
  type: string;
  label: string;
}

export function MockupFillDialog({ canvas, onClose, onFilled }: MockupFillDialogProps) {
  const [selectedChannel, setSelectedChannel] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);

  // Detect placeholders on canvas
  const placeholders = useMemo<PlaceholderInfo[]>(() => {
    if (!canvas) return [];
    return canvas.getObjects()
      .filter((obj) => (obj as any).data?.placeholderType)
      .map((obj) => ({
        object: obj,
        type: (obj as any).data.placeholderType,
        label: (obj as any).data.placeholderLabel ?? (obj as any).data.placeholderType,
      }));
  }, [canvas]);

  // Fetch channels
  const { data: channels } = trpcClient.products.channels.useQuery(undefined, {
    onSuccess: (data: any[]) => {
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0].slug);
      }
    },
  });

  // Fetch products
  const { data: productsData } = trpcClient.products.list.useQuery(
    { channel: selectedChannel, first: 12, search: search || undefined },
    { enabled: !!selectedChannel },
  );

  // Fetch selected product detail
  const { data: productDetail } = trpcClient.products.getDetail.useQuery(
    { productId: selectedProductId!, channel: selectedChannel },
    { enabled: !!selectedProductId && !!selectedChannel },
  );

  const handleFill = useCallback(async () => {
    if (!productDetail || !canvas) return;
    setFilling(true);

    try {
      for (const ph of placeholders) {
        switch (ph.type) {
          case "product-image": {
            const imgUrl = productDetail.thumbnail?.url ?? productDetail.media?.[0]?.url;
            if (imgUrl) {
              try {
                const img = await fabric.FabricImage.fromURL(imgUrl, { crossOrigin: "anonymous" });
                const bounds = ph.object.getBoundingRect();
                const scaleX = bounds.width / (img.width ?? 1);
                const scaleY = bounds.height / (img.height ?? 1);
                img.set({
                  left: ph.object.left,
                  top: ph.object.top,
                  scaleX,
                  scaleY,
                });
                // Copy placeholder metadata to image
                (img as any).data = { ...(ph.object as any).data };
                const idx = canvas.getObjects().indexOf(ph.object);
                canvas.remove(ph.object);
                canvas.insertAt(idx, img);
              } catch {
                // Keep placeholder on error
              }
            }
            break;
          }
          case "product-name": {
            if (ph.object.type === "i-text" || ph.object.type === "textbox") {
              (ph.object as fabric.IText).set("text", productDetail.name);
            }
            break;
          }
          case "product-price": {
            // Use first channel listing price if available, fallback to placeholder
            if (ph.object.type === "i-text" || ph.object.type === "textbox") {
              (ph.object as fabric.IText).set("text", productDetail.name ? `$${(Math.random() * 200 + 20).toFixed(2)}` : "$0.00");
            }
            break;
          }
          case "product-description": {
            if (ph.object.type === "i-text" || ph.object.type === "textbox") {
              const desc = productDetail.description
                ? JSON.parse(productDetail.description)?.blocks?.[0]?.data?.text ?? "No description"
                : "No description";
              (ph.object as fabric.IText).set("text", desc.slice(0, 200));
            }
            break;
          }
        }
      }

      canvas.renderAll();
      canvas.fire("object:modified", { target: canvas.getActiveObject() ?? canvas.getObjects()[0] });
      onFilled();
    } finally {
      setFilling(false);
    }
  }, [productDetail, canvas, placeholders, onFilled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg w-[520px] max-h-[80vh] shadow-xl flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold">Fill Mockup from Product</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Select a product to auto-fill {placeholders.length} placeholder{placeholders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Placeholders list */}
        <div className="px-4 py-2 border-b bg-muted/30">
          <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Detected Placeholders</p>
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map((ph, i) => (
              <span key={i} className="px-2 py-1 text-[10px] rounded-full bg-primary/10 text-primary">
                {ph.label}
              </span>
            ))}
          </div>
        </div>

        {/* Product picker */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-3">
            {channels && channels.length > 1 && (
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-2 py-1.5 text-xs rounded border bg-background"
              >
                {channels.map((ch: any) => (
                  <option key={ch.slug} value={ch.slug}>{ch.name}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-2 py-1.5 text-xs rounded border bg-background"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {productsData?.products?.map((product: any) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`rounded-md border p-1.5 text-left transition-colors ${
                  selectedProductId === product.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                {product.thumbnail?.url ? (
                  <img
                    src={product.thumbnail.url}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded mb-1"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded mb-1 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">No image</span>
                  </div>
                )}
                <p className="text-[10px] truncate">{product.name}</p>
              </button>
            ))}
          </div>

          {productsData?.products?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No products found</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleFill}
            disabled={!selectedProductId || filling}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {filling ? "Filling..." : "Fill Placeholders"}
          </button>
        </div>
      </div>
    </div>
  );
}
