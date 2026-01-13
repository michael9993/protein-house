export function ProductCardSkeleton() {
  return (
    <article className="relative flex flex-col rounded-xl overflow-hidden bg-white animate-pulse" style={{ border: "1px solid #e5e7eb" }}>
      {/* Image skeleton */}
      <div className="relative aspect-square overflow-hidden bg-neutral-200" />
      
      {/* Content skeleton */}
      <div className="mt-3 flex flex-col p-4 sm:mt-4 sm:p-5 bg-neutral-50">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-3/4 rounded bg-neutral-200" />
        </div>
        
        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="h-4 w-16 rounded bg-neutral-200" />
        </div>
      </div>
    </article>
  );
}

