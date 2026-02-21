export default function Loading() {
	return (
		<div className="space-y-8">
			{/* Header skeleton */}
			<div>
				<div className="h-7 w-40 animate-pulse rounded bg-neutral-200" />
				<div className="mt-1 h-4 w-64 animate-pulse rounded bg-neutral-200" />
			</div>

			{/* Profile section skeleton */}
			<div className="rounded-lg border border-neutral-200 p-5">
				<div className="mb-4 h-6 w-36 animate-pulse rounded bg-neutral-200" />
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<div className="mb-1 h-4 w-20 animate-pulse rounded bg-neutral-200" />
							<div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
						</div>
						<div>
							<div className="mb-1 h-4 w-20 animate-pulse rounded bg-neutral-200" />
							<div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
						</div>
					</div>
					<div>
						<div className="mb-1 h-4 w-12 animate-pulse rounded bg-neutral-200" />
						<div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
					</div>
				</div>
			</div>

			{/* Password section skeleton */}
			<div className="rounded-lg border border-neutral-200 p-5">
				<div className="mb-4 h-6 w-36 animate-pulse rounded bg-neutral-200" />
				<div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200" />
			</div>

			{/* Notifications section skeleton */}
			<div className="rounded-lg border border-neutral-200 p-5">
				<div className="mb-4 h-6 w-48 animate-pulse rounded bg-neutral-200" />
				<div className="space-y-3">
					{[1, 2].map((i) => (
						<div key={i} className="flex items-center justify-between">
							<div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
							<div className="h-6 w-10 animate-pulse rounded-full bg-neutral-200" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
