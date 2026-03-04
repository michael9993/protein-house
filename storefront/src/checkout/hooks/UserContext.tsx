"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useAuthChange } from "@saleor/auth-sdk/react";
import { getCurrentUser } from "@/app/actions";

interface UserContextType {
	user: any;
	loading: boolean;
	authenticated: boolean;
	reload: (force?: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

/**
 * Shared user context provider for checkout.
 * Ensures user is only loaded once globally, not per component.
 */
export function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [authenticated, setAuthenticated] = useState(false);
	const isLoadingRef = useRef(false);
	const hasLoadedRef = useRef(false);
	
	// Load user using Server Action (like wishlist does)
	// force=true bypasses the concurrency guard (used after cookie sync)
	const loadUser = useCallback(async (force?: boolean) => {
		// Prevent concurrent loads (unless forced — e.g. after auth cookie sync)
		if (isLoadingRef.current && !force) {
			return;
		}

		try {
			isLoadingRef.current = true;
			setLoading(true);
			const currentUser = await getCurrentUser();
			setUser(currentUser);
			setAuthenticated(!!currentUser?.id);
			hasLoadedRef.current = true;
		} catch (error) {
			console.error("[UserProvider] ❌ Error loading user:", error);
			setUser(null);
			setAuthenticated(false);
			hasLoadedRef.current = true;
		} finally {
			setLoading(false);
			isLoadingRef.current = false;
		}
	}, []);

	// Load user on mount (only once)
	useEffect(() => {
		if (!hasLoadedRef.current && !isLoadingRef.current) {
			loadUser();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty deps - only run on mount

	// Refetch user data when auth state changes (login/logout)
	const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || process.env.SALEOR_API_URL || "";
	useAuthChange({
		saleorApiUrl,
		onSignedIn: () => {
			hasLoadedRef.current = false;
			loadUser();
		},
		onSignedOut: () => {
			setUser(null);
			setAuthenticated(false);
			setLoading(false);
			hasLoadedRef.current = false;
		},
	});

	return (
		<UserContext.Provider value={{ user, loading, authenticated, reload: loadUser }}>
			{children}
		</UserContext.Provider>
	);
}

/**
 * Hook to access user state from context.
 * This ensures all components share the same user state.
 */
export function useUser() {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error("useUser must be used within UserProvider");
	}
	return context;
}

