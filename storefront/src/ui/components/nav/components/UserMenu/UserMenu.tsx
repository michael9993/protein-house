"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { UserInfo } from "./components/UserInfo";
import { UserAvatar } from "./components/UserAvatar";
import { type UserDetailsFragment } from "@/gql/graphql";
import { logout } from "@/app/actions";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type Props = {
	user: UserDetailsFragment;
};

const menuItems = [
	{
		section: "account",
		items: [
			{ 
				label: "My Account", 
				href: "/account", 
				icon: (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				),
			},
			{ 
				label: "My Orders", 
				href: "/account/orders", 
				icon: (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
					</svg>
				),
			},
			{ 
				label: "Addresses", 
				href: "/account/addresses", 
				icon: (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
						<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
					</svg>
				),
			},
		],
	},
	{
		section: "preferences",
		items: [
			{ 
				label: "Wishlist", 
				href: "/account/wishlist", 
				icon: (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
					</svg>
				),
			},
			{ 
				label: "Settings", 
				href: "/account/settings", 
				icon: (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				),
			},
		],
	},
];

export function UserMenu({ user }: Props) {
	return (
		<Menu as="div" className="relative">
			<Menu.Button className="group relative flex items-center gap-2 rounded-full p-2 transition-all duration-200 hover:bg-neutral-100">
				<span className="sr-only">Open user menu</span>
				<UserAvatar user={user} />
				<span className="hidden text-sm font-medium text-neutral-700 lg:inline">
					{user.firstName || "Account"}
				</span>
				<svg 
					className="hidden h-4 w-4 text-neutral-500 transition-transform group-hover:text-neutral-700 lg:block" 
					fill="none" 
					viewBox="0 0 24 24" 
					stroke="currentColor" 
					strokeWidth={2}
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</Menu.Button>
			<Transition
				as={Fragment}
				enter="transition ease-out duration-200"
				enterFrom="transform opacity-0 scale-95 translate-y-1"
				enterTo="transform opacity-100 scale-100 translate-y-0"
				leave="transition ease-in duration-150"
				leaveFrom="transform opacity-100 scale-100 translate-y-0"
				leaveTo="transform opacity-0 scale-95 translate-y-1"
			>
				<Menu.Items className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
					{/* User Info Header */}
					<div className="border-b border-neutral-100 px-4 py-3">
						<UserInfo user={user} />
					</div>
					
					{/* Menu Sections */}
					{menuItems.map((section, sectionIndex) => (
						<div key={section.section} className={clsx(
							"py-2",
							sectionIndex !== menuItems.length - 1 && "border-b border-neutral-100"
						)}>
							{section.items.map((item) => (
								<Menu.Item key={item.href}>
									{({ active }) => (
										<LinkWithChannel
											href={item.href}
											className={clsx(
												"flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
												active 
													? "bg-neutral-50 text-neutral-900" 
													: "text-neutral-600 hover:text-neutral-900"
											)}
										>
											<span className={clsx(
												"flex-shrink-0 transition-colors",
												active ? "text-[#FF5722]" : "text-neutral-400"
											)}>
												{item.icon}
											</span>
											{item.label}
										</LinkWithChannel>
									)}
								</Menu.Item>
							))}
						</div>
					))}
					
					{/* Logout */}
					<div className="pt-2">
						<Menu.Item>
							{({ active }) => (
								<form action={logout}>
									<button
										type="submit"
										className={clsx(
											"flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
											active 
												? "bg-red-50 text-red-600" 
												: "text-neutral-600 hover:text-red-600"
										)}
									>
										<svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
										</svg>
										Sign Out
									</button>
								</form>
							)}
						</Menu.Item>
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
