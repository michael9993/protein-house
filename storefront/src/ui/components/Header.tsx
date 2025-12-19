import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";
import { storeConfig } from "@/config";

export function Header({ channel }: { channel: string }) {
	const { branding, ecommerce, store } = storeConfig;
	
	return (
		<header className="sticky top-0 z-50 w-full">
			{/* Promo Banner - Full Width */}
			{ecommerce.shipping.enabled && ecommerce.shipping.freeShippingThreshold && (
				<div 
					className="w-full py-2 text-center text-xs font-medium sm:text-sm"
					style={{ 
						backgroundColor: branding.colors.primary,
						color: "white",
					}}
				>
					<div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4">
						<svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
						</svg>
						<span className="hidden sm:inline">🎉 </span>
						<span>Free shipping on orders over ${ecommerce.shipping.freeShippingThreshold}</span>
						<span className="hidden md:inline"> • Fast delivery worldwide</span>
					</div>
				</div>
			)}
			
			{/* Main Header - Full Width Background */}
			<div 
				className="w-full backdrop-blur-md"
				style={{ 
					backgroundColor: `${branding.colors.background}f5`,
					borderBottom: `1px solid ${branding.colors.textMuted}15`,
					boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
				}}
			>
				{/* Container for content - max-width on large screens */}
				<div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
					<div className="flex h-14 items-center justify-between gap-4 sm:h-16 md:gap-6 lg:gap-8">
						{/* Logo */}
						<div className="flex-shrink-0">
							<Logo />
						</div>
						
						{/* Navigation - takes remaining space */}
						<div className="flex flex-1 items-center justify-end">
							<Nav channel={channel} />
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
