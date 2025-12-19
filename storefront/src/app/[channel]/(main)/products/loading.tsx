import { ProductCardSkeleton } from "@/ui/components/ProductCard";

export default function Loading() {
	return (
		<div className="min-h-screen bg-neutral-50/50">
			<div className="mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
				{/* Breadcrumbs skeleton */}
				<div className="mb-6">
					<div className="flex gap-2">
						<div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
						<div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
						<div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
					</div>
				</div>

				{/* Header skeleton */}
				<div className="mb-6 sm:mb-8">
					<div className="h-8 w-48 animate-pulse rounded bg-neutral-200 sm:h-10" />
					<div className="mt-2 h-4 w-32 animate-pulse rounded bg-neutral-200" />
				</div>

				<div className="flex gap-6 lg:gap-8">
					{/* Filters skeleton - Desktop */}
					<aside className="hidden w-64 flex-shrink-0 lg:block">
						<div className="rounded-lg bg-white p-4 shadow-sm">
							<div className="mb-6 h-6 w-20 animate-pulse rounded bg-neutral-200" />
							<div className="space-y-4">
								{[1, 2, 3, 4, 5].map((i) => (
									<div key={i} className="flex items-center gap-3">
										<div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
										<div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
									</div>
								))}
							</div>
							<div className="mt-8 mb-4 h-6 w-16 animate-pulse rounded bg-neutral-200" />
							<div className="space-y-3">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="flex items-center gap-3">
										<div className="h-4 w-4 animate-pulse rounded-full bg-neutral-200" />
										<div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
									</div>
								))}
							</div>
						</div>
					</aside>

					{/* Products skeleton - Full remaining width */}
					<div className="min-w-0 flex-1">
						{/* Toolbar skeleton */}
						<div className="mb-4 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
							<div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-200 lg:hidden" />
							<div className="ml-auto flex items-center gap-4">
								<div className="hidden h-4 w-20 animate-pulse rounded bg-neutral-200 sm:block" />
								<div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-200" />
							</div>
						</div>

						{/* Grid skeleton */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
							{Array.from({ length: 20 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
