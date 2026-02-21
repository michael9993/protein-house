export default function Loading() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			{/* Breadcrumbs skeleton */}
			<div className="mb-6 flex gap-2">
				<div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
				<div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
				<div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
				<div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
				<div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
			</div>

			<div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
				{/* Image gallery skeleton */}
				<div>
					<div className="aspect-square w-full animate-pulse rounded-xl bg-neutral-200" />
					<div className="mt-4 flex gap-3">
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className="h-20 w-20 animate-pulse rounded-lg bg-neutral-200" />
						))}
					</div>
				</div>

				{/* Product info skeleton */}
				<div className="mt-8 lg:mt-0">
					{/* Title */}
					<div className="h-8 w-3/4 animate-pulse rounded bg-neutral-200" />
					<div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-neutral-200" />

					{/* Price */}
					<div className="mt-6 flex items-center gap-3">
						<div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
						<div className="h-5 w-16 animate-pulse rounded bg-neutral-200" />
					</div>

					{/* Variant selector */}
					<div className="mt-8">
						<div className="mb-3 h-4 w-16 animate-pulse rounded bg-neutral-200" />
						<div className="flex flex-wrap gap-2">
							{[1, 2, 3, 4, 5].map((i) => (
								<div key={i} className="h-10 w-14 animate-pulse rounded-lg bg-neutral-200" />
							))}
						</div>
					</div>

					{/* Quantity + Add to cart */}
					<div className="mt-8 flex gap-4">
						<div className="h-12 w-28 animate-pulse rounded-lg bg-neutral-200" />
						<div className="h-12 flex-1 animate-pulse rounded-lg bg-neutral-200" />
					</div>

					{/* Description */}
					<div className="mt-8 space-y-2">
						<div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
						<div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200" />
						<div className="h-4 w-4/6 animate-pulse rounded bg-neutral-200" />
					</div>
				</div>
			</div>
		</div>
	);
}
