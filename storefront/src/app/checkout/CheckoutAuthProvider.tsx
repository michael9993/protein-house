"use client";

import { type ReactNode } from "react";
// Import the same auth client instance used by the main storefront
import { saleorAuthClient } from "@/ui/components/AuthProvider";
import { SaleorAuthProvider } from "@saleor/auth-sdk/react";
import { UserProvider } from "@/checkout/hooks/UserContext";

/**
 * Client component wrapper for SaleorAuthProvider + UserProvider in checkout.
 * Uses the same auth client instance as the main storefront to ensure
 * cookies are shared and auth state is consistent.
 * UserProvider is required by checkout-v2 ContactStep (useUser hook).
 */
export function CheckoutAuthProvider({ children }: { children: ReactNode }) {
	return (
		<SaleorAuthProvider client={saleorAuthClient}>
			<UserProvider>
				{children}
			</UserProvider>
		</SaleorAuthProvider>
	);
}

