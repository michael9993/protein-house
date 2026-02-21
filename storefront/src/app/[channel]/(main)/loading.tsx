export default function Loading() {
	return (
		<div className="min-h-screen">
			{/* Hero skeleton */}
			<div className="relative h-[60vh] w-full animate-pulse bg-neutral-200 sm:h-[70vh]">
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
					<div className="h-10 w-64 rounded bg-neutral-300 sm:h-14 sm:w-96" />
					<div className="h-5 w-48 rounded bg-neutral-300 sm:w-72" />
					<div className="mt-4 h-12 w-40 rounded-lg bg-neutral-300" />
				</div>
			</div>

			{/* Section skeletons */}
			<div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
				{/* Trust strip skeleton */}
				<div className="flex justify-center gap-8">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="flex flex-col items-center gap-2">
							<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
							<div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
						</div>
					))}
				</div>

				{/* Category section skeleton */}
				<div>
					<div className="mb-6 h-7 w-40 animate-pulse rounded bg-neutral-200" />
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className="aspect-square animate-pulse rounded-xl bg-neutral-200" />
						))}
					</div>
				</div>

				{/* Products section skeleton */}
				<div>
					<div className="mb-6 h-7 w-48 animate-pulse rounded bg-neutral-200" />
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i}>
								<div className="aspect-square animate-pulse rounded-xl bg-neutral-200" />
								<div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
								<div className="mt-2 h-5 w-16 animate-pulse rounded bg-neutral-200" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
