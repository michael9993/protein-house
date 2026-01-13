import { useEffect, useState, useCallback } from "react";
import { useCheckoutLineDeleteMutation } from "@/checkout/graphql";

interface PendingCartCleanup {
	originalCartId: string;
	lineIds: string[];
	partialCheckoutId: string;
	timestamp: number;
}

const CLEANUP_STORAGE_KEY = "pendingCartCleanup";
const CLEANUP_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export const useCartCleanup = () => {
	const [isCleaningUp, setIsCleaningUp] = useState(false);
	const [cleanupComplete, setCleanupComplete] = useState(false);
	const [, deleteLine] = useCheckoutLineDeleteMutation();

	const cleanupCart = useCallback(async () => {
		try {
			const storedCleanup = localStorage.getItem(CLEANUP_STORAGE_KEY);
			if (!storedCleanup) {
				return { success: false, reason: "no_pending_cleanup" };
			}

			const cleanup: PendingCartCleanup = JSON.parse(storedCleanup) as PendingCartCleanup;

			// Check if cleanup data is too old (expired)
			if (Date.now() - cleanup.timestamp > CLEANUP_MAX_AGE) {
				localStorage.removeItem(CLEANUP_STORAGE_KEY);
				return { success: false, reason: "cleanup_expired" };
			}

			// Don't cleanup if there are no line IDs
			if (!cleanup.lineIds || cleanup.lineIds.length === 0) {
				localStorage.removeItem(CLEANUP_STORAGE_KEY);
				return { success: false, reason: "no_lines_to_remove" };
			}

			setIsCleaningUp(true);

			// Delete the purchased lines from the original cart one by one
			let deletedCount = 0;
			let hasError = false;

			for (const lineId of cleanup.lineIds) {
				const result = await deleteLine({
					checkoutId: cleanup.originalCartId,
					lineId: lineId,
					languageCode: "EN_US",
				});

				if (result.error) {
					console.error(`Error deleting line ${lineId}:`, result.error);
					hasError = true;
					// Continue trying to delete other lines
				} else {
					deletedCount++;
				}
			}

			// Clear the pending cleanup regardless of result
			localStorage.removeItem(CLEANUP_STORAGE_KEY);

			if (hasError && deletedCount === 0) {
				return { success: false, reason: "delete_failed" };
			}

			setCleanupComplete(true);
			return { 
				success: true, 
				removedCount: deletedCount,
				originalCartId: cleanup.originalCartId,
			};
		} catch (error) {
			console.error("Cart cleanup error:", error);
			// Clear the storage to prevent repeated failures
			localStorage.removeItem(CLEANUP_STORAGE_KEY);
			return { success: false, reason: "exception", error };
		} finally {
			setIsCleaningUp(false);
		}
	}, [deleteLine]);

	return {
		cleanupCart,
		isCleaningUp,
		cleanupComplete,
	};
};

// Hook to automatically trigger cleanup when order is confirmed
export const useAutoCartCleanup = (orderId: string | undefined) => {
	const { cleanupCart, isCleaningUp, cleanupComplete } = useCartCleanup();
	const [hasAttemptedCleanup, setHasAttemptedCleanup] = useState(false);

	useEffect(() => {
		// Only attempt cleanup once when we have an order ID
		if (orderId && !hasAttemptedCleanup && !isCleaningUp) {
			setHasAttemptedCleanup(true);
			cleanupCart().then((result) => {
				if (result.success) {
					// Removed excessive logging
				}
			});
		}
	}, [orderId, hasAttemptedCleanup, isCleaningUp, cleanupCart]);

	return { isCleaningUp, cleanupComplete };
};

