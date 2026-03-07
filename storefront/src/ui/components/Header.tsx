import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";
import { NavLinks } from "./nav/components/NavLinks";
import { StickyQuickFilters } from "@/app/[channel]/(main)/products/StickyQuickFilters";
import { MobileBottomNavClient } from "./nav/components/MobileBottomNavClient";
import { ChannelPickerWrapper } from "./nav/components/ChannelPickerWrapper";
import { HeaderBanner } from "./HeaderBanner";
import { HeaderStoreName } from "./HeaderStoreName";
import { SearchBar } from "./nav/components/SearchBar";
import type { MobileNavData } from "./nav/components/NavLinksClient";

export function Header({ channel, navData, isLoggedIn }: { channel: string; navData?: MobileNavData; isLoggedIn?: boolean }) {
	return (
		<>
			<header
				data-cd="layout-header"
				className="sticky top-0 z-50 w-full"
				style={{
					background: 'var(--cd-layout-header-bg, transparent)',
				}}
			>
				{/* Only the banner + nav hide on scroll */}
				<div data-scroll-hide="header">
					<HeaderBanner channel={channel} />
					<div className="header-bar w-full border-b border-neutral-200/60">
						<div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
							<div className="flex h-14 items-center justify-between gap-3 sm:gap-5 lg:gap-6">
								{/* Logo + Store Name */}
								<div className="flex items-center gap-3 flex-shrink-0">
									<Logo />
								</div>
								<HeaderStoreName />
								{/* Desktop Nav Links */}
								<nav className="hidden md:flex items-center flex-1" aria-label="Main categories">
									<ul className="flex items-center gap-0.5 lg:gap-1">
										<NavLinks channel={channel} navData={navData} />
									</ul>
								</nav>
								{/* Desktop Search */}
								<div className="hidden md:flex flex-1 items-center justify-center max-w-lg mx-3 lg:mx-6">
									<SearchBar channel={channel} />
								</div>
								{/* Desktop Actions */}
								<div className="hidden md:flex items-center flex-shrink-0">
									<Nav channel={channel} navData={navData} />
								</div>
								{/* Mobile Actions */}
								<div className="flex md:hidden items-center gap-1.5">
									<ChannelPickerWrapper />
									<Nav channel={channel} navData={navData} isLoggedIn={isLoggedIn} />
								</div>
							</div>
						</div>
					</div>
				</div>
				<StickyQuickFilters />
				{/* Portal target for mega menu — sits at bottom of header flow */}
				<div id="mega-menu-root" className="relative" />
			</header>
			<MobileBottomNavClient channel={channel} isLoggedIn={isLoggedIn} />
		</>
	);
}
