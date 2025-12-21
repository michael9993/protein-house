"use client";

import { useWishlist } from "@/lib/wishlist";

interface AccountStatsGridProps {
	totalOrders: number;
	savedAddresses: number;
	memberSince: string;
}

// Icon components
const OrdersIcon = () => (
	<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
	</svg>
);

const WishlistIcon = () => (
	<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
	</svg>
);

const AddressIcon = () => (
	<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
		<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
	</svg>
);

const CalendarIcon = () => (
	<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
	</svg>
);

export function AccountStatsGrid({ totalOrders, savedAddresses, memberSince }: AccountStatsGridProps) {
	const { itemCount, isLoading } = useWishlist();
	const wishlistCount = isLoading ? null : itemCount;

	const stats = [
		{
			label: "Total Orders",
			value: totalOrders,
			icon: <OrdersIcon />,
			color: "#3B82F6",
		},
		{
			label: "Wishlist Items",
			value: wishlistCount,
			icon: <WishlistIcon />,
			color: "#EF4444",
		},
		{
			label: "Saved Addresses",
			value: savedAddresses,
			icon: <AddressIcon />,
			color: "#10B981",
		},
		{
			label: "Member Since",
			value: memberSince,
			icon: <CalendarIcon />,
			color: "#8B5CF6",
		},
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100"
				>
					<div className="flex items-center gap-4">
						<div
							className="flex h-12 w-12 items-center justify-center rounded-lg"
							style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
						>
							{stat.icon}
						</div>
						<div>
							<p className="text-2xl font-bold text-neutral-900">
								{stat.value === null ? (
									<span className="inline-block h-7 w-8 animate-pulse rounded bg-neutral-200" />
								) : (
									stat.value
								)}
							</p>
							<p className="text-sm text-neutral-500">{stat.label}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

