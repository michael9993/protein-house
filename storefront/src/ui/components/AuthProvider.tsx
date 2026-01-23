"use client";

import { SaleorAuthProvider, useAuthChange } from "@saleor/auth-sdk/react";
import { invariant } from "ts-invariant";
import { createSaleorAuthClient } from "@saleor/auth-sdk";
import { useState, useEffect, type ReactNode } from "react";
import {
	type Client,
	Provider as UrqlProvider,
	cacheExchange,
	createClient,
	dedupExchange,
	fetchExchange,
} from "urql";
import { setupCheckoutLogoutListener, clearCheckoutLocalStorage } from "@/lib/checkout-client";

const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
invariant(saleorApiUrl, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

export const saleorAuthClient = createSaleorAuthClient({
	saleorApiUrl,
});

const makeUrqlClient = () => {
	return createClient({
		url: saleorApiUrl,
		suspense: true,
		// requestPolicy: "cache-first",
		fetch: (input, init) => saleorAuthClient.fetchWithAuth(input as NodeJS.fetch.RequestInfo, init),
		exchanges: [dedupExchange, cacheExchange, fetchExchange],
	});
};

export function AuthProvider({ children }: { children: ReactNode }) {
	invariant(saleorApiUrl, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	const [urqlClient, setUrqlClient] = useState<Client>(() => makeUrqlClient());
	
	useAuthChange({
		saleorApiUrl,
		onSignedOut: () => {
			// Reset URQL client to clear cache
			setUrqlClient(makeUrqlClient());
			// Clear checkout localStorage data
			clearCheckoutLocalStorage();
			// Clear newsletter subscription status from localStorage
			if (typeof window !== "undefined") {
				try {
					localStorage.removeItem("newsletter_subscribed");
					console.log("[AuthProvider] Cleared newsletter subscription on logout");
				} catch {
					// Ignore storage errors
				}
			}
		},
		onSignedIn: () => {
			// Reset URQL client to use new auth context
			setUrqlClient(makeUrqlClient());
		},
	});

	// Set up listener for checkout:logout events
	useEffect(() => {
		return setupCheckoutLogoutListener();
	}, []);

	return (
		<SaleorAuthProvider client={saleorAuthClient}>
			<UrqlProvider value={urqlClient}>{children}</UrqlProvider>
		</SaleorAuthProvider>
	);
}
