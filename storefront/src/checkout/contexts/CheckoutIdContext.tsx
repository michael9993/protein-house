"use client";

import { createContext, useContext, type ReactNode } from "react";

const CheckoutIdContext = createContext<string | undefined>(undefined);

export function CheckoutIdProvider({
	children,
	checkoutId,
}: {
	children: ReactNode;
	checkoutId?: string | null;
}) {
	return (
		<CheckoutIdContext.Provider value={checkoutId ?? undefined}>
			{children}
		</CheckoutIdContext.Provider>
	);
}

export function useCheckoutIdFromServer(): string | undefined {
	return useContext(CheckoutIdContext);
}
