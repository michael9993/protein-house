import { Suspense } from "react";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { NavLinks } from "./components/NavLinks";
import { ChannelPickerWrapper } from "./components/ChannelPickerWrapper";
import { MobileMenu } from "./components/MobileMenu";
import type { MobileNavData } from "./components/NavLinksClient";

export const Nav = ({ channel, navData, isLoggedIn }: { channel: string; navData?: MobileNavData; isLoggedIn?: boolean }) => {
	return (
		<>
			{/* Desktop Navigation - Only Actions (Links are in Header) */}
			<nav className="hidden md:flex items-center gap-2 lg:gap-3" aria-label="Main navigation actions">
				<div className="flex items-center gap-1 sm:gap-2">
					<ChannelPickerWrapper />
					<Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />}>
						<UserMenuContainer channel={channel} />
					</Suspense>
					<Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />}>
						<CartNavItem channel={channel} />
					</Suspense>
				</div>
			</nav>

			{/* Mobile Menu – Shopify-style sections when navData provided */}
			<div className="flex md:hidden">
				<MobileMenu channel={channel} navData={navData} isLoggedIn={isLoggedIn} />
			</div>
		</>
	);
};
