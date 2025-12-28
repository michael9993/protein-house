import { type FormEventHandler, useEffect, useMemo, useState, useRef } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { type StripePaymentElementOptions } from "@stripe/stripe-js";
import { getUrlForTransactionInitialize } from "../utils";
import { useCheckoutCompleteRedirect } from "./useCheckoutCompleteRedirect";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useEvent } from "@/checkout/hooks/useEvent";
import { useTransactionInitializeMutation, useTransactionProcessMutation } from "@/checkout/graphql";
import { useCheckoutComplete } from "@/checkout/hooks/useCheckoutComplete";

// PaymentElement options - will be created with proper onReady handler
const createPaymentElementOptions = (onReady?: () => void): StripePaymentElementOptions => ({
	layout: "tabs",
	// Enable Stripe Link for faster checkout
	wallets: {
		applePay: "auto",
		googlePay: "auto",
	},
	// Enable Link payment method
	paymentMethodTypes: ["card", "link"],
	onReady: () => {
		// Removed excessive logging
		onReady?.();
	},
});

// const getRedirectUrl = (checkoutId: string, transactionId: string) =>
// 	`${window.location.origin}/checkout/${checkoutId}/payment/summary?transactionId=${transactionId}`;

interface CheckoutFormProps {
	gatewayId: string;
}

export function CheckoutForm({ gatewayId }: CheckoutFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [elementsReady, setElementsReady] = useState(false);
	const initializedRef = useRef(false);
	const stripe = useStripe();
	const elements = useElements();
	const { checkout } = useCheckout();
	const { showCustomErrors } = useAlerts();
	const { onCheckoutComplete } = useCheckoutComplete();
	const [, transactionInitialize] = useTransactionInitializeMutation();
	const [, transactionProcess] = useTransactionProcessMutation();

	// When page is opened from previously redirected payment, we need to complete the checkout
	useCheckoutCompleteRedirect();

	// PaymentElement options - must be defined before any conditional returns (Rules of Hooks)
	const paymentElementOptions = useMemo(
		() => createPaymentElementOptions(() => {
			// Mark as ready when PaymentElement fires onReady
			setElementsReady(true);
		}),
		[]
	);

	// Initialize ready state when stripe and elements become available
	// Use ref to track initialization and prevent re-running unnecessarily
	useEffect(() => {
		if (elements && stripe && !initializedRef.current) {
			initializedRef.current = true;
			// Give Elements a moment to initialize before allowing PaymentElement to render
			// Reduced timeout to minimize delay while still ensuring proper initialization
			const timer = setTimeout(() => {
				setElementsReady(true);
			}, 100);
			
			return () => clearTimeout(timer);
		}
		// Reset if stripe/elements become unavailable (shouldn't happen normally)
		if ((!elements || !stripe) && initializedRef.current) {
			initializedRef.current = false;
			setElementsReady(false);
		}
	}, [elements, stripe]);

	const handleSubmit: FormEventHandler<HTMLFormElement> = useEvent(async (e) => {
		e.preventDefault();

		if (!stripe || !elements) {
			showCustomErrors([{ message: "Payment system is not available. Please try again later." }]);
			return;
		}

		setIsLoading(true);

		try {
			// First submit Stripe form to validate and get the payment method
			let submitResult;
			try {
				submitResult = await elements.submit();
			} catch (frameError: any) {
				// Handle Stripe frame initialization errors
				if (frameError?.message?.includes("Frame not initialized") || frameError?.message?.includes("frame")) {
					console.warn("Stripe frame initialization issue, retrying...", frameError);
					// Wait a bit and retry once
					await new Promise(resolve => setTimeout(resolve, 500));
					try {
						submitResult = await elements.submit();
					} catch (retryError) {
						showCustomErrors([{ message: "Payment form is not ready. Please refresh the page and try again." }]);
						setIsLoading(false);
						return;
					}
				} else {
					throw frameError;
				}
			}

			if (submitResult.error) {
				showCustomErrors([{ message: submitResult.error.message || "Payment validation failed" }]);
				setIsLoading(false);
				return;
			}

			// Extract selectedPaymentMethod from submit result
			// Link payments work through the card flow, so if "link" is selected, use "card"
			let selectedPaymentMethod = (submitResult as { selectedPaymentMethod?: string })
				.selectedPaymentMethod;
			
			// Stripe Link payments use the card payment method flow
			// The backend Stripe app doesn't recognize "link" as a separate payment method
			if (selectedPaymentMethod === "link") {
				selectedPaymentMethod = "card";
			}

			// Initialize transaction with Saleor
			// Removed excessive logging
			const initializeResult = await transactionInitialize({
				checkoutId: checkout.id,
				amount: checkout.totalPrice.gross.amount,
				paymentGateway: {
					id: gatewayId,
					data: {
						paymentIntent: {
							paymentMethod: selectedPaymentMethod || "card", // Default to card if not specified
						},
					},
				},
			});
			// Removed excessive logging

			if (initializeResult.error) {
				showCustomErrors([
					{ message: initializeResult.error.message || "Transaction initialization failed" },
				]);
				setIsLoading(false);
				return;
			}

			const transactionData = initializeResult.data?.transactionInitialize;
			
			// Check for GraphQL errors first
			if (transactionData?.errors?.length) {
				const errorMessages = transactionData.errors.map((err) => ({ message: err.message || "Error" }));
				showCustomErrors(errorMessages);
				setIsLoading(false);
				return;
			}

			// Transaction might be created even if webhook had issues
			// Check if we have a transaction ID
			const transactionId = transactionData?.transaction?.id;
			if (!transactionId) {
				showCustomErrors([{ message: "Transaction could not be created. Please try again." }]);
				setIsLoading(false);
				return;
			}

			// Extract client secret from the transaction data
			// The data field is JSON and might be a string or already parsed object
			// Stripe app returns: { paymentIntent: { stripeClientSecret: "..." } }
			let data: any = transactionData.data;
			
			// If data is a string, try to parse it
			if (typeof data === "string") {
				try {
					data = JSON.parse(data);
				} catch (e) {
					console.error("Failed to parse transaction data as JSON:", e);
					showCustomErrors([{ 
						message: "Invalid payment data received. Please try again." 
					}]);
					setIsLoading(false);
					return;
				}
			}
			
			// Extract client secret - Stripe app returns it at data.paymentIntent.stripeClientSecret
			// Try multiple possible paths in case the structure varies
			const clientSecret = 
				data?.paymentIntent?.stripeClientSecret || 
				data?.paymentIntent?.clientSecret ||
				data?.stripeClientSecret ||
				data?.clientSecret;

			if (!clientSecret || typeof clientSecret !== "string") {
				console.error("⚠️ Client secret missing from transaction data", { 
					data, 
					transactionData,
					dataType: typeof data,
					dataKeys: data ? Object.keys(data) : [],
					paymentIntentKeys: data?.paymentIntent ? Object.keys(data.paymentIntent) : [],
					hasPaymentIntent: !!data?.paymentIntent,
					paymentIntentType: typeof data?.paymentIntent,
				});
				showCustomErrors([{ 
					message: "Payment initialization incomplete. The payment intent was created but the client secret is missing. Please try again." 
				}]);
				setIsLoading(false);
				return;
			}

			// Store non-sensitive identifier only so that we can resume after redirect
			sessionStorage.setItem("transactionId", transactionId);

			const { newUrl: returnUrl } = getUrlForTransactionInitialize({
				transaction: transactionId,
			});

			// Confirm the payment with Stripe
			let confirmResult;
			try {
				confirmResult = await stripe.confirmPayment({
					elements,
					clientSecret,
					confirmParams: {
						return_url: returnUrl,
						payment_method_data: {
							billing_details: {
								name: `${checkout.billingAddress?.firstName} ${checkout.billingAddress?.lastName}`.trim(),
								email: checkout.email || "",
								phone: checkout.billingAddress?.phone || "",
								address: {
									city: checkout.billingAddress?.city || "",
									country: checkout.billingAddress?.country?.code || "",
									line1: checkout.billingAddress?.streetAddress1 || "",
									line2: checkout.billingAddress?.streetAddress2 || "",
									postal_code: checkout.billingAddress?.postalCode || "",
									state: checkout.billingAddress?.countryArea || "",
								},
							},
						},
					},
				});
			} catch (frameError: any) {
				// Handle Stripe frame initialization errors during confirmation
				if (frameError?.message?.includes("Frame not initialized") || frameError?.message?.includes("frame")) {
					console.warn("Stripe frame error during confirmation, retrying...", frameError);
					// Wait a bit and retry once
					await new Promise(resolve => setTimeout(resolve, 500));
					try {
						confirmResult = await stripe.confirmPayment({
							elements,
							clientSecret,
							confirmParams: {
								return_url: returnUrl,
								payment_method_data: {
									billing_details: {
										name: `${checkout.billingAddress?.firstName} ${checkout.billingAddress?.lastName}`.trim(),
										email: checkout.email || "",
										phone: checkout.billingAddress?.phone || "",
										address: {
											city: checkout.billingAddress?.city || "",
											country: checkout.billingAddress?.country?.code || "",
											line1: checkout.billingAddress?.streetAddress1 || "",
											line2: checkout.billingAddress?.streetAddress2 || "",
											postal_code: checkout.billingAddress?.postalCode || "",
											state: checkout.billingAddress?.countryArea || "",
										},
									},
								},
							},
						});
					} catch (retryError) {
						showCustomErrors([{ message: "Payment confirmation failed. Please try again." }]);
						setIsLoading(false);
						return;
					}
				} else {
					throw frameError;
				}
			}

			const { error: confirmError } = confirmResult;

			if (confirmError) {
				setIsLoading(false);
				if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
					showCustomErrors([{ message: confirmError.message ?? "Payment failed" }]);
				} else {
					showCustomErrors([{ message: "An unexpected error occurred with your payment" }]);
				}
			} else {
				// Payment succeeded without redirect - sync Saleor with Stripe status
				const processResult = await transactionProcess({ id: transactionId });

				if (processResult.error || processResult.data?.transactionProcess?.errors?.length) {
					console.error(
						"Transaction process failed:",
						processResult.error || processResult.data?.transactionProcess?.errors,
					);
					showCustomErrors([
						{ message: "Payment was successful but order processing failed. Please contact support." },
					]);
					setIsLoading(false);
					return;
				}

				// Clear session storage since we're not going through redirect
				sessionStorage.removeItem("transactionId");
				sessionStorage.removeItem("clientSecret");

				await onCheckoutComplete();
			}

			// Note: If Stripe requires redirect (3DS, etc.), it will redirect to the return_url
			// The redirect flow is handled by useCheckoutCompleteRedirect
		} catch (error) {
			console.error("Payment processing error:", error);
			showCustomErrors([{ message: "An unexpected error occurred during payment" }]);
			setIsLoading(false);
		}
	});

	// Render loading state if Stripe/Elements not ready
	if (!stripe || !elements) {
		return (
			<div className="my-8 flex items-center justify-center py-8">
				<div className="text-center">
					<Loader />
					<p className="mt-4 text-sm text-gray-600">Initializing payment system...</p>
				</div>
			</div>
		);
	}

	// Render payment form
	return (
		<form className="my-8 flex flex-col gap-y-6" onSubmit={handleSubmit}>
			<PaymentElement className="payment-element" options={paymentElementOptions} />
			<button
				className="h-12 items-center rounded-md bg-neutral-900 px-6 py-3 text-base font-medium leading-6 text-white shadow hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 hover:disabled:bg-neutral-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 hover:aria-disabled:bg-neutral-700"
				aria-disabled={isLoading || !stripe || !elements || !elementsReady}
				id="submit"
				type="submit"
			>
				<span className="button-text">{isLoading ? <Loader /> : "Pay now"}</span>
			</button>
		</form>
	);
}

function Loader() {
	return (
		<div className="text-center" aria-busy="true" role="status">
			<div>
				<svg
					aria-hidden="true"
					className="mr-2 inline h-6 w-6 animate-spin fill-neutral-600 text-neutral-100 dark:text-neutral-600"
					viewBox="0 0 100 101"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
						fill="currentColor"
					/>
					<path
						d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
						fill="currentFill"
					/>
				</svg>
				<span className="sr-only">Loading...</span>
			</div>
		</div>
	);
}
