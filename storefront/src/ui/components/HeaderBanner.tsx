"use client";

import { useBranding, useHeaderConfig } from "@/providers/StoreConfigProvider";

/**
 * Client component for the promotional banner at the top of the header.
 * Reads config from StoreConfigProvider context.
 */
export function HeaderBanner() {
	const branding = useBranding();
	const headerConfig = useHeaderConfig();
	
	// Determine banner visibility and styling
	const showBanner = headerConfig.banner.enabled;
	const bannerText = headerConfig.banner.text;
	const bannerBgColor = headerConfig.banner.backgroundColor || branding.colors.primary;
	const bannerTextColor = headerConfig.banner.textColor || "#FFFFFF";
	
	if (!showBanner || !bannerText) {
		return null;
	}
	
	return (
		<div 
			className="w-full py-2 text-center text-xs font-medium sm:text-sm"
			style={{ 
				backgroundColor: bannerBgColor,
				color: bannerTextColor,
			}}
		>
			<div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4">
				<svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
				</svg>
				<span>{bannerText}</span>
			</div>
		</div>
	);
}
