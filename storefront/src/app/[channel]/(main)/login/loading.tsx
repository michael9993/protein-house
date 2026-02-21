export default function Loading() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="w-full max-w-md space-y-6">
				{/* Title skeleton */}
				<div className="text-center">
					<div className="mx-auto h-8 w-40 animate-pulse rounded bg-neutral-200" />
					<div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-neutral-200" />
				</div>

				{/* Form skeleton */}
				<div className="space-y-4 rounded-lg border border-neutral-200 p-6">
					{/* Email field */}
					<div>
						<div className="mb-1 h-4 w-12 animate-pulse rounded bg-neutral-200" />
						<div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
					</div>
					{/* Password field */}
					<div>
						<div className="mb-1 h-4 w-16 animate-pulse rounded bg-neutral-200" />
						<div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
					</div>
					{/* Button */}
					<div className="h-12 w-full animate-pulse rounded-lg bg-neutral-200" />
					{/* Links */}
					<div className="flex justify-between">
						<div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
						<div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
					</div>
				</div>
			</div>
		</div>
	);
}
