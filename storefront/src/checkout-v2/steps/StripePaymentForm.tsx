"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useCheckoutState } from "@/checkout-v2/CheckoutStateProvider";
import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";
import { useCheckoutCompleteRedirect } from "@/checkout-v2/hooks/useCheckoutCompleteRedirect";
import { LoadingOverlay } from "@/checkout-v2/components/LoadingOverlay";
import { PlaceOrderButton } from "@/checkout-v2/summary/PlaceOrderButton";
import { initializeTransaction } from "@/checkout-v2/_actions/initialize-transaction";
import { processTransaction } from "@/checkout-v2/_actions/process-transaction";
import { completeCheckout } from "@/checkout-v2/_actions/complete-checkout";
import { updateCheckoutMetadata } from "@/checkout-v2/_actions/update-checkout-metadata";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";
import { adjustShippingPrice, type ShippingPriceAdjustment } from "@/checkout-v2/utils/adjustShippingPrice";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function withFrameRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : "";
			const isFrameError = msg.includes("Frame not initialized") || msg.includes("frame");
			if (!isFrameError || attempt === maxRetries - 1) throw error;
			await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
		}
	}
	throw new Error("Stripe submit failed after retries");
}

const PAYMENT_TIMEOUT_MS = 60_000;

const getStripeLocale = (channelSlug?: string): string => {
	const localeMap: Record<string, string> = {
		ils: "he",
		usd: "en",
		eur: "en",
		gbp: "en",
	};
	return localeMap[channelSlug?.toLowerCase() ?? ""] ?? "en";
};

// ---------------------------------------------------------------------------
// Inner form — inside <Elements> provider
// ---------------------------------------------------------------------------

interface StripeCheckoutFormProps {
	checkoutId: string;
	gatewayId: string;
	checkoutAmount: number;
	channel: string;
}

function StripeCheckoutForm({
	checkoutId,
	gatewayId,
	checkoutAmount,
	channel,
}: StripeCheckoutFormProps) {
	const stripe = useStripe();
	const elements = useElements();
	const router = useRouter();
	const t = useCheckoutText();
	const { state: checkoutState } = useCheckoutState();
	const ecommerce = useEcommerceSettings();

	const [isLoading, setIsLoading] = useState(false);
	const [paymentSucceeded, setPaymentSucceeded] = useState(false);
	const [elementsReady, setElementsReady] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const initializedRef = useRef(false);

	useCheckoutCompleteRedirect({ checkoutId, channel });

	useEffect(() => {
		if (elements && stripe && !initializedRef.current) {
			initializedRef.current = true;
			const timer = setTimeout(() => setElementsReady(true), 100);
			return () => clearTimeout(timer);
		}
		if ((!elements || !stripe) && initializedRef.current) {
			initializedRef.current = false;
			setElementsReady(false);
		}
	}, [elements, stripe]);

	const paymentElementOptions = useMemo(
		() => ({
			layout: "tabs" as const,
			wallets: { applePay: "auto" as const, googlePay: "auto" as const },
			fields: {
				billingDetails: { address: "never" as const },
			},
		}),
		[],
	);

	const handlePayment = useCallback(async () => {
		setErrors([]);

		if (!stripe || !elements) {
			setErrors([t.paymentSystemUnavailableError ?? "Payment system is not available. Please try again."]);
			return;
		}

		setIsLoading(true);

		const timeoutId = setTimeout(() => {
			setIsLoading(false);
			setErrors([t.paymentTimeoutError ?? "Payment timed out. Please try again."]);
		}, PAYMENT_TIMEOUT_MS);

		try {
			let submitResult;
			try {
				submitResult = await withFrameRetry(() => elements.submit());
			} catch {
				setErrors([t.paymentFormNotReadyError ?? "Payment form is not ready. Please refresh and try again."]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			if (submitResult.error) {
				setErrors([submitResult.error.message ?? t.paymentValidationFailedError ?? "Payment validation failed"]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			let paymentMethod = (submitResult as { selectedPaymentMethod?: string }).selectedPaymentMethod;
			if (paymentMethod === "link") paymentMethod = "card";

			const initResult = await initializeTransaction(checkoutId, {
				gatewayId,
				paymentMethod: paymentMethod ?? "card",
				amount: checkoutAmount,
			});

			if (initResult.errors.length > 0) {
				setErrors(initResult.errors.map((e) => e.message ?? "Transaction initialization failed"));
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			const transactionId = initResult.transactionId;
			if (!transactionId) {
				setErrors([t.transactionCreationFailedError ?? "Transaction could not be created. Please try again."]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			let data: Record<string, unknown> = {};
			if (typeof initResult.data === "string") {
				try {
					data = JSON.parse(initResult.data) as Record<string, unknown>;
				} catch {
					setErrors([t.invalidPaymentDataError ?? "Invalid payment data received. Please try again."]);
					clearTimeout(timeoutId);
					setIsLoading(false);
					return;
				}
			} else if (initResult.data && typeof initResult.data === "object") {
				data = initResult.data as Record<string, unknown>;
			}

			const pi = data.paymentIntent as Record<string, unknown> | undefined;
			const clientSecret =
				(pi?.stripeClientSecret as string | undefined) ??
				(pi?.clientSecret as string | undefined) ??
				(data.stripeClientSecret as string | undefined) ??
				(data.clientSecret as string | undefined);

			if (!clientSecret) {
				console.error("[StripePaymentForm] Missing Stripe client secret", { data });
				setErrors([t.paymentInitIncompleteError ?? "Payment initialization incomplete. Please try again."]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			sessionStorage.setItem("transactionId", transactionId);

			const returnUrl = `${window.location.origin}${window.location.pathname}?checkout=${checkoutId}&transaction=${transactionId}&processingPayment=true`;

			let confirmResult;
			try {
				confirmResult = await withFrameRetry(() =>
					stripe.confirmPayment({
						elements,
						clientSecret,
						confirmParams: { return_url: returnUrl },
					}),
				);
			} catch {
				setErrors([t.paymentConfirmationFailedError ?? "Payment confirmation failed. Please try again."]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			const { error: confirmError } = confirmResult;

			if (confirmError) {
				clearTimeout(timeoutId);
				setIsLoading(false);
				if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
					setErrors([confirmError.message ?? t.paymentFailedError ?? "Payment failed"]);
				} else {
					setErrors([t.unexpectedPaymentError ?? "An unexpected error occurred with your payment"]);
				}
				return;
			}

			const processResult = await processTransaction(transactionId);
			if (processResult.errors.length > 0) {
				setErrors([t.paymentSuccessOrderFailedError ?? "Payment succeeded but order processing failed. Please contact support."]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			sessionStorage.removeItem("transactionId");

			try {
				const co = checkoutState.checkout;
				const originalShipping = co?.shippingPrice?.gross?.amount ?? 0;
				const shippingCurrency = co?.shippingPrice?.gross?.currency ?? "";
				const priceAdj = ecommerce?.shipping?.priceAdjustment as ShippingPriceAdjustment | undefined;
				const adjustedShipping = adjustShippingPrice(originalShipping, priceAdj);
				const selectedMethodId = (co?.deliveryMethod as { id: string } | null)?.id;
				const selectedMethod = selectedMethodId
					? co?.shippingMethods?.find((m) => m.id === selectedMethodId)
					: null;

				await updateCheckoutMetadata(checkoutId, [
					{ key: "shipping.originalCost", value: String(originalShipping) },
					{ key: "shipping.displayCost", value: String(adjustedShipping) },
					{ key: "shipping.currency", value: shippingCurrency },
					{ key: "shipping.wasFree", value: String(originalShipping === 0) },
					{ key: "shipping.methodName", value: selectedMethod?.name ?? "" },
				]);
			} catch (metaErr) {
				console.warn("[StripePaymentForm] Failed to set shipping metadata:", metaErr);
			}

			const completeResult = await completeCheckout(checkoutId);
			if (completeResult.errors.length > 0) {
				setErrors([t.paymentSuccessOrderFailedError ?? "Payment succeeded but order could not be placed. Please contact support."]);
				clearTimeout(timeoutId);
				setIsLoading(false);
				return;
			}

			clearTimeout(timeoutId);

			if (completeResult.orderId) {
				setPaymentSucceeded(true);
				router.replace(`/${channel}/checkout?order=${completeResult.orderId}`);
			}
		} catch (error) {
			clearTimeout(timeoutId);
			console.error("[StripePaymentForm] Unexpected error:", error);
			setErrors(["An unexpected error occurred during payment"]);
			setIsLoading(false);
		}
	}, [checkoutId, checkoutAmount, channel, elements, gatewayId, router, stripe, t, checkoutState.checkout, ecommerce]);

	if (paymentSucceeded) {
		return <LoadingOverlay message={t.processingOrderText ?? "Processing your order…"} subtitle={t.doNotClosePageText} />;
	}

	if (!stripe || !elements) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="flex flex-col items-center gap-3 text-center">
					<MiniSpinner />
					<p className="text-sm text-neutral-500">
						{t.initializingPaymentText ?? "Initializing payment system…"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{errors.length > 0 && (
				<div role="alert" className="rounded-md border border-error-200 bg-error-50 px-4 py-3">
					{errors.map((msg, i) => (
						<p key={i} className="text-sm text-error-700">
							{msg}
						</p>
					))}
				</div>
			)}

			<div style={{ contain: "layout", willChange: "auto" }}>
				<PaymentElement
					options={paymentElementOptions}
					onReady={() => setElementsReady(true)}
				/>
			</div>

			<PlaceOrderButton
				onSubmit={handlePayment}
				isLoading={isLoading}
				disabled={!elementsReady}
			/>

			{isLoading && (
				<LoadingOverlay message={t.processingOrderText ?? "Processing your payment…"} subtitle={t.doNotClosePageText} />
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stripe Payment Form (exported)
// ---------------------------------------------------------------------------

interface StripePaymentFormProps {
	checkoutId: string;
	channel: string;
	gatewayId: string;
	publishableKey: string;
	checkout: {
		totalPrice?: { gross: { amount: number; currency: string } } | null;
		channel?: { slug?: string } | null;
	};
}

export function StripePaymentForm({
	checkoutId,
	channel,
	gatewayId,
	publishableKey,
	checkout,
}: StripePaymentFormProps) {
	const stripeLocale = useMemo(
		() => getStripeLocale(checkout?.channel?.slug),
		[checkout?.channel?.slug],
	);

	const stripePromise = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return loadStripe(publishableKey, { locale: stripeLocale as any });
	}, [publishableKey, stripeLocale]);

	const amount = checkout?.totalPrice
		? Math.round(checkout.totalPrice.gross.amount * 100)
		: 0;
	const currency = checkout?.totalPrice?.gross.currency?.toLowerCase() ?? "usd";

	const stripeOptions: StripeElementsOptions = useMemo(
		() => ({
			mode: "payment" as const,
			amount,
			currency,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			locale: stripeLocale as any,
			appearance: { theme: "stripe" as const },
		}),
		[amount, currency, stripeLocale],
	);

	if (!checkout?.totalPrice) {
		return (
			<div className="py-4 text-center text-sm text-neutral-500">
				Loading checkout information…
			</div>
		);
	}

	return (
		<Elements
			key={`stripe-${publishableKey}-${stripeLocale}`}
			options={stripeOptions}
			stripe={stripePromise}
		>
			<StripeCheckoutForm
				checkoutId={checkoutId}
				gatewayId={gatewayId}
				checkoutAmount={checkout.totalPrice.gross.amount}
				channel={channel}
			/>
		</Elements>
	);
}

// ---------------------------------------------------------------------------
// Shared spinner
// ---------------------------------------------------------------------------

function MiniSpinner() {
	return (
		<svg
			aria-hidden="true"
			className="h-6 w-6 animate-spin"
			style={{ fill: "var(--store-primary, #6366f1)", color: "#e5e7eb" }}
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
	);
}
