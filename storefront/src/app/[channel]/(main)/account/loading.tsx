export default function Loading() {
	return (
		<div className="space-y-6">
			{/* Welcome header skeleton */}
			<div className="rounded-xl bg-neutral-100 p-6">
				<div className="h-7 w-48 animate-pulse rounded bg-neutral-200" />
				<div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-200" />
			</div>

			{/* Stats grid skeleton */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="rounded-lg border border-neutral-200 p-4">
						<div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
						<div className="mt-2 h-8 w-12 animate-pulse rounded bg-neutral-200" />
					</div>
				))}
			</div>

			{/* Sections skeleton */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<div key={i} className="rounded-lg border border-neutral-200 p-5">
						<div className="h-5 w-24 animate-pulse rounded bg-neutral-200" />
						<div className="mt-2 h-4 w-36 animate-pulse rounded bg-neutral-200" />
					</div>
				))}
			</div>

			{/* Recent orders skeleton */}
			<div className="rounded-lg border border-neutral-200 p-5">
				<div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
				<div className="mt-4 space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-3">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 animate-pulse rounded bg-neutral-200" />
								<div>
									<div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
									<div className="mt-1 h-3 w-16 animate-pulse rounded bg-neutral-200" />
								</div>
							</div>
							<div className="h-6 w-16 animate-pulse rounded-full bg-neutral-200" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
