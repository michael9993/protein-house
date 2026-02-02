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
import { useState, useEffect, useRef } from "react";
import { alertsContainerProps } from "./hooks/useAlerts/consts";
import { RootViews } from "./views/RootViews";
import { PageNotFound } from "@/checkout/views/PageNotFound";
import { UserProvider } from "./hooks/UserContext";
import { CheckoutTextProvider, type CheckoutTextConfig } from "./hooks/useCheckoutText";
import { CheckoutIdProvider } from "./contexts/CheckoutIdContext";
import "./index.css";

interface RootProps {
	saleorApiUrl: string;
	checkoutText?: CheckoutTextConfig;
	checkoutId?: string;
}

export const Root = ({ saleorApiUrl, checkoutText, checkoutId }: RootProps) => {
	const saleorAuthClient = useSaleorAuthContext();
	const [_serverToken, setServerToken] = useState<string | null>(null);
	const serverTokenRef = useRef<string | null>(null);
	
	// Get access token from server on mount (server has access to httpOnly cookies)
	useEffect(() => {
		(async () => {
			try {
				const { getAccessToken } = await import("@/app/actions");
				const token = await getAccessToken();
				if (token) {
					setServerToken(token);
					serverTokenRef.current = token; // Keep ref in sync
					console.log("[Checkout URQL] ✅ Got access token from server");
				}
			} catch (error) {
				console.error("[Checkout URQL] ❌ Error getting token from server:", error);
			}
		})();
	}, []);

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
					const cookieString = document.cookie;
					console.log("[Checkout URQL] 🔍 All cookies:", cookieString);
					console.log("[Checkout URQL] 🔍 Looking for cookie:", accessTokenCookieName);
					
					// Parse cookies more carefully - handle cases where cookie name or value might contain special chars
					const cookies = cookieString.split(";");
					
					// Try both exact match and URL-encoded versions
					const searchNames = [
						accessTokenCookieName,
						encodeURIComponent(accessTokenCookieName),
						decodeURIComponent(accessTokenCookieName),
					];
					
					for (const cookie of cookies) {
						const trimmed = cookie.trim();
						if (!trimmed) continue;
						
						// Find the first = sign (cookie name ends at first =)
						const eqIndex = trimmed.indexOf("=");
						if (eqIndex === -1) continue;
						
						const name = trimmed.substring(0, eqIndex);
						const value = trimmed.substring(eqIndex + 1);
						
						// Try exact match
						if (searchNames.includes(name)) {
							try {
								accessToken = decodeURIComponent(value);
								console.log("[Checkout URQL] ✅ Found access token cookie (exact match), length:", accessToken.length);
								break;
							} catch {
								// If decode fails, use raw value
								accessToken = value;
								console.log("[Checkout URQL] ✅ Found access token cookie (raw value), length:", accessToken.length);
								break;
							}
						}
						
						// Try decoding the name
						try {
							const decodedName = decodeURIComponent(name);
							if (searchNames.includes(decodedName)) {
								try {
									accessToken = decodeURIComponent(value);
									console.log("[Checkout URQL] ✅ Found access token cookie (decoded name), length:", accessToken.length);
									break;
								} catch {
									accessToken = value;
									console.log("[Checkout URQL] ✅ Found access token cookie (decoded name, raw value), length:", accessToken.length);
									break;
								}
							}
						} catch {
							// Ignore decode errors
						}
						
						// Try encoding the name
						try {
							const encodedName = encodeURIComponent(name);
							if (searchNames.includes(encodedName)) {
								try {
							accessToken = decodeURIComponent(value);
									console.log("[Checkout URQL] ✅ Found access token cookie (encoded name), length:", accessToken.length);
									break;
								} catch {
									accessToken = value;
									console.log("[Checkout URQL] ✅ Found access token cookie (encoded name, raw value), length:", accessToken.length);
							break;
								}
							}
						} catch {
							// Ignore encode errors
						}
					}
					
					if (!accessToken) {
						console.warn("[Checkout URQL] ⚠️ Access token cookie not found in document.cookie");
						// Log all cookie names for debugging
						const allCookieNames = cookies
							.map(c => {
								const trimmed = c.trim();
								const eqIndex = trimmed.indexOf("=");
								return eqIndex === -1 ? trimmed : trimmed.substring(0, eqIndex);
							})
							.filter(Boolean);
						console.log("[Checkout URQL] 🔍 Available cookie names:", allCookieNames);
						console.log("[Checkout URQL] 🔍 Searched for:", searchNames);
					}
				}
				
				// Get current server token from ref (always up-to-date, even in closure)
				const currentServerToken = serverTokenRef.current;
				
				// Prepare fetch options
				// The SDK's fetchWithAuth will automatically:
				// 1. Read cookies from document.cookie (for cross-domain)
				// 2. Add Authorization header if access token is found
				// 3. Include credentials for same-domain cookies
				const fetchOptions: RequestInit = {
					...init,
					credentials: "include", // Include credentials for cookies
					headers: {
						...init?.headers,
						// Priority: server token > manually found token > SDK's fetchWithAuth
						// Server token is most reliable since it can read httpOnly cookies
						// Use ref to get current value (closure-safe)
						...(currentServerToken && {
							Authorization: `Bearer ${currentServerToken}`,
						}),
						// Fallback to manually found token if server token not available
						...(accessToken && !currentServerToken && {
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
				if (currentServerToken) {
					console.log("[Checkout URQL] 📤 Using server token (first 20 chars):", currentServerToken.substring(0, 20));
				} else if (accessToken) {
					console.log("[Checkout URQL] 📤 Using manually found token (first 20 chars):", accessToken.substring(0, 20));
				} else {
					console.log("[Checkout URQL] ℹ️ No access token found, relying on SDK's fetchWithAuth");
				}
				
				// Try to get token from SDK's session if available (for debugging)
				let sdkToken: string | null = null;
				try {
					// The SDK might have a way to get the current session/token
					// Check if there's a getSession or similar method
					if (typeof (saleorAuthClient as any).getSession === "function") {
						const session = await (saleorAuthClient as any).getSession();
						sdkToken = session?.token || null;
						if (sdkToken) {
							console.log("[Checkout URQL] ✅ SDK session token found, length:", sdkToken.length);
							// Add it to headers if SDK didn't already
							if (!fetchOptions.headers || !("Authorization" in (fetchOptions.headers as Record<string, unknown>))) {
								fetchOptions.headers = {
									...fetchOptions.headers,
									Authorization: `Bearer ${sdkToken}`,
								};
								console.log("[Checkout URQL] 📤 Added Authorization header from SDK session");
							}
						}
					}
				} catch (error) {
					// SDK might not have getSession method, that's OK
					console.log("[Checkout URQL] ℹ️ SDK getSession not available or failed:", error);
				}
				
				// Use the SDK's fetchWithAuth which handles cookie reading and Authorization header automatically
				// This is the primary method - our manual token reading is just a fallback
				const response = await saleorAuthClient.fetchWithAuth(input as NodeJS.fetch.RequestInfo, fetchOptions);
				
				// Log response details
				console.log("[Checkout URQL] 📥 Response status:", response.status);
				console.log("[Checkout URQL] 📥 Response headers:", Object.fromEntries(response.headers.entries()));
				
				// Check response for auth errors
				if (response.status === 200) {
					try {
						const clonedResponse = response.clone();
						const text = await clonedResponse.text();
						const json = JSON.parse(text) as any;
						if (json.errors?.some((e: any) => e.message?.includes("AUTHENTICATED_USER"))) {
							console.error("[Checkout URQL] ❌ Auth error in response:", json.errors);
							console.error("[Checkout URQL] 🔍 Debug info:", {
								hasServerToken: !!currentServerToken,
								hasManualToken: !!accessToken,
								hasSdkToken: !!sdkToken,
								hasAuthHeader: !!(fetchOptions.headers && "Authorization" in (fetchOptions.headers as Record<string, unknown>)),
								cookieString: typeof document !== "undefined" ? document.cookie.substring(0, 200) : "N/A",
							});
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
			<CheckoutIdProvider checkoutId={checkoutId}>
				<UserProvider>
					<CheckoutTextProvider config={checkoutText}>
						<ToastContainer {...alertsContainerProps} />
						<ErrorBoundary FallbackComponent={PageNotFound}>
							<RootViews />
						</ErrorBoundary>
					</CheckoutTextProvider>
				</UserProvider>
			</CheckoutIdProvider>
		</UrqlProvider>
	);
}
