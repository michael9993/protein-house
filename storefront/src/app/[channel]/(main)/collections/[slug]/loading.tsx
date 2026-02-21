import { ProductCardSkeleton } from "@/ui/components/ProductCard";

export default function Loading() {
	return (
		<div className="min-h-screen bg-neutral-50/50">
			<div className="mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
				{/* Breadcrumbs skeleton */}
				<div className="mb-6 flex gap-2">
					<div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
					<div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
					<div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
				</div>

				{/* Header skeleton */}
				<div className="mb-6 sm:mb-8">
					<div className="h-8 w-48 animate-pulse rounded bg-neutral-200 sm:h-10" />
					<div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-200" />
				</div>

				{/* Grid skeleton */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{Array.from({ length: 12 }).map((_, i) => (
						<ProductCardSkeleton key={i} />
					))}
				</div>
			</div>
		</div>
	);
}
