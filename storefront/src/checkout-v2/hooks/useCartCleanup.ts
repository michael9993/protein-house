/**
 * Cart cleanup after partial checkout (when user checks out a subset of cart items).
 * After order is placed, removes the purchased lines from the original cart checkout.
 *
 * Ported from storefront/src/checkout/hooks/useCartCleanup.ts to use server actions.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { removeLine } from "@/checkout-v2/_actions/remove-line";

interface PendingCartCleanup {
	originalCartId: string;
	lineIds: string[];
	partialCheckoutId: string;
	timestamp: number;
}

const CLEANUP_STORAGE_KEY = "pendingCartCleanup";
const CLEANUP_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function useCartCleanup() {
	const [isCleaningUp, setIsCleaningUp] = useState(false);
	const [cleanupComplete, setCleanupComplete] = useState(false);

	const cleanupCart = useCallback(async () => {
		try {
			const storedCleanup =
				typeof window !== "undefined"
					? localStorage.getItem(CLEANUP_STORAGE_KEY)
					: null;
			if (!storedCleanup) {
				return { success: false, reason: "no_pending_cleanup" };
			}

			const cleanup = JSON.parse(storedCleanup) as PendingCartCleanup;

			if (Date.now() - cleanup.timestamp > CLEANUP_MAX_AGE) {
				localStorage.removeItem(CLEANUP_STORAGE_KEY);
				return { success: false, reason: "cleanup_expired" };
			}

			if (!cleanup.lineIds || cleanup.lineIds.length === 0) {
				localStorage.removeItem(CLEANUP_STORAGE_KEY);
				return { success: false, reason: "no_lines_to_remove" };
			}

			setIsCleaningUp(true);

			let deletedCount = 0;
			let hasError = false;

			for (const lineId of cleanup.lineIds) {
				const result = await removeLine(cleanup.originalCartId, lineId);
				if (result.errors.length > 0) {
					console.error(`Error deleting line ${lineId}:`, result.errors);
					hasError = true;
				} else {
					deletedCount++;
				}
			}

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
			if (typeof window !== "undefined") {
				localStorage.removeItem(CLEANUP_STORAGE_KEY);
			}
			return { success: false, reason: "exception", error };
		} finally {
			setIsCleaningUp(false);
		}
	}, []);

	return { cleanupCart, isCleaningUp, cleanupComplete };
}

/** Automatically trigger cleanup once when orderId becomes available. */
export function useAutoCartCleanup(orderId: string | undefined) {
	const { cleanupCart, isCleaningUp, cleanupComplete } = useCartCleanup();
	const [hasAttempted, setHasAttempted] = useState(false);

	useEffect(() => {
		if (orderId && !hasAttempted && !isCleaningUp) {
			setHasAttempted(true);
			void cleanupCart();
		}
	}, [orderId, hasAttempted, isCleaningUp, cleanupCart]);

	return { isCleaningUp, cleanupComplete };
}
