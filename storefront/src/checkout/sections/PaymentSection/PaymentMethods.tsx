import { useMemo } from "react";
import { paymentMethodToComponent, getPaymentComponent } from "./supportedPaymentApps";
import { PaymentSectionSkeleton } from "@/checkout/sections/PaymentSection/PaymentSectionSkeleton";
import { usePayments } from "@/checkout/sections/PaymentSection/usePayments";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";

export const PaymentMethods = () => {
	const { availablePaymentGateways, fetching } = usePayments();
	const {
		changingBillingCountry,
		updateState: { checkoutDeliveryMethodUpdate },
	} = useCheckoutUpdateState();

	const gatewaysWithDefinedComponent = useMemo(
		() => availablePaymentGateways.filter((gateway) => {
			// Check if gateway has a component (direct match or flexible Stripe matching)
			return gateway.id in paymentMethodToComponent || getPaymentComponent(gateway.id) !== undefined;
		}),
		[availablePaymentGateways],
	);

	// Show skeleton only when we have no gateways yet (initial load or billing country change)
	// For delivery method updates, keep Stripe mounted to prevent iframe destruction
	if (changingBillingCountry || (fetching && gatewaysWithDefinedComponent.length === 0)) {
		return <PaymentSectionSkeleton />;
	}

	const isUpdating = checkoutDeliveryMethodUpdate === "loading" || fetching;

	return (
		<div className="relative min-h-[120px]">
			{/* Loading overlay — keeps Stripe mounted underneath */}
			{isUpdating && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60">
					<div className="flex items-center gap-2 text-sm" style={{ color: "var(--store-text-muted)" }}>
						<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Updating...
					</div>
				</div>
			)}
			<div style={isUpdating ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
				{gatewaysWithDefinedComponent.map((gateway) => {
					// Try direct lookup first, then flexible matching
					const Component = paymentMethodToComponent[gateway.id as keyof typeof paymentMethodToComponent] || getPaymentComponent(gateway.id);

					if (!Component) {
						return null;
					}

					return (
						<Component
							key={gateway.id}
							// @ts-expect-error -- gateway matches the id but TypeScript doesn't know that
							config={gateway}
						/>
					);
				})}
			</div>
		</div>
	);
};
