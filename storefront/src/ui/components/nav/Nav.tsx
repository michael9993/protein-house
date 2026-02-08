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
			{/* Desktop Navigation - Action buttons with dividers */}
			<nav className="hidden md:flex items-center" aria-label="Main navigation actions">
				<div className="flex items-center gap-0.5">
					<ChannelPickerWrapper />
					<div className="h-5 w-px bg-neutral-200 mx-1" aria-hidden="true" />
					<Suspense fallback={<div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100" />}>
						<UserMenuContainer channel={channel} />
					</Suspense>
					<Suspense fallback={<div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100" />}>
						<CartNavItem channel={channel} />
					</Suspense>
				</div>
			</nav>

			{/* Mobile Menu */}
			<div className="flex md:hidden">
				<MobileMenu channel={channel} navData={navData} isLoggedIn={isLoggedIn} />
			</div>
		</>
	);
};
