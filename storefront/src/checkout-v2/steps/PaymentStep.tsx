"use client";

import { useState, useEffect, useMemo } from "react";
import { useCheckoutState } from "@/checkout-v2/CheckoutStateProvider";
import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";
import { initializePaymentGateway } from "@/checkout-v2/_actions/initialize-payment-gateway";
import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { StripePaymentForm } from "./StripePaymentForm";
import { PayPalPaymentForm } from "./PayPalPaymentForm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentStepProps {
	checkoutId: string;
	channel: string;
}

type DetectedProvider =
	| { type: "stripe"; gatewayId: string; publishableKey: string }
	| { type: "paypal"; gatewayId: string; paypalClientId: string; paypalEnvironment: "SANDBOX" | "LIVE"; paypalIntent: "capture" | "authorize" }
	| null;

// ---------------------------------------------------------------------------
// Gateway loader + provider detection
// ---------------------------------------------------------------------------

export function PaymentStep({ checkoutId, channel }: PaymentStepProps) {
	const cdStyle = useComponentStyle("checkout.paymentStep");
	const cdClasses = useComponentClasses("checkout.paymentStep");
	const { state } = useCheckoutState();
	const checkout = state.checkout;
	const t = useCheckoutText();

	const [provider, setProvider] = useState<DetectedProvider>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [initializing, setInitializing] = useState(true);

	// Initialize payment gateways on mount — detect which provider is configured
	useEffect(() => {
		if (!checkoutId) return;

		let isMounted = true;

		const init = async () => {
			try {
				const pgi = await initializePaymentGateway(checkoutId);

				if (!isMounted) return;
				if (!pgi || (pgi.errors?.length ?? 0) > 0) {
					setLoadError("Payment gateway initialization failed");
					setInitializing(false);
					return;
				}

				const configs = pgi.gatewayConfigs ?? [];
				if (configs.length === 0) {
					setLoadError("No payment gateways available");
					setInitializing(false);
					return;
				}

				// Check for PayPal config first, then Stripe
				const paypalConfig = configs.find(
					(c) => c.id.includes("paypal") || c.id.includes("app.payment.paypal"),
				);
				const stripeConfig = configs.find(
					(c) => c.id.includes("stripe") || c.id.includes("app.stripe"),
				);

				// Prefer PayPal if both are configured (user can change this)
				const selectedConfig = paypalConfig ?? stripeConfig ?? configs[0];

				let parsedData: Record<string, unknown> = {};
				if (selectedConfig.data) {
					try {
						parsedData =
							typeof selectedConfig.data === "string"
								? (JSON.parse(selectedConfig.data) as Record<string, unknown>)
								: (selectedConfig.data as Record<string, unknown>);
					} catch {
						// ignore
					}
				}

				// Detect provider type from response data
				const paypalClientId = parsedData.paypalClientId as string | undefined;
				const paypalEnvironment = parsedData.paypalEnvironment as string | undefined;
				const stripePublishableKey = parsedData.stripePublishableKey as string | undefined;

				if (paypalClientId) {
					const paypalIntent = parsedData.paypalIntent as string | undefined;
					setProvider({
						type: "paypal",
						gatewayId: selectedConfig.id,
						paypalClientId,
						paypalEnvironment: (paypalEnvironment === "LIVE" ? "LIVE" : "SANDBOX") as "SANDBOX" | "LIVE",
						paypalIntent: (paypalIntent === "authorize" ? "authorize" : "capture") as "capture" | "authorize",
					});
				} else if (stripePublishableKey) {
					setProvider({
						type: "stripe",
						gatewayId: selectedConfig.id,
						publishableKey: stripePublishableKey,
					});
				} else {
					// Unknown provider — try to use as Stripe (backward compatible)
					const fallbackKey =
						(parsedData.publishableKey as string | undefined) ?? null;
					if (fallbackKey) {
						setProvider({
							type: "stripe",
							gatewayId: selectedConfig.id,
							publishableKey: fallbackKey,
						});
					} else {
						setLoadError("Payment configuration is missing. Please contact support.");
					}
				}
			} catch (err) {
				if (isMounted) {
					console.error("[PaymentStep] Gateway init error:", err);
					setLoadError("Failed to initialize payment system");
				}
			} finally {
				if (isMounted) setInitializing(false);
			}
		};

		void init();
		return () => {
			isMounted = false;
		};
	}, [checkoutId]);

	if (initializing) {
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

	if (loadError) {
		return (
			<div className="rounded-md border border-error-200 bg-error-50 px-4 py-3">
				<p className="text-sm text-error-700">{loadError}</p>
			</div>
		);
	}

	if (!provider) {
		return (
			<div className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3">
				<p className="text-sm text-warning-700">
					Payment configuration is missing. Please contact support.
				</p>
			</div>
		);
	}

	if (!checkout?.totalPrice) {
		return (
			<div className="py-4 text-center text-sm text-neutral-500">
				Loading checkout information…
			</div>
		);
	}

	return (
		<div data-cd="checkout-paymentStep" className={cdClasses} style={{ ...buildComponentStyle("checkout.paymentStep", cdStyle) }}>
			{provider.type === "stripe" && (
				<StripePaymentForm
					checkoutId={checkoutId}
					channel={channel}
					gatewayId={provider.gatewayId}
					publishableKey={provider.publishableKey}
					checkout={checkout}
				/>
			)}
			{provider.type === "paypal" && (
				<PayPalPaymentForm
					checkoutId={checkoutId}
					channel={channel}
					gatewayId={provider.gatewayId}
					paypalClientId={provider.paypalClientId}
					paypalEnvironment={provider.paypalEnvironment}
					paypalIntent={provider.paypalIntent}
					checkout={checkout}
				/>
			)}
		</div>
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
