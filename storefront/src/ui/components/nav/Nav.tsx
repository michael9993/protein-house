import { Suspense } from "react";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { NavLinks } from "./components/NavLinks";
import { ChannelPickerWrapper } from "./components/ChannelPickerWrapper";

export const Nav = ({ channel }: { channel: string }) => {
	return (
		<nav className="flex w-full items-center gap-4 lg:gap-6" aria-label="Main navigation">
			{/* Desktop Navigation Links */}
			<ul className="hidden items-center gap-1 overflow-x-auto whitespace-nowrap md:flex lg:gap-2">
				<NavLinks channel={channel} />
			</ul>
			
			{/* Right Side Actions (Left in RTL) - Uses logical margin for proper RTL support */}
			<div className="ms-auto flex items-center gap-1 sm:gap-2">
				{/* Channel/Currency Picker - Desktop only */}
				<div className="hidden md:block">
					<ChannelPickerWrapper />
				</div>
				
				{/* User Account - Desktop only (mobile is in bottom nav) */}
				<div className="hidden md:block">
					<Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />}>
						<UserMenuContainer />
					</Suspense>
				</div>
				
				{/* Cart - Desktop only (mobile is in bottom nav) */}
				<div className="hidden md:block">
					<Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />}>
						<CartNavItem channel={channel} />
					</Suspense>
				</div>
			</div>
		</nav>
	);
};
