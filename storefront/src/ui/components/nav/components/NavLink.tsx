"use client";

import clsx from "clsx";
import { type ReactElement } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import useSelectedPathname from "@/hooks/useSelectedPathname";
import { useBranding } from "@/providers/StoreConfigProvider";

interface NavLinkProps {
	href: string;
	children: ReactElement | string;
	className?: string;
	onClick?: () => void;
	wrapperClassName?: string;
	asListItem?: boolean; // Whether to wrap in <li>
}

// Internal link component without wrapper
function NavLinkInner({ 
	href, 
	children,
	className,
	onClick,
}: Omit<NavLinkProps, "wrapperClassName" | "asListItem">) {
	const pathname = useSelectedPathname();
	const isActive = pathname === href || pathname.startsWith(href + "/");
	const branding = useBranding();

	return (
		<LinkWithChannel
			href={href}
			onClick={onClick}
			className={clsx(
				"rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
				!isActive && "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
				className,
			)}
			style={isActive ? { 
				backgroundColor: `${branding.colors.primary}15`, 
				color: branding.colors.primary,
				fontWeight: 600,
			} : undefined}
		>
			{children}
		</LinkWithChannel>
	);
}

export function NavLink({ 
	href, 
	children,
	className,
	onClick,
	wrapperClassName,
	asListItem = true,
}: NavLinkProps) {
	const content = (
		<NavLinkInner
			href={href}
			onClick={onClick}
			className={className}
		>
			{children}
		</NavLinkInner>
	);

	if (!asListItem) {
		return content;
	}

	return (
		<li className={clsx("inline-flex", wrapperClassName)}>
			{content}
		</li>
	);
}

// Export the inner component for use in dropdowns
export { NavLinkInner };
