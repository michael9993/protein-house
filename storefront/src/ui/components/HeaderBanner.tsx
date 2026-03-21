"use client";

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { useBranding, useHeaderConfig, useStoreConfig, useEcommerceSettings, useNavbarText, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { interpolateConfigText, buildConfigVars } from "@/lib/interpolate-config";

const DEFAULT_INTERVAL_SECONDS = 6;
const DISMISS_STORAGE_PREFIX = "banner-dismissed-";

type BannerItem = {
	id: string;
	name: string;
	description?: string | null;
	displayText?: string | null;
	link?: string | null;
	icon?: string | null;
};

/**
 * Client component for the promotional banner at the top of the header.
 * Supports multiple rotating items (from Saleor promotions/vouchers or manual) with auto-scroll,
 * gradient background, dismissible (localStorage), icons/emojis, and description-first text.
 */
export function HeaderBanner({ channel }: { channel?: string }) {
	const branding = useBranding();
	const headerConfig = useHeaderConfig();
	const config = useStoreConfig();
	const ecommerce = useEcommerceSettings();
	const navbarText = useNavbarText();
	const configVars = buildConfigVars(ecommerce);
	const cdStyle = useComponentStyle("layout.headerBanner");
	const cdClasses = useComponentClasses("layout.headerBanner");

	const showBanner = headerConfig.banner.enabled;
	const items = (headerConfig.banner.items ?? []) as BannerItem[];
	const singleText = headerConfig.banner.text;
	const intervalSeconds = headerConfig.banner.autoScrollIntervalSeconds ?? DEFAULT_INTERVAL_SECONDS;
	const bannerBgColor = headerConfig.banner.backgroundColor || branding.colors.primary;
	const bannerTextColor = headerConfig.banner.textColor ?? "#FFFFFF";
	const useGradient = headerConfig.banner.useGradient ?? false;
	const gradientStops = (headerConfig.banner.gradientStops ?? []) as Array<{ color: string; position: number }>;
	const gradientAngle = (headerConfig.banner.gradientAngle ?? 90) as number;
	const gradientFrom = headerConfig.banner.gradientFrom ?? bannerBgColor;
	const gradientTo = headerConfig.banner.gradientTo ?? bannerBgColor;
	const dismissible = headerConfig.banner.dismissible ?? false;

	const dismissKey = channel ? `${DISMISS_STORAGE_PREFIX}${channel}` : DISMISS_STORAGE_PREFIX + "default";
	const [userDismissed, setUserDismissed] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setMounted(true);
		const stored = window.localStorage.getItem(dismissKey);
		setUserDismissed(stored === "1");
	}, [dismissKey]);

	const handleDismiss = useCallback(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(dismissKey, "1");
		setUserDismissed(true);
	}, [dismissKey]);

	const [activeIndex, setActiveIndex] = useState(0);
	const [paused, setPaused] = useState(false);

	const features = config.features;
	const promotionalBannersEnabled = features?.promotionalBanners !== false;

	if (!promotionalBannersEnabled || !showBanner || (mounted && dismissible && userDismissed)) {
		return null;
	}

	const backgroundStyle: React.CSSProperties = (() => {
		if (!useGradient) {
			return { backgroundColor: bannerBgColor, color: bannerTextColor };
		}
		// Multi-stop gradient (new)
		if (gradientStops && gradientStops.length >= 2) {
			const sorted = [...gradientStops].sort((a, b) => a.position - b.position);
			const css = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
			return { background: `linear-gradient(${gradientAngle}deg, ${css})`, color: bannerTextColor };
		}
		// Legacy two-color fallback
		if (gradientFrom || gradientTo) {
			return { background: `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`, color: bannerTextColor };
		}
		return { backgroundColor: bannerBgColor, color: bannerTextColor };
	})();

	// Multiple items: carousel with auto-scroll
	if (items.length > 0) {
		return (
			<HeaderBannerCarousel
				items={items}
				activeIndex={activeIndex}
				setActiveIndex={setActiveIndex}
				paused={paused}
				setPaused={setPaused}
				intervalSeconds={intervalSeconds}
				backgroundStyle={backgroundStyle}
				dismissible={dismissible}
				onDismiss={handleDismiss}
				dismissAriaLabel={navbarText.bannerDismissAriaLabel || "Dismiss banner"}
				prevAriaLabel={navbarText.bannerPrevAriaLabel || "Previous banner"}
				nextAriaLabel={navbarText.bannerNextAriaLabel || "Next banner"}
				configVars={configVars}
			/>
		);
	}

	// Single text banner (backward compatibility) – thin, 1.5px less height, text-sm
	if (singleText) {
		return (
			<div
				className="relative w-full py-1.5 text-center text-sm font-medium min-h-[calc(2rem-1.5px)]"
				style={backgroundStyle}
			>
				<div className="mx-auto flex max-w-7xl min-h-[calc(2rem-1.5px)] items-center justify-center gap-2 px-4">
					<span>{interpolateConfigText(singleText, configVars)}</span>
				</div>
				{dismissible && (
					<button
						type="button"
						onClick={handleDismiss}
						className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
						style={{ color: "inherit" }}
						aria-label={navbarText.bannerDismissAriaLabel || "Dismiss banner"}
					>
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>
		);
	}

	return null;
}

interface HeaderBannerCarouselProps {
	items: BannerItem[];
	activeIndex: number;
	setActiveIndex: Dispatch<SetStateAction<number>>;
	paused: boolean;
	setPaused: (p: boolean) => void;
	intervalSeconds: number;
	backgroundStyle: React.CSSProperties;
	dismissible: boolean;
	onDismiss: () => void;
	dismissAriaLabel: string;
	prevAriaLabel: string;
	nextAriaLabel: string;
	configVars: Record<string, string>;
}

function HeaderBannerCarousel({
	items,
	activeIndex,
	setActiveIndex,
	paused,
	setPaused,
	intervalSeconds,
	backgroundStyle,
	dismissible,
	onDismiss,
	dismissAriaLabel,
	prevAriaLabel,
	nextAriaLabel,
	configVars,
}: HeaderBannerCarouselProps) {
	const cdStyle = useComponentStyle("layout.headerBanner");
	const cdClasses = useComponentClasses("layout.headerBanner");
	const len = items.length;

	const advance = useCallback(() => {
		if (len <= 1) return;
		setActiveIndex((i) => (i + 1) % len);
	}, [len]);

	useEffect(() => {
		if (len <= 1 || paused) return;
		const id = setInterval(advance, intervalSeconds * 1000);
		return () => clearInterval(id);
	}, [len, paused, intervalSeconds, advance]);

	const current = items[activeIndex];
	if (!current) return null;

	// Promotions: displayText = description. Vouchers: displayText = name. Manual: name only.
	const rawText =
		current.displayText?.trim() ||
		(current.description && current.description.trim()) ||
		current.name;
	const mainText = interpolateConfigText(rawText, configVars);

	const content = (
		<>
			{current.icon && (
				<span className="flex-shrink-0" aria-hidden>
					{current.icon}
				</span>
			)}
			<span className="font-medium">{mainText}</span>
		</>
	);

	const goPrev = useCallback(() => {
		if (len <= 1) return;
		setActiveIndex((i) => (i - 1 + len) % len);
	}, [len]);

	const goNext = useCallback(() => {
		if (len <= 1) return;
		setActiveIndex((i) => (i + 1) % len);
	}, [len]);

	// Thin banner: py-1.5, single line. Text slightly larger (text-sm). Arrows only (no dots).
	const wrapperClass =
		"mx-auto flex max-w-7xl min-h-[2rem] items-center justify-center gap-2 px-4 text-sm transition-opacity duration-300";

	return (
		<div
			data-cd="layout-headerBanner"
			className={`relative w-full py-1.5 text-center font-medium ${cdClasses}`}
			style={{
				...backgroundStyle,
				...buildComponentStyle("layout.headerBanner", cdStyle),
			}}
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
		>
			{len > 1 && (
				<button
					type="button"
					onClick={goPrev}
					className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
					style={{ color: "inherit" }}
					aria-label={prevAriaLabel}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			)}
			<div className={wrapperClass}>
				{current.link ? (
					<BannerLink href={current.link} className="flex items-center justify-center gap-2">
						{content}
					</BannerLink>
				) : (
					content
				)}
			</div>
			{len > 1 && (
				<button
					type="button"
					onClick={goNext}
					className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 ${dismissible ? "right-10" : "right-2"}`}
					style={{ color: "inherit" }}
					aria-label={nextAriaLabel}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			)}
			{dismissible && (
				<button
					type="button"
					onClick={onDismiss}
					className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
					style={{ color: "inherit" }}
					aria-label={dismissAriaLabel}
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			)}
		</div>
	);
}

function BannerLink({
	href,
	className,
	children,
}: {
	href: string;
	className: string;
	children: React.ReactNode;
}) {
	const isExternal =
		href.startsWith("http://") ||
		href.startsWith("https://") ||
		href.startsWith("//");

	if (isExternal) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={`underline underline-offset-2 hover:opacity-90 ${className}`}
				style={{ color: "inherit" }}
			>
				{children}
			</a>
		);
	}

	return (
		<Link href={href} className={`underline underline-offset-2 hover:opacity-90 ${className}`} style={{ color: "inherit" }}>
			{children}
		</Link>
	);
}
