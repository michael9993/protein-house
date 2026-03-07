"use client";

import { useEffect, useRef } from "react";
import { useCheckoutState, CheckoutStateProvider } from "./CheckoutStateProvider";
import { CheckoutTextProvider } from "./hooks/useCheckoutText";
import { trackBeginCheckout } from "@/lib/analytics";
import { CheckoutHeader } from "./components/CheckoutHeader";
import { CheckoutProgressBar } from "./components/CheckoutProgressBar";
import { CheckoutFooter } from "./components/CheckoutFooter";
import { AccordionStep } from "./components/AccordionStep";
import { CheckoutSummary } from "./summary/CheckoutSummary";
import { ContactStep, ContactSummary } from "./steps/ContactStep";
import { ShippingStep, ShippingSummary } from "./steps/ShippingStep";
import { DeliveryStep, DeliverySummary } from "./steps/DeliveryStep";
import { PaymentStep } from "./steps/PaymentStep";
import { useCheckoutText } from "./hooks/useCheckoutText";
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";
import {
	STEP_CONTACT,
	STEP_DELIVERY,
	STEP_PAYMENT,
	STEP_SHIPPING,
	type StepIndex,
} from "./types";

// ---------------------------------------------------------------------------
// Inner component — has access to CheckoutState context
// ---------------------------------------------------------------------------

interface CheckoutAccordionProps {
	channel: string;
	checkoutId: string;
}

function CheckoutAccordion({ channel, checkoutId }: CheckoutAccordionProps) {
	const { state, openStep, completeStepAndAdvance } = useCheckoutState();
	const t = useCheckoutText();
	const beginCheckoutTracked = useRef(false);

	const { activeStep, completedSteps, checkout } = state;

	// GA4 begin_checkout — fire once when checkout data first loads
	useEffect(() => {
		if (!checkout || beginCheckoutTracked.current) return;
		beginCheckoutTracked.current = true;

		const currency = checkout.totalPrice?.gross?.currency ?? "";
		const value = checkout.totalPrice?.gross?.amount ?? 0;
		const coupon = (checkout as { voucherCode?: string }).voucherCode ?? undefined;

		trackBeginCheckout({
			currency,
			value,
			coupon,
			items: (checkout.lines ?? []).map((line) => ({
				item_id: line.id,
				item_name: line.variant?.product?.name ?? "",
				price: line.unitPrice?.gross?.amount ?? 0,
				currency: line.unitPrice?.gross?.currency ?? currency,
				quantity: line.quantity,
			})),
		});
	}, [checkout]);

	function isCompleted(step: StepIndex) {
		return completedSteps.has(step);
	}

	function isLocked(step: StepIndex) {
		if (step === 0) return false;
		return Array.from({ length: step }, (_, i) => i).some((i) => !completedSteps.has(i));
	}

	// Build collapsed summaries from checkout data
	const contactSummary = checkout?.email ? (
		<ContactSummary email={checkout.email} />
	) : undefined;

	const shippingAddr = checkout?.shippingAddress;
	const shippingSummary = shippingAddr ? (
		<ShippingSummary
			address={{
				firstName: shippingAddr.firstName ?? "",
				lastName: shippingAddr.lastName ?? "",
				companyName: shippingAddr.companyName ?? "",
				streetAddress1: shippingAddr.streetAddress1 ?? "",
				streetAddress2: shippingAddr.streetAddress2 ?? "",
				city: shippingAddr.city ?? "",
				cityArea: shippingAddr.cityArea ?? "",
				countryCode: shippingAddr.country?.code ?? "",
				countryArea: shippingAddr.countryArea ?? "",
				postalCode: shippingAddr.postalCode ?? "",
				phone: shippingAddr.phone ?? "",
			}}
		/>
	) : undefined;

	const deliveryMethod = checkout?.deliveryMethod;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dm = deliveryMethod as any;
	const deliverySummary =
		dm?.name ? (
			<DeliverySummary
				methodName={dm.name}
				price={
					dm.price?.amount === 0
						? (t.freeShippingLabel ?? "Free")
						: `${dm.price?.amount?.toFixed(2) ?? ""} ${dm.price?.currency ?? ""}`
				}
			/>
		) : undefined;

	return (
		<div className="space-y-3" aria-live="polite" aria-atomic="false">
			{/* Step 0 — Contact */}
			<AccordionStep
				step={STEP_CONTACT}
				title={t.contactInfoTitle ?? "Contact"}
				isActive={activeStep === STEP_CONTACT}
				isCompleted={isCompleted(STEP_CONTACT)}
				isLocked={isLocked(STEP_CONTACT)}
				summary={contactSummary}
				onEdit={() => openStep(STEP_CONTACT)}
				editLabel={t.editAddressButton ?? "Edit"}
			>
				<ContactStep checkoutId={checkoutId} channel={channel} />
			</AccordionStep>

			{/* Step 1 — Shipping Address */}
			<AccordionStep
				step={STEP_SHIPPING}
				title={t.shippingAddressTitle ?? "Shipping Address"}
				isActive={activeStep === STEP_SHIPPING}
				isCompleted={isCompleted(STEP_SHIPPING)}
				isLocked={isLocked(STEP_SHIPPING)}
				summary={shippingSummary}
				onEdit={() => openStep(STEP_SHIPPING)}
				editLabel={t.editAddressButton ?? "Edit"}
			>
				<ShippingStep checkoutId={checkoutId} />
			</AccordionStep>

			{/* Step 2 — Delivery Methods */}
			<AccordionStep
				step={STEP_DELIVERY}
				title={t.deliveryMethodsTitle ?? "Delivery"}
				isActive={activeStep === STEP_DELIVERY}
				isCompleted={isCompleted(STEP_DELIVERY)}
				isLocked={isLocked(STEP_DELIVERY)}
				summary={deliverySummary}
				onEdit={() => openStep(STEP_DELIVERY)}
				editLabel={t.editAddressButton ?? "Edit"}
			>
				<DeliveryStep checkoutId={checkoutId} />
			</AccordionStep>

			{/* Step 3 — Payment */}
			<AccordionStep
				step={STEP_PAYMENT}
				title={t.paymentTitle ?? "Payment"}
				isActive={activeStep === STEP_PAYMENT}
				isCompleted={isCompleted(STEP_PAYMENT)}
				isLocked={isLocked(STEP_PAYMENT)}
				onEdit={() => openStep(STEP_PAYMENT)}
				editLabel={t.editAddressButton ?? "Edit"}
			>
				<PaymentStep checkoutId={checkoutId} channel={channel} />
			</AccordionStep>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Outer component — wraps providers
// ---------------------------------------------------------------------------

interface CheckoutPageProps {
	channel: string;
	checkoutId?: string;
	initialCheckout?: CheckoutFragment | null;
	checkoutText?: CheckoutTextConfig;
}

export function CheckoutPageV2({
	channel,
	checkoutId,
	initialCheckout,
	checkoutText,
}: CheckoutPageProps) {
	if (!checkoutId) {
		// No checkout ID — page.tsx handles empty state before rendering this
		return null;
	}

	return (
		<CheckoutStateProvider initialCheckout={initialCheckout}>
			<CheckoutTextProvider config={checkoutText}>
				<div data-cd="checkout-page" className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white print:bg-white">
					<section className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 py-6 sm:px-8">
						<CheckoutHeader channel={channel} />
						<CheckoutProgressBar />

						{/* Two-column layout on large screens */}
						<div className="mt-8 flex flex-1 flex-col gap-8 lg:flex-row lg:items-start">
							{/* Left column — accordion steps */}
							<main className="flex-1" id="checkout-main">
								<CheckoutAccordion channel={channel} checkoutId={checkoutId} />
							</main>

							{/* Right column — order summary (sticky on large screens) */}
							<div className="w-full lg:sticky lg:top-8 lg:w-80 xl:w-96">
								<CheckoutSummary channel={channel} />
							</div>
						</div>

						<CheckoutFooter channel={channel} />
					</section>
				</div>
			</CheckoutTextProvider>
		</CheckoutStateProvider>
	);
}
