"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type React from "react";

const STORAGE_PREFIX = "aura_recently_viewed_";
const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
	id: string;
	slug: string;
	name: string;
	thumbnail: string | null;
	thumbnailAlt: string | null;
	price: string;
	originalPrice: string | null;
	category: string | null;
	categorySlug: string | null;
	isAvailable: boolean;
	viewedAt: number;
	/** Numeric price for wishlist integration */
	priceAmount?: number;
	priceCurrency?: string;
	originalPriceAmount?: number;
	/** Brand name from product attributes */
	brand?: string;
	/** Total stock across all variants */
	totalStock?: number;
	/** Product rating (1-5) */
	rating?: number | null;
	/** Product creation date ISO string (for "New" badge) */
	created?: string;
}

interface RecentlyViewedContextValue {
	items: RecentlyViewedItem[];
	trackProduct: (product: Omit<RecentlyViewedItem, "viewedAt">) => void;
	removeItem: (id: string) => void;
	clearAll: () => void;
	channel: string;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

function getStorageKey(channel: string) {
	return `${STORAGE_PREFIX}${channel}`;
}

function loadItems(channel: string): RecentlyViewedItem[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(getStorageKey(channel));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed as RecentlyViewedItem[];
	} catch {
		return [];
	}
}

function saveItems(channel: string, items: RecentlyViewedItem[]) {
	try {
		localStorage.setItem(getStorageKey(channel), JSON.stringify(items));
	} catch {
		// localStorage full or unavailable — silently ignore
	}
}

export function RecentlyViewedProvider({ channel, children }: { channel: string; children: React.ReactNode }) {
	const [items, setItems] = useState<RecentlyViewedItem[]>([]);
	const channelRef = useRef(channel);

	// Reload items when channel changes
	useEffect(() => {
		channelRef.current = channel;
		setItems(loadItems(channel));
	}, [channel]);

	const trackProduct = useCallback((product: Omit<RecentlyViewedItem, "viewedAt">) => {
		setItems((prev) => {
			// Remove existing entry for this product
			const filtered = prev.filter((item) => item.id !== product.id);
			// Add to front with current timestamp
			const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
			saveItems(channelRef.current, updated);
			return updated;
		});
	}, []);

	const removeItem = useCallback((id: string) => {
		setItems((prev) => {
			const updated = prev.filter((item) => item.id !== id);
			saveItems(channelRef.current, updated);
			return updated;
		});
	}, []);

	const clearAll = useCallback(() => {
		setItems([]);
		try {
			localStorage.removeItem(getStorageKey(channelRef.current));
		} catch {
			// ignore
		}
	}, []);

	return (
		<RecentlyViewedContext.Provider value={{ items, trackProduct, removeItem, clearAll, channel }}>
			{children}
		</RecentlyViewedContext.Provider>
	);
}

export function useRecentlyViewed() {
	const ctx = useContext(RecentlyViewedContext);
	if (!ctx) {
		// Return a no-op fallback when provider is missing (e.g., SSR)
		return {
			items: [] as RecentlyViewedItem[],
			trackProduct: () => {},
			removeItem: () => {},
			clearAll: () => {},
			channel: "",
		};
	}
	return ctx;
}
