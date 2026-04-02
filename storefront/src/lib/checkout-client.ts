"use client";

/**
 * Client-side checkout utilities.
 * 
 * These functions handle checkout state that needs to be managed on the client,
 * particularly localStorage cleanup on logout for proper user isolation.
 */

/**
 * Storage keys used by the checkout system
 */
const CHECKOUT_STORAGE_KEYS = [
	"pendingCartCleanup",
	// Add any other checkout-related localStorage keys here
] as const;

/**
 * Clears all checkout-related data from localStorage.
 * Call this on logout to prevent data leakage between users.
 */
export function clearCheckoutLocalStorage() {
	if (typeof window === "undefined") return;
	
	for (const key of CHECKOUT_STORAGE_KEYS) {
		try {
			localStorage.removeItem(key);
		} catch (e) {
			console.warn(`[Checkout] Failed to clear localStorage key: ${key}`, e);
		}
	}
}

/**
 * Sets up an event listener for checkout:logout events.
 * When fired, clears all checkout-related localStorage data.
 * 
 * @returns Cleanup function to remove the event listener
 */
export function setupCheckoutLogoutListener(): () => void {
	if (typeof window === "undefined") return () => {};
	
	const handler = () => {
		clearCheckoutLocalStorage();
		console.debug("[Checkout] Cleared localStorage on logout");
	};
	
	window.addEventListener("checkout:logout", handler);
	
	return () => {
		window.removeEventListener("checkout:logout", handler);
	};
}

/**
 * Dispatches a checkout:logout event to clear client-side checkout data.
 * Call this when the user logs out.
 */
export function dispatchCheckoutLogout() {
	if (typeof window === "undefined") return;
	
	window.dispatchEvent(new CustomEvent("checkout:logout"));
}

