import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";
import { StickyQuickFilters } from "@/app/[channel]/(main)/products/StickyQuickFilters";
import { MobileBottomNavClient } from "./nav/components/MobileBottomNavClient";
import { ChannelPickerWrapper } from "./nav/components/ChannelPickerWrapper";
import { HeaderBanner } from "./HeaderBanner";
import { HeaderStoreName } from "./HeaderStoreName";

export function Header({ channel }: { channel: string }) {
	return (
		<>
			<header className="sticky top-0 z-50 w-full">
				{/* Promo Banner - Full Width (config-driven, client component) */}
				<HeaderBanner />
				
				{/* Main Header - Full Width Background */}
				<div 
					className="w-full backdrop-blur-md bg-white/95"
					style={{ 
						boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
					}}
				>
					{/* Container for content - max-width on large screens, RTL-safe padding */}
					<div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
						{/* Mobile: Just Logo | Desktop: Full Nav - RTL-safe flex layout */}
						<div className="flex h-14 items-center justify-between gap-4 sm:h-16 md:gap-6 lg:gap-8">
							{/* Logo - RTL-safe flex-shrink */}
							<div className="flex-shrink-0">
								<Logo />
							</div>
							
							{/* Mobile: Brand Name - Center (config-driven, client component) */}
							<HeaderStoreName />
							
							{/* Desktop Navigation - hidden on mobile, RTL-safe justify */}
							<div className="hidden md:flex flex-1 items-center justify-end rtl:justify-start">
								<Nav channel={channel} />
							</div>
							
							{/* Mobile: Channel Picker + Mobile Menu Button - RTL-safe gap */}
							<div className="flex md:hidden items-center gap-2">
								<ChannelPickerWrapper />
								<Nav channel={channel} />
							</div>
						</div>
					</div>
				</div>
				
				{/* Sticky Quick Filters - Rendered in navbar, no margin */}
				<StickyQuickFilters />
			</header>
			
			{/* Mobile Bottom Navigation - Only on mobile */}
			<MobileBottomNavClient channel={channel} />
		</>
	);
}
