"use client";

import { type ReactNode } from "react";
// Import the same auth client instance used by the main storefront
import { saleorAuthClient } from "@/ui/components/AuthProvider";
import { SaleorAuthProvider } from "@saleor/auth-sdk/react";

/**
 * Client component wrapper for SaleorAuthProvider in checkout.
 * Uses the same auth client instance as the main storefront to ensure
 * cookies are shared and auth state is consistent.
 */
export function CheckoutAuthProvider({ children }: { children: ReactNode }) {
	return (
		<SaleorAuthProvider client={saleorAuthClient}>
			{children}
		</SaleorAuthProvider>
	);
}

