"use client";

import { useState, useCallback, useRef } from "react";
import {
	PayPalScriptProvider,
	PayPalButtons,
	PayPalCardFieldsProvider,
	PayPalCardFieldsForm,
	PayPalNumberField,
	PayPalExpiryField,
	PayPalCVVField,
	PayPalNameField,
	usePayPalCardFields,
} from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useCheckoutState } from "@/checkout-v2/CheckoutStateProvider";
import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";
import { LoadingOverlay } from "@/checkout-v2/components/LoadingOverlay";
import { initializeTransaction } from "@/checkout-v2/_actions/initialize-transaction";
import { processTransaction } from "@/checkout-v2/_actions/process-transaction";
import { completeCheckout } from "@/checkout-v2/_actions/complete-checkout";
import { updateCheckoutMetadata } from "@/checkout-v2/_actions/update-checkout-metadata";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";
import { adjustShippingPrice, type ShippingPriceAdjustment } from "@/checkout-v2/utils/adjustShippingPrice";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayPalPaymentFormProps {
	checkoutId: string;
	channel: string;
	gatewayId: string;
	paypalClientId: string;
	paypalEnvironment: "SANDBOX" | "LIVE";
	paypalIntent: "capture" | "authorize";
	checkout: {
		totalPrice?: { gross: { amount: number; currency: string } } | null;
		shippingPrice?: { gross: { amount: number; currency: string } } | null;
		deliveryMethod?: { id: string } | null;
		shippingMethods?: Array<{ id: string; name: string }> | null;
	};
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayPalPaymentForm({
	checkoutId,
	channel,
	gatewayId,
	paypalClientId,
	paypalEnvironment,
	paypalIntent,
	checkout,
}: PayPalPaymentFormProps) {
	const router = useRouter();
	const t = useCheckoutText();
	const { state: checkoutState } = useCheckoutState();
	const ecommerce = useEcommerceSettings();

	const [isProcessing, setIsProcessing] = useState(false);
	const [paymentSucceeded, setPaymentSucceeded] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const transactionIdRef = useRef<string | null>(null);

	const checkoutAmount = checkout?.totalPrice?.gross.amount ?? 0;

	// Called when customer clicks PayPal button — creates PayPal order via Saleor
	const createOrder = useCallback(async (): Promise<string> => {
		setErrors([]);

		const initResult = await initializeTransaction(checkoutId, {
			gatewayId,
			amount: checkoutAmount,
		});

		if (initResult.errors.length > 0) {
			const errorMsg = initResult.errors.map((e) => e.message).join(", ");
			setErrors([errorMsg || "Failed to initialize payment"]);
			throw new Error(errorMsg);
		}

		transactionIdRef.current = initResult.transactionId;

		// Extract PayPal order ID from response data
		let data: Record<string, unknown> = {};
		if (typeof initResult.data === "string") {
			try {
				data = JSON.parse(initResult.data) as Record<string, unknown>;
			} catch {
				// try as-is
			}
		} else if (initResult.data && typeof initResult.data === "object") {
			data = initResult.data as Record<string, unknown>;
		}

		const paypalOrderId = data.paypalOrderId as string | undefined;

		if (!paypalOrderId) {
			console.error("[PayPalPaymentForm] Missing paypalOrderId in response", { data });
			const msg = "Failed to create PayPal order";
			setErrors([msg]);
			throw new Error(msg);
		}

		return paypalOrderId;
	}, [checkoutId, gatewayId, checkoutAmount]);

	// Called after customer approves payment in PayPal popup
	const onApprove = useCallback(
		async (data: { orderID: string }) => {
			setIsProcessing(true);
			setErrors([]);

			try {
				const transactionId = transactionIdRef.current;
				if (!transactionId) {
					throw new Error("Missing transaction ID");
				}

				// Process the transaction (captures the PayPal order server-side)
				const processResult = await processTransaction(transactionId, {
					orderId: data.orderID,
				});

				if (processResult.errors.length > 0) {
					setErrors([
						t.paymentSuccessOrderFailedError ??
							"Payment approved but processing failed. Please contact support.",
					]);
					setIsProcessing(false);
					return;
				}

				// Set shipping metadata
				try {
					const co = checkoutState.checkout ?? checkout;
					const originalShipping = co?.shippingPrice?.gross?.amount ?? 0;
					const shippingCurrency = co?.shippingPrice?.gross?.currency ?? "";
					const priceAdj = ecommerce?.shipping?.priceAdjustment as ShippingPriceAdjustment | undefined;
					const adjustedShipping = adjustShippingPrice(originalShipping, priceAdj);
					const selectedMethodId = (co?.deliveryMethod as { id: string } | null)?.id;
					const selectedMethod = selectedMethodId
						? co?.shippingMethods?.find((m: { id: string }) => m.id === selectedMethodId)
						: null;

					await updateCheckoutMetadata(checkoutId, [
						{ key: "shipping.originalCost", value: String(originalShipping) },
						{ key: "shipping.displayCost", value: String(adjustedShipping) },
						{ key: "shipping.currency", value: shippingCurrency },
						{ key: "shipping.wasFree", value: String(originalShipping === 0) },
						{ key: "shipping.methodName", value: selectedMethod?.name ?? "" },
					]);
				} catch (metaErr) {
					console.warn("[PayPalPaymentForm] Failed to set shipping metadata:", metaErr);
				}

				// Complete checkout
				const completeResult = await completeCheckout(checkoutId);

				if (completeResult.errors.length > 0) {
					setErrors([
						t.paymentSuccessOrderFailedError ??
							"Payment succeeded but order could not be placed. Please contact support.",
					]);
					setIsProcessing(false);
					return;
				}

				if (completeResult.orderId) {
					setPaymentSucceeded(true);
					router.replace(`/${channel}/checkout?order=${completeResult.orderId}`);
				}
			} catch (error) {
				console.error("[PayPalPaymentForm] onApprove error:", error);
				setErrors(["An unexpected error occurred during payment processing"]);
				setIsProcessing(false);
			}
		},
		[checkoutId, channel, checkout, checkoutState.checkout, ecommerce, router, t],
	);

	const onError = useCallback(
		(err: Record<string, unknown>) => {
			console.error("[PayPalPaymentForm] PayPal SDK error:", err);
			setErrors([t.unexpectedPaymentError ?? "An error occurred with PayPal. Please try again."]);
			setIsProcessing(false);
		},
		[t],
	);

	const onCancel = useCallback(() => {
		setErrors([]);
		setIsProcessing(false);
	}, []);

	if (paymentSucceeded) {
		return (
			<LoadingOverlay
				message={t.processingOrderText ?? "Processing your order…"}
				subtitle={t.doNotClosePageText}
			/>
		);
	}

	if (!checkout?.totalPrice) {
		return (
			<div className="py-4 text-center text-sm text-neutral-500">
				Loading checkout information…
			</div>
		);
	}

	const currency = checkout.totalPrice.gross.currency?.toUpperCase() ?? "USD";
	const formattedAmount = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	}).format(checkoutAmount);

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

			<PayPalScriptProvider
				options={{
					clientId: paypalClientId,
					currency,
					intent: paypalIntent,
					components: "buttons,card-fields",
				}}
			>
				{/* PayPal wallet button */}
				<PayPalButtons
					style={{
						layout: "vertical",
						color: "gold",
						shape: "rect",
						label: "paypal",
						height: 48,
					}}
					createOrder={createOrder}
					onApprove={onApprove}
					onError={onError}
					onCancel={onCancel}
					disabled={isProcessing}
				/>

				{/* Divider */}
				<div className="relative my-4">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-neutral-200" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-white px-3 text-neutral-400">
							or pay with card
						</span>
					</div>
				</div>

				{/* Card fields */}
				<PayPalCardFieldsProvider
					createOrder={createOrder}
					onApprove={onApprove}
					onError={onError}
				>
					<CardFieldsForm
						isProcessing={isProcessing}
						setIsProcessing={setIsProcessing}
						formattedAmount={formattedAmount}
					/>
				</PayPalCardFieldsProvider>
			</PayPalScriptProvider>

			{isProcessing && (
				<LoadingOverlay
					message={t.processingOrderText ?? "Processing your payment…"}
					subtitle={t.doNotClosePageText}
				/>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Card Fields Form (must be a child of PayPalCardFieldsProvider)
// ---------------------------------------------------------------------------

interface CardFieldsFormProps {
	isProcessing: boolean;
	setIsProcessing: (v: boolean) => void;
	formattedAmount: string;
}

function CardFieldsForm({ isProcessing, setIsProcessing, formattedAmount }: CardFieldsFormProps) {
	const { cardFieldsForm } = usePayPalCardFields();

	const handleSubmit = useCallback(async () => {
		if (!cardFieldsForm) return;

		setIsProcessing(true);
		try {
			await cardFieldsForm.submit();
		} catch {
			setIsProcessing(false);
		}
	}, [cardFieldsForm, setIsProcessing]);

	const fieldStyle = {
		input: {
			"font-size": "14px",
			"font-family": "system-ui, -apple-system, sans-serif",
			color: "#171717",
			padding: "0 12px",
		},
		"input::placeholder": {
			color: "#a3a3a3",
		},
	};

	return (
		<div className="space-y-3">
			<div>
				<label className="mb-1 block text-xs font-medium text-neutral-600">
					Cardholder Name
				</label>
				<div className="overflow-hidden rounded-md border border-neutral-300 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
					<PayPalNameField style={fieldStyle} />
				</div>
			</div>

			<div>
				<label className="mb-1 block text-xs font-medium text-neutral-600">
					Card Number
				</label>
				<div className="overflow-hidden rounded-md border border-neutral-300 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
					<PayPalNumberField style={fieldStyle} />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="mb-1 block text-xs font-medium text-neutral-600">
						Expiry Date
					</label>
					<div className="overflow-hidden rounded-md border border-neutral-300 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
						<PayPalExpiryField style={fieldStyle} />
					</div>
				</div>
				<div>
					<label className="mb-1 block text-xs font-medium text-neutral-600">
						CVV
					</label>
					<div className="overflow-hidden rounded-md border border-neutral-300 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
						<PayPalCVVField style={fieldStyle} />
					</div>
				</div>
			</div>

			<button
				type="button"
				onClick={handleSubmit}
				disabled={isProcessing}
				className="w-full rounded-md px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
				style={{
					backgroundColor: "var(--store-primary, #171717)",
				}}
			>
				{isProcessing ? "Processing…" : `Pay ${formattedAmount}`}
			</button>
		</div>
	);
}

