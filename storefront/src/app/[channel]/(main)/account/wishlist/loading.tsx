export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Header skeleton */}
			<div>
				<div className="h-7 w-36 animate-pulse rounded bg-neutral-200" />
				<div className="mt-1 h-4 w-20 animate-pulse rounded bg-neutral-200" />
			</div>

			{/* Wishlist grid skeleton */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className="rounded-lg border border-neutral-200 p-3">
						<div className="aspect-square w-full animate-pulse rounded-lg bg-neutral-200" />
						<div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
						<div className="mt-2 h-5 w-16 animate-pulse rounded bg-neutral-200" />
						<div className="mt-3 h-9 w-full animate-pulse rounded-lg bg-neutral-200" />
					</div>
				))}
			</div>
		</div>
	);
}
