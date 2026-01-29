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
			<header className="sticky top-0 z-50 w-full">
				<HeaderBanner />
				<div className="w-full backdrop-blur-md bg-white/95 border-b border-neutral-200/50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
					<div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
						<div className="flex h-16 items-center justify-between gap-4 sm:gap-6 lg:gap-8">
							<div className="flex-shrink-0">
								<Logo />
							</div>
							<HeaderStoreName />
							<div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1">
								<ul className="flex items-center gap-1 lg:gap-2">
									<NavLinks channel={channel} navData={navData} />
								</ul>
							</div>
							<div className="hidden md:flex flex-1 items-center justify-center max-w-xl mx-4">
								<SearchBar channel={channel} />
							</div>
							<div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
								<Nav channel={channel} navData={navData} />
							</div>
							<div className="flex md:hidden items-center gap-2">
								<ChannelPickerWrapper />
								<Nav channel={channel} navData={navData} isLoggedIn={isLoggedIn} />
							</div>
						</div>
					</div>
				</div>
				<StickyQuickFilters />
			</header>
			<MobileBottomNavClient channel={channel} isLoggedIn={isLoggedIn} />
		</>
	);
}
