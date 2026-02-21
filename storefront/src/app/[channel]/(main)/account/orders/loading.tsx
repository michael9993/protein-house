export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Header skeleton */}
			<div>
				<div className="h-7 w-32 animate-pulse rounded bg-neutral-200" />
				<div className="mt-1 h-4 w-24 animate-pulse rounded bg-neutral-200" />
			</div>

			{/* Orders list skeleton */}
			<div className="space-y-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="rounded-lg border border-neutral-200 p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 animate-pulse rounded-lg bg-neutral-200" />
								<div>
									<div className="h-5 w-28 animate-pulse rounded bg-neutral-200" />
									<div className="mt-1 h-4 w-20 animate-pulse rounded bg-neutral-200" />
									<div className="mt-1 h-4 w-16 animate-pulse rounded bg-neutral-200" />
								</div>
							</div>
							<div className="text-end">
								<div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
								<div className="mt-2 h-5 w-16 animate-pulse rounded bg-neutral-200" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
