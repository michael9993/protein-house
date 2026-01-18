"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { useBranding, useStoreInfo } from "@/providers/StoreConfigProvider";
import { DefaultChannelSlug } from "@/app/config";
import { useState } from "react";

// Default SVG logo when no image URL is provided
function DefaultLogoIcon() {
	return (
		<svg 
			className="h-8 w-8" 
			viewBox="0 0 24 24" 
			fill="currentColor"
		>
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
		</svg>
	);
}

export const Logo = () => {
	const pathname = usePathname();
	const params = useParams();
	const [imageError, setImageError] = useState(false);
	
	// Use hooks from context
	const branding = useBranding();
	const store = useStoreInfo();
	
	// Get the channel from params, extract from pathname, or use config default
	const channel = (params?.channel as string) || 
		(pathname.split("/").find((part, index) => 
			index > 0 && part && part !== "api" && part !== "_next" && part !== "checkout"
		)) || DefaultChannelSlug;
	const homeUrl = `/${channel}`;

	// Check if we have a valid logo URL from config
	const hasLogoUrl = branding.logo && 
		branding.logo !== "/logo.svg" && 
		branding.logo.trim() !== "" &&
		!imageError;

	// Render logo image or fallback to SVG
	const renderLogoImage = () => {
		if (hasLogoUrl) {
			// Use Next.js Image for optimized loading if it's an absolute URL
			if (branding.logo.startsWith("http")) {
				return (
					<Image
						src={branding.logo}
						alt={branding.logoAlt || store.name}
						width={120}
						height={32}
						className="h-8 w-auto object-contain"
						onError={() => setImageError(true)}
						unoptimized // Allow external images
					/>
				);
			}
			// For relative paths, use regular img
			return (
				<img
					src={branding.logo}
					alt={branding.logoAlt || store.name}
					className="h-8 w-auto object-contain"
					onError={() => setImageError(true)}
				/>
			);
		}
		return <DefaultLogoIcon />;
	};

	const logoContent = (
		<span 
			className="flex items-center gap-2.5 text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
			style={{ color: branding.colors.primary }}
		>
			{renderLogoImage()}
			<span className="hidden sm:inline">{store.name}</span>
		</span>
	);

	// Always link to channel homepage
	if (pathname === homeUrl) {
		return (
			<h1 className="flex items-center" aria-label="homepage">
				{logoContent}
			</h1>
		);
	}
	
	return (
		<div className="flex items-center">
			<Link href={homeUrl} aria-label="homepage">
				{logoContent}
			</Link>
		</div>
	);
};
