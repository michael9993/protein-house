"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { getWishlist, saveWishlist } from "@/app/[channel]/(main)/account/wishlist/actions";

export interface WishlistItem {
	id: string;
	name: string;
	slug: string;
	price: number;
	originalPrice?: number;
	currency: string;
	image: string;
	imageAlt?: string;
	category?: string;
	inStock: boolean;
	addedAt: string;
	/** Channel slug where the product was added from */
	channel?: string;
	/** Product metadata (for shipping estimates etc.) */
	metadata?: Array<{ key: string; value: string }>;

}

interface WishlistContextType {
	items: WishlistItem[];
	addItem: (item: Omit<WishlistItem, "addedAt">) => Promise<void>;
	removeItem: (id: string) => Promise<void>;
	isInWishlist: (id: string) => boolean;
	clearWishlist: () => Promise<void>;
	itemCount: number;
	isLoading: boolean;
	channel: string;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_PREFIX = "aura_wishlist_";

// ---------------------------------------------------------------------------
// LocalStorage helpers (for anonymous users) — per-channel
// ---------------------------------------------------------------------------

function getStorageKey(channel: string) {
	return `${STORAGE_PREFIX}${channel}`;
}

function loadLocal(channel: string): WishlistItem[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(getStorageKey(channel));
		if (!raw) return [];
		const parsed = JSON.parse(raw) as WishlistItem[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function persistLocal(channel: string, items: WishlistItem[]) {
	try {
		if (items.length === 0) {
			localStorage.removeItem(getStorageKey(channel));
		} else {
			localStorage.setItem(getStorageKey(channel), JSON.stringify(items));
		}
	} catch {
		// localStorage full or unavailable
	}
}

// ---------------------------------------------------------------------------
// Auth detection (lightweight — reads cookie, no API call)
// ---------------------------------------------------------------------------

function isAuthenticated(): boolean {
	if (typeof document === "undefined") return false;
	const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
	const cookiePrefix = saleorApiUrl.replace(/\/$/, "");
	const cookieName = `${cookiePrefix}/+saleor_auth_module_auth_state`;
	return document.cookie.includes(`${cookieName}=signedIn`);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WishlistProvider({ channel, children }: { channel: string; children: ReactNode }) {
	const [items, setItems] = useState<WishlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const itemsRef = useRef(items);
	itemsRef.current = items;
	const channelRef = useRef(channel);
	const authRef = useRef(false);
	const loadedRef = useRef(false);

	// Reload items when channel changes
	useEffect(() => {
		channelRef.current = channel;
		let cancelled = false;

		async function init() {
			setIsLoading(true);
			const authed = isAuthenticated();
			authRef.current = authed;

			if (!authed) {
				// Anonymous: load from localStorage (instant)
				if (!cancelled) {
					setItems(loadLocal(channel));
					setIsLoading(false);
					loadedRef.current = true;
				}
				return;
			}

			// Authenticated: load from backend
			try {
				const backendItems = await getWishlist();
				if (cancelled) return;

				if (backendItems === null) {
					// Token expired / not authed after all — fall back to local
					authRef.current = false;
					setItems(loadLocal(channel));
				} else {
					// Merge: if there are localStorage items, push them to backend
					const localItems = loadLocal(channel);
					if (localItems.length > 0) {
						const backendIds = new Set(backendItems.map((i: WishlistItem) => i.id));
						const newItems = localItems.filter((i: WishlistItem) => !backendIds.has(i.id));
						if (newItems.length > 0) {
							const merged = [...backendItems, ...newItems];
							setItems(merged);
							// Fire-and-forget save (don't block UI)
							saveWishlist(merged).then(() => {
								persistLocal(channel, []);
							});
						} else {
							setItems(backendItems);
							persistLocal(channel, []);
						}
					} else {
						setItems(backendItems);
					}
				}
			} catch {
				// Network error — fall back to local
				authRef.current = false;
				if (!cancelled) setItems(loadLocal(channel));
			}

			if (!cancelled) {
				setIsLoading(false);
				loadedRef.current = true;
			}
		}

		init();
		return () => { cancelled = true; };
	}, [channel]);

	// ------ Auth state change detection (login/logout) ------
	useEffect(() => {
		const handleLogin = () => {
			authRef.current = true;
			const ch = channelRef.current;
			// Reload from backend after login
			getWishlist().then((backendItems) => {
				if (backendItems === null) return;
				// Merge local → backend
				const localItems = itemsRef.current;
				if (localItems.length > 0) {
					const backendIds = new Set(backendItems.map((i: WishlistItem) => i.id));
					const newItems = localItems.filter((i: WishlistItem) => !backendIds.has(i.id));
					const merged = newItems.length > 0 ? [...backendItems, ...newItems] : backendItems;
					setItems(merged);
					if (newItems.length > 0) {
						saveWishlist(merged).then(() => persistLocal(ch, []));
					} else {
						persistLocal(ch, []);
					}
				} else {
					setItems(backendItems);
				}
			});
		};

		const handleLogout = () => {
			authRef.current = false;
			setItems([]);
			persistLocal(channelRef.current, []);
		};

		window.addEventListener("wishlist:login", handleLogin);
		window.addEventListener("wishlist:logout", handleLogout);
		return () => {
			window.removeEventListener("wishlist:login", handleLogin);
			window.removeEventListener("wishlist:logout", handleLogout);
		};
	}, []);

	// ------ Stable callbacks (no `items` dependency — use ref) ------

	const addItem = useCallback(async (item: Omit<WishlistItem, "addedAt">) => {
		const current = itemsRef.current;
		if (current.some((i) => i.id === item.id)) return;

		const newItem: WishlistItem = { ...item, addedAt: new Date().toISOString() };
		const updated = [...current, newItem];

		// Optimistic update
		setItems(updated);

		if (authRef.current) {
			// Authenticated: save to backend
			const result = await saveWishlist(updated);
			if (!result.success) {
				// Revert
				setItems(current);
			}
		} else {
			// Anonymous: persist to localStorage
			persistLocal(channelRef.current, updated);
		}
	}, []);

	const removeItem = useCallback(async (id: string) => {
		const current = itemsRef.current;
		const updated = current.filter((i) => i.id !== id);

		// Optimistic update
		setItems(updated);

		if (authRef.current) {
			const result = await saveWishlist(updated);
			if (!result.success) {
				setItems(current);
			}
		} else {
			persistLocal(channelRef.current, updated);
		}
	}, []);

	const clearWishlist = useCallback(async () => {
		const current = itemsRef.current;

		// Optimistic
		setItems([]);

		if (authRef.current) {
			const result = await saveWishlist([]);
			if (!result.success) {
				setItems(current);
			}
		} else {
			persistLocal(channelRef.current, []);
		}
	}, []);

	const isInWishlist = useCallback((id: string) => {
		return itemsRef.current.some((item: WishlistItem) => item.id === id);
	}, []);

	// Memoize context value — only changes when items array identity changes
	const value = useMemo<WishlistContextType>(() => ({
		items,
		addItem,
		removeItem,
		isInWishlist,
		clearWishlist,
		itemCount: items.length,
		isLoading,
		channel,
	}), [items, isLoading, channel, addItem, removeItem, isInWishlist, clearWishlist]);

	return (
		<WishlistContext.Provider value={value}>
			{children}
		</WishlistContext.Provider>
	);
}

export function useWishlist() {
	const context = useContext(WishlistContext);
	if (!context) {
		throw new Error("useWishlist must be used within a WishlistProvider");
	}
	return context;
}
