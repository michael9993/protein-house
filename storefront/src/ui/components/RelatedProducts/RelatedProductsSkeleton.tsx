/**
 * Skeleton loading state for Related Products section.
 * Matches the layout of RelatedProductsSection for smooth loading transition.
 */
export function RelatedProductsSkeleton() {
  return (
    <section className="mt-4 border-t border-neutral-200 pt-8 animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header Skeleton */}
        <div className="mb-6 flex flex-col items-center">
          <div className="h-8 w-48 bg-neutral-200 rounded-md mb-3" />
          <div className="h-5 w-72 bg-neutral-100 rounded-md" />
        </div>

        {/* Carousel Skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex-none w-[260px] sm:w-[280px]"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Individual product card skeleton
 */
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-neutral-100">
      {/* Image Skeleton */}
      <div className="aspect-square bg-neutral-200" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="h-3 w-16 bg-neutral-100 rounded" />
        
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-neutral-200 rounded" />
          <div className="h-4 w-2/3 bg-neutral-200 rounded" />
        </div>
        
        {/* Price */}
        <div className="h-5 w-20 bg-neutral-200 rounded" />
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-4 bg-neutral-100 rounded" />
            ))}
          </div>
          <div className="h-3 w-12 bg-neutral-100 rounded" />
        </div>
      </div>
    </div>
  );
}
