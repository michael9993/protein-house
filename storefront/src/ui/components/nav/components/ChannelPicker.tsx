"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useBranding } from "@/providers/StoreConfigProvider";

interface Channel {
	id: string;
	name: string;
	slug: string;
	currencyCode: string;
	isActive: boolean;
}

interface ChannelPickerProps {
	channels: Channel[];
}

/** Map currency codes to their symbols */
const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: "$",
	ILS: "₪",
	EUR: "€",
	GBP: "£",
	JPY: "¥",
	CAD: "C$",
	AUD: "A$",
	CHF: "Fr",
	CNY: "¥",
	INR: "₹",
	KRW: "₩",
	TRY: "₺",
	BRL: "R$",
	MXN: "$",
	SEK: "kr",
	NOK: "kr",
	DKK: "kr",
	PLN: "zł",
	CZK: "Kč",
	HUF: "Ft",
	RUB: "₽",
	AED: "د.إ",
	SAR: "﷼",
	EGP: "E£",
};

/** Map channel slugs to language info */
const CHANNEL_LOCALE_INFO: Record<string, { lang: string; flag: string }> = {
	ils: { lang: "עב", flag: "🇮🇱" },
	usd: { lang: "EN", flag: "🇺🇸" },
	eur: { lang: "EN", flag: "🇪🇺" },
	gbp: { lang: "EN", flag: "🇬🇧" },
};

function getChannelLocaleInfo(slug: string, currencyCode: string) {
	const info = CHANNEL_LOCALE_INFO[slug.toLowerCase()];
	if (info) return info;
	const fallbackInfo = CHANNEL_LOCALE_INFO[currencyCode.toLowerCase()];
	if (fallbackInfo) return fallbackInfo;
	return { lang: currencyCode.slice(0, 2), flag: "🌐" };
}

export function ChannelPicker({ channels: initialChannels }: ChannelPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const params = useParams();
	const pathname = usePathname();
	const branding = useBranding();

	// Get current channel from URL params
	const urlChannel = (params?.channel as string) ||
		pathname.split("/").find((part, index) =>
			index > 0 && part && part !== "api" && part !== "_next" && part !== "checkout"
		);

	const activeChannels = initialChannels.filter(ch => ch.isActive);

	const currentChannelData = activeChannels.find(ch =>
		ch.slug === urlChannel || ch.currencyCode.toLowerCase() === urlChannel?.toLowerCase()
	) || activeChannels[0];

	const currentChannel = currentChannelData?.slug || urlChannel || activeChannels[0]?.slug || "default-channel";

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleChannelChange = (newChannelSlug: string) => {
		if (newChannelSlug === currentChannel) {
			setIsOpen(false);
			return;
		}

		document.cookie = `saleor_channel_preference=${newChannelSlug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

		const pathParts = pathname.split("/").filter(Boolean);
		const channelIndex = pathParts.findIndex((part, idx) =>
			idx === 0 && activeChannels.some(ch =>
				ch.slug === part || ch.currencyCode.toLowerCase() === part.toLowerCase()
			)
		);

		if (channelIndex >= 0) {
			pathParts.splice(channelIndex, 1);
		}

		const pathWithoutChannel = pathParts.length > 0 ? `/${pathParts.join("/")}` : "/";
		const newPath = `/${newChannelSlug}${pathWithoutChannel}`;

		router.push(newPath);
		setIsOpen(false);
	};

	if (activeChannels.length <= 1) {
		return null;
	}

	const currentLocale = getChannelLocaleInfo(currentChannel, currentChannelData?.currencyCode || "USD");
	const currencySymbol = CURRENCY_SYMBOLS[currentChannelData?.currencyCode || "USD"] || currentChannelData?.currencyCode || "$";

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="nav-action-btn flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900"
				aria-label="Select language and currency"
				aria-expanded={isOpen}
			>
				{/* Globe icon */}
				<svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
				</svg>
				<span className="text-xs font-semibold tracking-wide">
					{currentLocale.lang}
				</span>
				<span className="text-neutral-300 text-xs">|</span>
				<span className="text-xs font-bold" style={{ color: branding.colors.primary }}>
					{currencySymbol}
				</span>
				<svg
					className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2.5}
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div
					className="absolute end-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-neutral-200 bg-white shadow-xl animate-fade-in"
				>
					<div className="p-1.5">
						{activeChannels.map((channel) => {
							const isActive = channel.slug === currentChannel || channel.id === currentChannelData?.id;
							const locale = getChannelLocaleInfo(channel.slug, channel.currencyCode);
							const symbol = CURRENCY_SYMBOLS[channel.currencyCode] || channel.currencyCode;
							return (
								<button
									key={channel.id}
									onClick={() => handleChannelChange(channel.slug)}
									className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-all duration-150 ${
										isActive
											? "bg-neutral-50 font-semibold"
											: "hover:bg-neutral-50"
									}`}
									style={{
										color: isActive ? branding.colors.primary : undefined,
									}}
								>
									<span className="text-base">{locale.flag}</span>
									<div className="flex flex-col items-start flex-1 min-w-0">
										<span className="truncate font-medium">{channel.name}</span>
										<span className="text-[11px] text-neutral-400 font-normal">{locale.lang} · {channel.currencyCode}</span>
									</div>
									<span className="text-sm font-bold text-neutral-600" style={isActive ? { color: branding.colors.primary } : undefined}>
										{symbol}
									</span>
									{isActive && (
										<svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: branding.colors.primary }}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
										</svg>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
