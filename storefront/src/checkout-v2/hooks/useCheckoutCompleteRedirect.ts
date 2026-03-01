/**
 * Handles post-redirect payment completion for Stripe 3DS / PayPal flows.
 * When Stripe redirects back to the return URL, this hook detects the redirect,
 * processes the transaction via server action, completes the checkout, and
 * navigates to the order confirmation URL.
 *
 * Call this hook inside a component that has access to Stripe context
 * (i.e. inside the Elements provider).
 */
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useStripe } from "@stripe/react-stripe-js";
import { processTransaction } from "@/checkout-v2/_actions/process-transaction";
import { completeCheckout } from "@/checkout-v2/_actions/complete-checkout";

interface UseCheckoutCompleteRedirectOptions {
	checkoutId: string;
	channel: string;
}

export function useCheckoutCompleteRedirect({
	checkoutId,
	channel,
}: UseCheckoutCompleteRedirectOptions) {
	const stripe = useStripe();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const isProcessingRef = useRef(false);

	useEffect(() => {
		const paymentIntent = searchParams.get("payment_intent");
		const redirectStatus = searchParams.get("redirect_status");
		const processingPayment = searchParams.get("processingPayment");

		// Only handle Stripe redirect returns
		if (!paymentIntent || !processingPayment || !stripe) return;

		// Don't process failed redirects (user can retry)
		if (redirectStatus === "failed") return;

		// Prevent multiple executions
		if (isProcessingRef.current) return;

		// Get transactionId — prefer sessionStorage, fall back to query param
		const storedTransactionId = sessionStorage.getItem("transactionId");
		const queryTransactionId = searchParams.get("transaction");
		const transactionId = storedTransactionId ?? queryTransactionId;

		if (!transactionId) {
			console.error("[CheckoutCompleteRedirect] Missing transactionId after Stripe redirect");
			return;
		}

		isProcessingRef.current = true;

		const processAndComplete = async () => {
			try {
				// Sync Saleor with Stripe's payment status
				const processResult = await processTransaction(transactionId);
				if (processResult.errors.length > 0) {
					console.error("[CheckoutCompleteRedirect] Transaction process errors:", processResult.errors);
					isProcessingRef.current = false;
					return;
				}

				// Clear session storage
				sessionStorage.removeItem("transactionId");

				// Complete the checkout
				const completeResult = await completeCheckout(checkoutId);
				if (completeResult.errors.length > 0) {
					console.error("[CheckoutCompleteRedirect] Checkout complete errors:", completeResult.errors);
					isProcessingRef.current = false;
					return;
				}

				if (completeResult.orderId) {
					router.replace(`/${channel}/checkout?order=${completeResult.orderId}`);
				}
			} catch (error) {
				console.error("[CheckoutCompleteRedirect] Error during completion:", error);
				isProcessingRef.current = false;
			}
		};

		void processAndComplete();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stripe]); // Only re-run if stripe instance changes (handles deferred init)
}
