interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail?: { url: string } | null;
    media?: { id: string; url: string; alt: string; type: string }[];
  };
  onClick: (productId: string) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const mediaCount = product.media?.length ?? 0;

  return (
    <button
      onClick={() => onClick(product.id)}
      className="group text-left rounded-lg border bg-background p-2 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="aspect-square rounded-md bg-muted overflow-hidden mb-2">
        {product.thumbnail?.url ? (
          <img
            src={product.thumbnail.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlaceholderIcon />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{product.name}</p>
      <p className="text-[10px] text-muted-foreground">
        {mediaCount} image{mediaCount !== 1 ? "s" : ""}
      </p>
    </button>
  );
}

function PlaceholderIcon() {
  return (
    <svg className="h-8 w-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
