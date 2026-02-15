import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ProductCard } from "./ProductCard";
import { ProductMediaList } from "./ProductMediaList";

interface ProductBrowserProps {
  onEditImage: (imageUrl: string) => void;
}

export function ProductBrowser({ onEditImage }: ProductBrowserProps) {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data: channels } = trpcClient.products.channels.useQuery(undefined, {
    onSuccess: (data: any[]) => {
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0].slug);
      }
    },
  });

  const { data, isLoading } = trpcClient.products.list.useQuery(
    {
      channel: selectedChannel,
      first: 24,
      after: cursor,
      search: searchQuery || undefined,
    },
    { enabled: !!selectedChannel }
  );

  const handleSearch = useCallback(() => {
    setSearchQuery(search);
    setCursor(undefined);
    setSelectedProductId(null);
  }, [search]);

  if (selectedProductId && selectedChannel) {
    return (
      <ProductMediaList
        productId={selectedProductId}
        channel={selectedChannel}
        onEditImage={onEditImage}
        onBack={() => setSelectedProductId(null)}
      />
    );
  }

  const products = data?.products ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasNextPage = data?.pageInfo?.hasNextPage ?? false;

  return (
    <div className="p-4">
      {/* Channel selector + Search */}
      <div className="flex gap-2 mb-4">
        {channels && channels.length > 1 && (
          <select
            value={selectedChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value);
              setCursor(undefined);
              setSelectedProductId(null);
            }}
            className="px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            {channels.map((ch: any) => (
              <option key={ch.slug} value={ch.slug}>
                {ch.name} ({ch.currencyCode})
              </option>
            ))}
          </select>
        )}
        <div className="flex-1 flex gap-1.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search products..."
            className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground mb-3">
          {totalCount} product{totalCount !== 1 ? "s" : ""} found
          {searchQuery ? ` for "${searchQuery}"` : ""}
        </p>
      )}

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No products match your search" : "No products found in this channel"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={setSelectedProductId}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {cursor && (
              <button
                onClick={() => setCursor(undefined)}
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent"
              >
                First Page
              </button>
            )}
            {hasNextPage && (
              <button
                onClick={() => setCursor(data?.pageInfo?.endCursor ?? undefined)}
                className="px-4 py-2 text-sm rounded-md border hover:bg-accent"
              >
                Next Page
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
