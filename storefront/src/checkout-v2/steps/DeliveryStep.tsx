"use client";

import { useState, useTransition, useEffect } from "react";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { ShippingMethodCard } from "../components/ShippingMethodCard";
import { FreeShippingIndicator } from "../components/FreeShippingIndicator";
import { useAdjustedShippingMethods } from "../hooks/useAdjustedShippingMethods";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";
import { updateDeliveryMethod } from "../_actions/update-delivery-method";
import { STEP_DELIVERY } from "../types";

interface DeliveryStepProps {
	checkoutId: string;
}

export function DeliveryStep({ checkoutId }: DeliveryStepProps) {
	const { state, setCheckout, completeStepAndAdvance, setMutating, clearStepErrors } = useCheckoutState();
	const t = useCheckoutText();
	const checkout = state.checkout;
	const stepErrors = state.stepErrors.get(STEP_DELIVERY) ?? [];

	// Determine current delivery method ID (union ShippingMethod | Warehouse, both have id)
	const selectedId = checkout?.deliveryMethod
		? (checkout.deliveryMethod as { id: string }).id
		: null;

	const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedId);
	const [fieldError, setFieldError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Sync localSelectedId when the checkout's delivery method changes externally
	// (includes clearing to null when the selected method becomes unavailable)
	useEffect(() => {
		if (selectedId !== localSelectedId) {
			setLocalSelectedId(selectedId);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedId]);

	const ecommerce = useEcommerceSettings();
	const showOriginalPrice = ecommerce?.shipping?.showOriginalPrice !== false;
	const rawMethods = checkout?.shippingMethods ?? [];
	const subtotal = checkout?.subtotalPrice?.gross?.amount ?? 0;
	const methods = useAdjustedShippingMethods(
		rawMethods.map((m) => ({
			id: m.id,
			name: m.name,
			price: { amount: m.price.amount, currency: m.price.currency },
			minimumDeliveryDays: m.minimumDeliveryDays ?? null,
			maximumDeliveryDays: m.maximumDeliveryDays ?? null,
		})),
		subtotal,
		checkout?.metadata,
	);

	function handleContinue() {
		if (!localSelectedId) {
			setFieldError(t.selectDeliveryMethodError ?? "Please select a delivery method");
			return;
		}

		setFieldError(null);
		setMutating("delivery");

		startTransition(async () => {
			const result = await updateDeliveryMethod(checkoutId, localSelectedId);

			if (result.errors.length > 0) {
				setFieldError(result.errors.map((e) => e.message ?? e.code).join("; "));
				setMutating(null);
				return;
			}

			if (result.checkout && checkout) {
				setCheckout({
					...checkout,
					deliveryMethod: result.checkout.shippingMethod
						? { __typename: "ShippingMethod" as const, id: result.checkout.shippingMethod.id }
						: null,
					shippingPrice: result.checkout.shippingPrice,
					totalPrice: {
						...checkout.totalPrice,
						gross: result.checkout.totalPrice.gross,
					},
				});
			}

			setMutating(null);
			completeStepAndAdvance(STEP_DELIVERY);
		});
	}

	if (methods.length === 0) {
		return (
			<div className="rounded-lg bg-warning-50 p-4 text-sm text-warning-700">
				{t.noShippingMethodsAvailable ??
					"No shipping methods available for this address. Please try a different shipping address."}
			</div>
		);
	}

	return (
		<div data-cd="checkout-deliveryStep" className="space-y-4">
			{stepErrors.length > 0 && (
				<div role="alert" className="flex items-start gap-2 rounded-lg bg-warning-50 p-3">
					<svg className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<p className="text-sm text-warning-700">{stepErrors[0]}</p>
				</div>
			)}

			<p className="text-sm text-neutral-500">
				{t.deliveryMethodsSubtitle ?? "Choose shipping speed"}
			</p>

			<div
				className="space-y-2"
				role="radiogroup"
				aria-label={t.deliveryMethodsTitle ?? "Delivery"}
			>
				{methods.map((method) => (
					<ShippingMethodCard
						key={method.id}
						method={method}
						isSelected={localSelectedId === method.id}
						showOriginalPrice={showOriginalPrice}
						onChange={(id) => {
							setLocalSelectedId(id);
							setFieldError(null);
							if (stepErrors.length > 0) clearStepErrors(STEP_DELIVERY);
						}}
					/>
				))}
			</div>

			<FreeShippingIndicator
				subtotalAmount={checkout?.subtotalPrice?.gross?.amount ?? 0}
				currency={checkout?.subtotalPrice?.gross?.currency ?? ""}
				methods={methods}
				selectedMethodId={localSelectedId}
			/>

			{fieldError && (
				<p role="alert" className="text-sm text-error-600">
					{fieldError}
				</p>
			)}

			<button
				type="button"
				onClick={handleContinue}
				disabled={isPending}
				className="w-full rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
			>
				{isPending ? (t.processingText ?? "Processing…") : (t.continueButtonText ?? "Continue")}
			</button>
		</div>
	);
}

/** Collapsed summary shown in the AccordionStep header */
export function DeliverySummary({ methodName, price }: { methodName: string; price: string }) {
	return (
		<span className="truncate">
			{methodName} · {price}
		</span>
	);
}
