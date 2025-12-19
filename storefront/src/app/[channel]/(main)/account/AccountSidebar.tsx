"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { type UserDetailsFragment } from "@/gql/graphql";
import { logout } from "@/app/actions";
import { storeConfig } from "@/config";

interface AccountSidebarProps {
	user: UserDetailsFragment;
	channel: string;
}

const menuItems = [
	{
		label: "Dashboard",
		href: "/account",
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
			</svg>
		),
	},
	{
		label: "My Orders",
		href: "/account/orders",
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
			</svg>
		),
	},
	{
		label: "Addresses",
		href: "/account/addresses",
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
			</svg>
		),
	},
	{
		label: "Wishlist",
		href: "/account/wishlist",
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
			</svg>
		),
	},
	{
		label: "Settings",
		href: "/account/settings",
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		),
	},
];

export function AccountSidebar({ user, channel }: AccountSidebarProps) {
	const pathname = usePathname();
	const { branding } = storeConfig;

	// Get user initials
	const initials = user.firstName && user.lastName
		? `${user.firstName[0]}${user.lastName[0]}`
		: user.email.slice(0, 2).toUpperCase();

	const userName = user.firstName && user.lastName
		? `${user.firstName} ${user.lastName}`
		: user.email;

	return (
		<div className="sticky top-24 space-y-6">
			{/* User Card */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
				<div className="flex items-center gap-4">
					{user.avatar?.url ? (
						<img
							src={user.avatar.url}
							alt={user.avatar.alt || userName}
							className="h-14 w-14 rounded-full object-cover ring-2 ring-neutral-100"
						/>
					) : (
						<div 
							className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{initials}
						</div>
					)}
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-neutral-900">{userName}</h2>
						<p className="truncate text-sm text-neutral-500">{user.email}</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-100">
				<ul className="divide-y divide-neutral-100">
					{menuItems.map((item) => {
						const href = `/${channel}${item.href}`;
						const isActive = pathname === href || (item.href !== "/account" && pathname.startsWith(href));
						
						return (
							<li key={item.href}>
								<Link
									href={href}
									className={clsx(
										"flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
										isActive
											? "bg-neutral-50 text-neutral-900"
											: "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
									)}
								>
									<span className={clsx(
										"transition-colors",
										isActive ? "text-[#FF5722]" : "text-neutral-400"
									)}>
										{item.icon}
									</span>
									{item.label}
									{isActive && (
										<span 
											className="ml-auto h-2 w-2 rounded-full"
											style={{ backgroundColor: branding.colors.primary }}
										/>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
				
				{/* Sign Out */}
				<div className="border-t border-neutral-100">
					<form action={logout}>
						<button
							type="submit"
							className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-600"
						>
							<svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
							</svg>
							Sign Out
						</button>
					</form>
				</div>
			</nav>

			{/* Help Card */}
			<div className="rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white">
				<h3 className="font-semibold">Need Help?</h3>
				<p className="mt-1 text-sm text-neutral-300">
					Our support team is here to assist you 24/7
				</p>
				<Link
					href={`/${channel}/contact`}
					className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
				>
					Contact Support
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
					</svg>
				</Link>
			</div>
		</div>
	);
}

