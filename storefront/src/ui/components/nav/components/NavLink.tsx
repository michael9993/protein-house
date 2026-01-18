"use client";

import clsx from "clsx";
import { type ReactElement } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import useSelectedPathname from "@/hooks/useSelectedPathname";
import { useBranding } from "@/providers/StoreConfigProvider";

export function NavLink({ 
	href, 
	children,
	className,
}: { 
	href: string; 
	children: ReactElement | string;
	className?: string;
}) {
	const pathname = useSelectedPathname();
	const isActive = pathname === href || pathname.startsWith(href + "/");
	const branding = useBranding();

	return (
		<li className="inline-flex">
			<LinkWithChannel
				href={href}
				className={clsx(
					"rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
					!isActive && "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
					className,
				)}
				style={isActive ? { 
					backgroundColor: branding.colors.primary, 
					color: "white",
					boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
				} : undefined}
			>
				{children}
			</LinkWithChannel>
		</li>
	);
}
