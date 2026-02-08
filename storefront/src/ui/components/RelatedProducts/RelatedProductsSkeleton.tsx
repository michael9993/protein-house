/**
 * Skeleton loading state for Related Products section.
 * Matches the layout of the carousel for smooth loading transition.
 */
export function RelatedProductsSkeleton() {
  return (
    <section className="border-t border-neutral-200 bg-white py-16 animate-pulse">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        {/* Section Header Skeleton - matching carousel header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="h-9 w-64 bg-neutral-200 rounded-md" />
            <div className="mt-2 h-5 w-80 bg-neutral-100 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-neutral-200" />
            <div className="h-10 w-10 rounded-full bg-neutral-200" />
          </div>
        </div>

        {/* Carousel Skeleton */}
        <div className="mt-8 flex gap-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex-none w-[260px] sm:w-[280px]">
              <div className="overflow-hidden rounded-3xl border border-neutral-100">
                <div className="aspect-square bg-neutral-200" />
                <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-3">
                  <div className="h-4 w-full bg-neutral-200 rounded" />
                  <div className="h-3 w-20 bg-neutral-100 rounded" />
                  <div className="h-5 w-24 bg-neutral-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
