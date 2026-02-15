import { useState } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";

interface ProductMediaListProps {
  productId: string;
  channel: string;
  onEditImage: (imageUrl: string) => void;
  onBack: () => void;
}

export function ProductMediaList({
  productId,
  channel,
  onEditImage,
  onBack,
}: ProductMediaListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: product, isLoading, refetch } = trpcClient.products.getDetail.useQuery({
    productId,
    channel,
  });

  const deleteMutation = trpcClient.media.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeletingId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Product not found</p>
        <button onClick={onBack} className="mt-2 text-sm text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const media = product.media ?? [];

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h3 className="text-sm font-semibold">{product.name}</h3>
          <p className="text-[10px] text-muted-foreground">{media.length} media item{media.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">No images for this product</p>
          <p className="text-xs text-muted-foreground mt-1">Upload from the editor to add images</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((item: any) => (
            <div
              key={item.id}
              className="group relative aspect-square rounded-lg border overflow-hidden bg-muted"
            >
              <img
                src={item.url}
                alt={item.alt || "Product media"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => onEditImage(item.url)}
                  className="px-3 py-1.5 text-xs rounded-md bg-white text-black font-medium hover:bg-white/90"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this image?")) {
                      setDeletingId(item.id);
                      deleteMutation.mutate({ mediaId: item.id });
                    }
                  }}
                  disabled={deletingId === item.id}
                  className="px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deletingId === item.id ? "..." : "Delete"}
                </button>
              </div>
              {item.alt && (
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 text-white text-[10px] truncate">
                  {item.alt}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
