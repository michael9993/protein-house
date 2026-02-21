export default function Loading() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Title skeleton */}
			<div className="mb-8 h-8 w-40 animate-pulse rounded bg-neutral-200" />

			<div className="lg:grid lg:grid-cols-12 lg:gap-8">
				{/* Cart items skeleton */}
				<div className="lg:col-span-8">
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-4 rounded-lg border border-neutral-200 p-4">
								<div className="h-24 w-24 flex-shrink-0 animate-pulse rounded-lg bg-neutral-200" />
								<div className="flex-1">
									<div className="h-5 w-48 animate-pulse rounded bg-neutral-200" />
									<div className="mt-2 h-4 w-24 animate-pulse rounded bg-neutral-200" />
									<div className="mt-3 flex items-center justify-between">
										<div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
										<div className="h-5 w-16 animate-pulse rounded bg-neutral-200" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Order summary skeleton */}
				<div className="mt-8 lg:col-span-4 lg:mt-0">
					<div className="rounded-lg border border-neutral-200 p-6">
						<div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
						<div className="mt-6 space-y-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex justify-between">
									<div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
									<div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
								</div>
							))}
						</div>
						<div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-neutral-200" />
					</div>
				</div>
			</div>
		</div>
	);
}
