export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square rounded-xl bg-neutral-200" />
      
      {/* Content skeleton */}
      <div className="mt-4 space-y-3">
        {/* Category */}
        <div className="h-3 w-16 rounded bg-neutral-200" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
        </div>
        
        {/* Price */}
        <div className="h-5 w-20 rounded bg-neutral-200" />
        
        {/* Rating */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-4 rounded bg-neutral-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

