"use client";

import { useWishlist } from "@/lib/wishlist";
import { useDashboardText } from "@/providers/StoreConfigProvider";

interface AccountStatsGridProps {
	totalOrders: number;
	savedAddresses: number;
	memberSince: string;
}

export function AccountStatsGrid({ totalOrders, savedAddresses, memberSince }: AccountStatsGridProps) {
	const { itemCount, isLoading } = useWishlist();
	const wishlistCount = isLoading ? null : itemCount;
	const dashboardText = useDashboardText();

	const stats = [
		{ label: dashboardText.totalOrders, value: totalOrders },
		{ label: dashboardText.wishlistItems, value: wishlistCount },
		{ label: dashboardText.savedAddresses, value: savedAddresses },
		{ label: dashboardText.memberSince, value: memberSince },
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-lg border border-neutral-200 bg-white px-5 py-4 transition-colors hover:border-neutral-300"
				>
					<p className="text-2xl font-bold text-neutral-900">
						{stat.value === null ? (
							<span className="inline-block h-7 w-8 animate-pulse rounded bg-neutral-100" />
						) : (
							stat.value
						)}
					</p>
					<p className="mt-1 text-xs text-neutral-500">{stat.label}</p>
				</div>
			))}
		</div>
	);
}
