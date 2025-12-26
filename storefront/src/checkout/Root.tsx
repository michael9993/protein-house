"use client";
import { ErrorBoundary } from "react-error-boundary";
import {
	type Client,
	Provider as UrqlProvider,
	cacheExchange,
	createClient,
	dedupExchange,
	fetchExchange,
} from "urql";

import { ToastContainer } from "react-toastify";
import { useAuthChange, useSaleorAuthContext } from "@saleor/auth-sdk/react";
import { useState } from "react";
import { alertsContainerProps } from "./hooks/useAlerts/consts";
import { RootViews } from "./views/RootViews";
import { PageNotFound } from "@/checkout/views/PageNotFound";
import { UserProvider } from "./hooks/UserContext";
import "./index.css";

export const Root = ({ saleorApiUrl }: { saleorApiUrl: string }) => {
	const saleorAuthClient = useSaleorAuthContext();

	// Suppress Stripe "Frame not initialized" errors - these are non-critical
	// and happen during PaymentElement initialization when canMakePayment is called
	if (typeof window !== "undefined") {
		// Suppress unhandled promise rejections for Stripe frame errors
		window.addEventListener("unhandledrejection", (event) => {
			const error = event.reason;
			if (
				error?.message?.includes("Frame not initialized") ||
				error?.message?.includes("frame") ||
				(error?.toString && error.toString().includes("Frame not initialized"))
			) {
				// Suppress this non-critical error
				event.preventDefault();
				console.debug("[Stripe] Suppressed frame initialization error (non-critical):", error);
			}
		});
	}

	const makeUrqlClient = () => {
		// Use the exact same pattern as the main storefront AuthProvider
		// The auth client handles cookies automatically via fetchWithAuth
		return createClient({
			url: saleorApiUrl,
			suspense: true,
			requestPolicy: "cache-first",
			fetch: async (input, init) => {
				// For cross-domain setups (Cloudflare tunnels), we need to manually extract
				// the access token from cookies and add it as Authorization header
				// because cookies set for one subdomain won't be sent to another subdomain
				
				const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
				const cookiePrefix = saleorApiUrl.replace(/\/$/, "");
				const accessTokenCookieName = `${cookiePrefix}/+saleor_auth_access_token`;
				
				// Try to read access token from document.cookie (it's non-httpOnly for cross-domain support)
				let accessToken: string | null = null;
				if (typeof document !== "undefined") {
					const cookies = document.cookie.split(";");
					console.log("[Checkout URQL] 🔍 All cookies:", document.cookie);
					console.log("[Checkout URQL] 🔍 Looking for cookie:", accessTokenCookieName);
					for (const cookie of cookies) {
						const [name, value] = cookie.trim().split("=");
						if (name === accessTokenCookieName) {
							accessToken = decodeURIComponent(value);
							console.log("[Checkout URQL] ✅ Found access token cookie, length:", accessToken.length);
							break;
						}
					}
					if (!accessToken) {
						console.warn("[Checkout URQL] ⚠️ Access token cookie not found in document.cookie");
					}
				}
				
				// Prepare fetch options
				const fetchOptions: RequestInit = {
					...init,
					credentials: "include", // Still include credentials for cookies that might be sent
					headers: {
						...init?.headers,
						// If we found an access token, add it as Authorization header
						// This is necessary for cross-domain requests where cookies aren't sent
						...(accessToken && {
							Authorization: `Bearer ${accessToken}`,
						}),
					},
				};
				
				// Log request details
				const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
				console.log("[Checkout URQL] 📤 Making request to:", url);
				console.log("[Checkout URQL] 📤 Request method:", init?.method || "POST");
				console.log("[Checkout URQL] 📤 Request headers:", {
					...Object.fromEntries(
						Object.entries(fetchOptions.headers || {}).map(([k, v]) => [
							k,
							k === "Authorization" ? (typeof v === "string" ? `${v.substring(0, 20)}...` : v) : v,
						])
					),
				});
				console.log("[Checkout URQL] 📤 Has Authorization header:", !!fetchOptions.headers && "Authorization" in fetchOptions.headers);
				if (accessToken) {
					console.log("[Checkout URQL] 📤 Access token (first 20 chars):", accessToken.substring(0, 20));
				}
				
				// Use the SDK's fetchWithAuth which will also try to add auth from cookies
				// But our manual Authorization header takes precedence
				const response = await saleorAuthClient.fetchWithAuth(input as NodeJS.fetch.RequestInfo, fetchOptions);
				
				// Log response details
				console.log("[Checkout URQL] 📥 Response status:", response.status);
				console.log("[Checkout URQL] 📥 Response headers:", Object.fromEntries(response.headers.entries()));
				
				// Check response for auth errors
				if (response.status === 200) {
					try {
						const clonedResponse = response.clone();
						const text = await clonedResponse.text();
						const json = JSON.parse(text);
						if (json.errors?.some((e: any) => e.message?.includes("AUTHENTICATED_USER"))) {
							console.error("[Checkout URQL] ❌ Auth error in response:", json.errors);
						} else {
							console.log("[Checkout URQL] ✅ Request successful");
						}
					} catch {
						// Ignore parsing errors
					}
				}
				
				return response;
			},
			exchanges: [dedupExchange, cacheExchange, fetchExchange],
		});
	};

	const [urqlClient, setUrqlClient] = useState<Client>(makeUrqlClient());

	useAuthChange({
		saleorApiUrl,
		onSignedOut: () => {
			setUrqlClient(makeUrqlClient());
		},
		onSignedIn: () => {
			setUrqlClient(makeUrqlClient());
		},
	});

	return (
		<UrqlProvider value={urqlClient}>
			<UserProvider>
				<ToastContainer {...alertsContainerProps} />
				<ErrorBoundary FallbackComponent={PageNotFound}>
					<RootViews />
				</ErrorBoundary>
			</UserProvider>
		</UrqlProvider>
	);
}
