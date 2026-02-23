"use client";
import { ErrorBoundary } from "react-error-boundary";
import {
	type Client,
	Provider as UrqlProvider,
	cacheExchange,
	createClient,
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
					serverTokenRef.current = token;
				}
			} catch {
				// Server token unavailable — SDK fetchWithAuth handles auth as fallback
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
			suspense: false,
			requestPolicy: "cache-and-network",
			fetch: async (input, init) => {
				// For cross-domain setups (Cloudflare tunnels), manually extract
				// the access token from cookies and add it as Authorization header
				const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
				const cookiePrefix = saleorApiUrl.replace(/\/$/, "");
				const accessTokenCookieName = `${cookiePrefix}/+saleor_auth_access_token`;

				let accessToken: string | null = null;
				if (typeof document !== "undefined") {
					const cookies = document.cookie.split(";");
					const searchNames = [
						accessTokenCookieName,
						encodeURIComponent(accessTokenCookieName),
						decodeURIComponent(accessTokenCookieName),
					];

					for (const cookie of cookies) {
						const trimmed = cookie.trim();
						if (!trimmed) continue;
						const eqIndex = trimmed.indexOf("=");
						if (eqIndex === -1) continue;
						const name = trimmed.substring(0, eqIndex);
						const value = trimmed.substring(eqIndex + 1);

						if (searchNames.includes(name)) {
							try { accessToken = decodeURIComponent(value); } catch { accessToken = value; }
							break;
						}
						try {
							if (searchNames.includes(decodeURIComponent(name))) {
								try { accessToken = decodeURIComponent(value); } catch { accessToken = value; }
								break;
							}
						} catch { /* ignore */ }
					}
				}

				const currentServerToken = serverTokenRef.current;

				const fetchOptions: RequestInit = {
					...init,
					credentials: "include",
					headers: {
						...init?.headers,
						...(currentServerToken && { Authorization: `Bearer ${currentServerToken}` }),
						...(accessToken && !currentServerToken && { Authorization: `Bearer ${accessToken}` }),
					},
				};

				return saleorAuthClient.fetchWithAuth(input as RequestInfo, fetchOptions);
			},
			exchanges: [cacheExchange, fetchExchange],
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
