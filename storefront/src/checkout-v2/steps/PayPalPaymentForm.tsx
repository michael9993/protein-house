"use client";

import { useState, useCallback, useRef } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useCheckoutState } from "@/checkout-v2/CheckoutStateProvider";
import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";
import { LoadingOverlay } from "@/checkout-v2/components/LoadingOverlay";
import { initializeTransaction } from "@/checkout-v2/_actions/initialize-transaction";
import { processTransaction } from "@/checkout-v2/_actions/process-transaction";
import { completeCheckout } from "@/checkout-v2/_actions/complete-checkout";
import { updateCheckoutMetadata } from "@/checkout-v2/_actions/update-checkout-metadata";



// ---------------------------------------------------------------------------
// Payment error code → config key mapping
// ---------------------------------------------------------------------------

type CheckoutTextKey =
	| "cardDeclinedError"
	| "cardExpiredError"
	| "insufficientFundsError"
	| "invalidCardError"
	| "transactionRefusedError"
	| "verificationRequiredError"
	| "paymentNotApprovedError"
	| "paypalTemporaryError"
	| "genericPaymentDeclineError";

const errorCodeToConfigKey: [string, CheckoutTextKey][] = [
	["INSTRUMENT_DECLINED", "cardDeclinedError"],
	["GENERIC_DECLINE", "cardDeclinedError"],
	["CARD_EXPIRED", "cardExpiredError"],
	["EXPIRED_CARD", "cardExpiredError"],
	["INSUFFICIENT_FUNDS", "insufficientFundsError"],
	["INVALID_OR_RESTRICTED_CARD", "invalidCardError"],
	["INVALID_ACCOUNT", "invalidCardError"],
	["CVV2_FAILURE", "invalidCardError"],
	["TRANSACTION_REFUSED", "transactionRefusedError"],
	["DO_NOT_HONOR", "transactionRefusedError"],
	["SUSPECTED_FRAUD", "transactionRefusedError"],
	["LOST_OR_STOLEN", "transactionRefusedError"],
	["PAYER_ACTION_REQUIRED", "verificationRequiredError"],
	["ORDER_NOT_APPROVED", "paymentNotApprovedError"],
	["INTERNAL_SERVER_ERROR", "paypalTemporaryError"],
];

/** Map a raw PayPal/processor error message to a config-driven translated message */
function mapPaymentError(rawMessage: string, t: { [K in CheckoutTextKey]?: string } & { genericPaymentDeclineError?: string; paymentFailedError?: string }): string {
	const upper = rawMessage.toUpperCase();
	for (const [code, key] of errorCodeToConfigKey) {
		if (upper.includes(code)) {
			return t[key] ?? t.genericPaymentDeclineError ?? rawMessage;
		}
	}
	return t.genericPaymentDeclineError ?? t.paymentFailedError ?? rawMessage;
}

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
					const rawMsg = processResult.errors[0]?.message || "";
					setErrors([mapPaymentError(rawMsg, t)]);
					setIsProcessing(false);
					return;
				}

				// Check if the payment app returned a failure (e.g., CHARGE_FAILURE)
				const eventType = processResult.eventType ?? "";
				if (eventType.includes("FAILURE") || eventType.includes("failure")) {
					const rawMsg = processResult.eventMessage || "";
					setErrors([mapPaymentError(rawMsg, t)]);
					setIsProcessing(false);
					return;
				}

				// Set shipping metadata
				try {
					const co = checkoutState.checkout ?? checkout;
					const saleorShipping = co?.shippingPrice?.gross?.amount ?? 0;
					const shippingCurrency = co?.shippingPrice?.gross?.currency ?? "";
					const selectedMethodId = (co?.deliveryMethod as { id: string } | null)?.id;
					const selectedMethod = selectedMethodId
						? co?.shippingMethods?.find((m: { id: string }) => m.id === selectedMethodId)
						: null;
					const methodName = selectedMethod?.name ?? "";

					// Look up the real CJ cost from dropship.shippingOriginalPrices metadata
					const coMeta = (co as { metadata?: Array<{ key: string; value: string }> })?.metadata ?? [];
					const origPricesRaw = coMeta.find((m: { key: string }) => m.key === "dropship.shippingOriginalPrices")?.value;
					let realOriginalCost = saleorShipping;
					if (origPricesRaw && methodName) {
						try {
							const prices = JSON.parse(origPricesRaw) as Record<string, number>;
							if (prices[methodName] !== undefined) {
								realOriginalCost = prices[methodName];
							}
						} catch { /* use saleor price as fallback */ }
					}

					await updateCheckoutMetadata(checkoutId, [
						{ key: "shipping.originalCost", value: realOriginalCost.toFixed(2) },
						{ key: "shipping.displayCost", value: saleorShipping.toFixed(2) },
						{ key: "shipping.currency", value: shippingCurrency },
						{ key: "shipping.wasFree", value: String(saleorShipping === 0) },
						{ key: "shipping.methodName", value: methodName },
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
				} else {
					setErrors([
						t.paymentSuccessOrderFailedError ??
							"Payment succeeded but order could not be finalized. Please contact support.",
					]);
					setIsProcessing(false);
				}
			} catch (error) {
				console.error("[PayPalPaymentForm] onApprove error:", error);
				setErrors(["An unexpected error occurred during payment processing"]);
				setIsProcessing(false);
			}
		},
		[checkoutId, channel, checkout, checkoutState.checkout, router, t],
	);

	const onError = useCallback(
		(err: Record<string, unknown>) => {
			console.error("[PayPalPaymentForm] PayPal SDK error:", err);
			setErrors([mapPaymentError(String(err?.message ?? ""), t)]);
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
				}}
			>
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

