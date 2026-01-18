import { Skeleton } from "@/checkout/components";

export const SummarySkeleton = () => (
	<div className="sticky top-8 h-fit w-full">
		<div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: "var(--store-neutral-200)" }}>
			{/* Header */}
			<div className="border-b px-6 py-4" style={{ borderColor: "var(--store-neutral-100)" }}>
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-6 w-16 rounded-full" />
				</div>
			</div>

			{/* Products Toggle */}
			<div className="flex items-center justify-between px-6 py-3">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-4 w-4" />
			</div>

			{/* Product Items */}
			<div className="space-y-2 px-4 pb-2">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-3 rounded-lg p-2">
						<Skeleton className="h-16 w-16 rounded-lg" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-20" />
						</div>
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>

			{/* Promo Code */}
			<div className="border-t px-6 py-4" style={{ borderColor: "var(--store-neutral-100)" }}>
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>

			{/* Price Breakdown */}
			<div className="border-t px-6 py-4" style={{ borderColor: "var(--store-neutral-100)" }}>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-12" />
					</div>
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-12" />
					</div>
				</div>
			</div>

			{/* Total */}
			<div className="rounded-b-xl px-6 py-4" style={{ backgroundColor: "var(--store-surface)" }}>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Skeleton className="h-5 w-12" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-6 w-20" />
				</div>
			</div>
		</div>

		{/* Security Badge */}
		<div className="mt-4 flex items-center justify-center">
			<Skeleton className="h-4 w-40" />
		</div>
	</div>
);
