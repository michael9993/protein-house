"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { storeConfig } from "@/config";

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

export function ChannelPicker({ channels: initialChannels }: ChannelPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const params = useParams();
	const pathname = usePathname();
	const { branding } = storeConfig;
	
	// Get current channel from URL params
	const urlChannel = (params?.channel as string) || 
		pathname.split("/").find((part, index) => 
			index > 0 && part && part !== "api" && part !== "_next" && part !== "checkout"
		);

	const activeChannels = initialChannels.filter(ch => ch.isActive);
	
	// Find current channel by matching URL channel with channel slug
	// This handles cases where URL might have currency code but we need the actual slug
	const currentChannelData = activeChannels.find(ch => 
		ch.slug === urlChannel || ch.currencyCode.toLowerCase() === urlChannel?.toLowerCase()
	) || activeChannels[0]; // Fallback to first channel if not found
	
	const currentChannel = currentChannelData?.slug || urlChannel || activeChannels[0]?.slug || "default-channel";

	// Close dropdown when clicking outside
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

		// Save channel preference to cookie
		document.cookie = `saleor_channel_preference=${newChannelSlug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

		// Preserve current path but replace channel
		// Remove any existing channel from path
		const pathParts = pathname.split("/").filter(Boolean);
		const channelIndex = pathParts.findIndex((part, idx) => 
			idx === 0 && activeChannels.some(ch => 
				ch.slug === part || ch.currencyCode.toLowerCase() === part.toLowerCase()
			)
		);
		
		// Remove channel from path if found
		if (channelIndex >= 0) {
			pathParts.splice(channelIndex, 1);
		}
		
		const pathWithoutChannel = pathParts.length > 0 ? `/${pathParts.join("/")}` : "/";
		const newPath = `/${newChannelSlug}${pathWithoutChannel}`;
		
		router.push(newPath);
		setIsOpen(false);
	};

	if (activeChannels.length <= 1) {
		// Don't show picker if there's only one channel
		return null;
	}

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
				aria-label="Select channel/currency"
				aria-expanded={isOpen}
			>
				<span className="text-xs font-semibold">
					{currentChannelData?.currencyCode || "USD"}
				</span>
				<svg 
					className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none" 
					viewBox="0 0 24 24" 
					stroke="currentColor"
					strokeWidth={2}
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div 
					className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg"
					style={{ minWidth: "200px" }}
				>
					<div className="py-1">
						{activeChannels.map((channel) => {
							const isActive = channel.slug === currentChannel || channel.id === currentChannelData?.id;
							return (
								<button
									key={channel.id}
									onClick={() => handleChannelChange(channel.slug)}
									className={`w-full px-4 py-2 text-left text-sm transition-colors ${
										isActive
											? "bg-neutral-50 font-semibold"
											: "hover:bg-neutral-50"
									}`}
									style={{
										color: isActive ? branding.colors.primary : "inherit",
									}}
								>
									<div className="flex items-center justify-between">
										<span>{channel.name}</span>
										<span className="text-xs font-medium text-neutral-500">
											{channel.currencyCode}
										</span>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

