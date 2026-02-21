export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Header + Add button skeleton */}
			<div className="flex items-center justify-between">
				<div>
					<div className="h-7 w-36 animate-pulse rounded bg-neutral-200" />
					<div className="mt-1 h-4 w-24 animate-pulse rounded bg-neutral-200" />
				</div>
				<div className="h-10 w-28 animate-pulse rounded-lg bg-neutral-200" />
			</div>

			{/* Address cards skeleton */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="rounded-lg border border-neutral-200 p-5">
						{i <= 2 && (
							<div className="mb-3 h-5 w-32 animate-pulse rounded-full bg-neutral-100" />
						)}
						<div className="space-y-2">
							<div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
							<div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
							<div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
							<div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
						</div>
						<div className="mt-4 flex gap-2">
							<div className="h-8 w-14 animate-pulse rounded bg-neutral-200" />
							<div className="h-8 w-16 animate-pulse rounded bg-neutral-200" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
