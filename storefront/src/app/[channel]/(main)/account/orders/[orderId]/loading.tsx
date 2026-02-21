export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Back link + title skeleton */}
			<div>
				<div className="mb-2 h-4 w-24 animate-pulse rounded bg-neutral-200" />
				<div className="h-7 w-40 animate-pulse rounded bg-neutral-200" />
				<div className="mt-1 h-4 w-32 animate-pulse rounded bg-neutral-200" />
			</div>

			{/* Status + summary skeleton */}
			<div className="rounded-lg border border-neutral-200 p-5">
				<div className="flex items-center justify-between">
					<div className="h-6 w-28 animate-pulse rounded-full bg-neutral-200" />
					<div className="h-5 w-20 animate-pulse rounded bg-neutral-200" />
				</div>
			</div>

			{/* Order items skeleton */}
			<div className="rounded-lg border border-neutral-200 p-5">
				<div className="mb-4 h-6 w-24 animate-pulse rounded bg-neutral-200" />
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center gap-4 border-b border-neutral-100 pb-4">
							<div className="h-16 w-16 animate-pulse rounded-lg bg-neutral-200" />
							<div className="flex-1">
								<div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
								<div className="mt-1 h-4 w-20 animate-pulse rounded bg-neutral-200" />
							</div>
							<div className="h-5 w-16 animate-pulse rounded bg-neutral-200" />
						</div>
					))}
				</div>
				{/* Totals */}
				<div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
					<div className="flex justify-between">
						<div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
						<div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
					</div>
					<div className="flex justify-between">
						<div className="h-5 w-12 animate-pulse rounded bg-neutral-200" />
						<div className="h-5 w-24 animate-pulse rounded bg-neutral-200" />
					</div>
				</div>
			</div>
		</div>
	);
}
