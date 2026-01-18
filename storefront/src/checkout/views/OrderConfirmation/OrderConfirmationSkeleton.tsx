import { SummarySkeleton } from "@/checkout/sections/Summary/SummarySkeleton";
import { Skeleton } from "@/checkout/components/Skeleton";

export const OrderConfirmationSkeleton = () => {
	return (
		<main className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
			{/* Left Column */}
			<div className="space-y-8">
				{/* Success Header Skeleton */}
				<div className="rounded-xl border p-6" style={{ borderColor: "var(--store-neutral-200)", backgroundColor: "var(--store-surface)" }}>
					<div className="flex items-start gap-4">
						<Skeleton className="h-12 w-12 rounded-full" />
						<div className="flex-1 space-y-3">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-7 w-48" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-10 w-64 rounded-lg" />
						</div>
					</div>
				</div>

				{/* What's Next Skeleton */}
				<div className="rounded-xl border bg-white p-6" style={{ borderColor: "var(--store-neutral-200)" }}>
					<Skeleton className="mb-4 h-5 w-32" />
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex items-start gap-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Order Details Skeleton */}
				<div className="rounded-xl border bg-white" style={{ borderColor: "var(--store-neutral-200)" }}>
					<div className="border-b px-6 py-4" style={{ borderColor: "var(--store-neutral-100)" }}>
						<Skeleton className="h-5 w-28" />
					</div>
					<div className="divide-y" style={{ "--tw-divide-color": "var(--store-neutral-100)" } as React.CSSProperties}>
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex items-start gap-3 px-6 py-4">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-4 w-32" />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Action Buttons Skeleton */}
				<div className="flex gap-3">
					<Skeleton className="h-10 w-40 rounded-lg" />
					<Skeleton className="h-10 w-32 rounded-lg" />
				</div>
			</div>

			{/* Right Column - Summary */}
			<div>
				<SummarySkeleton />
			</div>
		</main>
	);
};
