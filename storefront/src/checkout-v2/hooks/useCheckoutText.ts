"use client";

// Re-export from the shared source so both checkout/ and checkout-v2/ share the same defaults.
// Phase 0: thin re-export. When checkout/ is removed, move the implementation here.
export {
	useCheckoutText,
	CheckoutTextProvider,
	formatText,
	type CheckoutTextConfig,
} from "@/checkout/hooks/useCheckoutText";
