import { Suspense } from "react";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { NavLinks } from "./components/NavLinks";
import { MobileMenu } from "./components/MobileMenu";
import { SearchBar } from "./components/SearchBar";

export const Nav = ({ channel }: { channel: string }) => {
	return (
		<nav className="flex w-full items-center gap-4 lg:gap-6" aria-label="Main navigation">
			{/* Desktop Navigation Links */}
			<ul className="hidden items-center gap-1 overflow-x-auto whitespace-nowrap md:flex lg:gap-2">
				<NavLinks channel={channel} />
			</ul>
			
			{/* Right Side Actions */}
			<div className="ml-auto flex items-center gap-1 sm:gap-2">
				{/* Search - Desktop only */}
				<div className="hidden lg:flex">
					<SearchBar channel={channel} />
				</div>
				
				{/* User Account */}
				<Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />}>
					<UserMenuContainer />
				</Suspense>
				
				{/* Cart */}
				<Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />}>
					<CartNavItem channel={channel} />
				</Suspense>
			</div>
			
			{/* Mobile Menu */}
			<Suspense>
				<MobileMenu>
					<SearchBar channel={channel} />
					<NavLinks channel={channel} />
				</MobileMenu>
			</Suspense>
		</nav>
	);
};
