"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { useBranding, useStoreInfo } from "@/providers/StoreConfigProvider";
import { DefaultChannelSlug } from "@/app/config";
import { useState } from "react";

// Default storefront icon when no logo image is configured
function DefaultLogoIcon() {
	return (
		<svg
			className="h-7 w-7"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
		>
			<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
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
						width={160}
						height={64}
						className="h-12 w-auto object-contain"
						onError={() => setImageError(true)}
					/>
				);
			}
			// For relative paths, use regular img
			return (
				<img
					src={branding.logo}
					alt={branding.logoAlt || store.name}
					className="h-12 w-auto object-contain"
					onError={() => setImageError(true)}
				/>
			);
		}
		return <DefaultLogoIcon />;
	};

	// Hide store name text when a logo image is displayed (the image already contains the wordmark)
	const logoContent = (
		<span
			className="group/logo flex items-center gap-2 transition-all duration-200 hover:opacity-85"
			style={{ color: branding.colors.primary }}
		>
			{renderLogoImage()}
			{!hasLogoUrl && (
				<span className="hidden sm:inline text-lg font-bold tracking-tight">{store.name}</span>
			)}
		</span>
	);

	// Always link to channel homepage
	if (pathname === homeUrl) {
		return (
			<div className="flex items-center" aria-label="homepage">
				{logoContent}
			</div>
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
