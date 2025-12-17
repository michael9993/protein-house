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

	// delivery methods change total price so we want to wait until the change is done
	if (changingBillingCountry || fetching || checkoutDeliveryMethodUpdate === "loading") {
		return <PaymentSectionSkeleton />;
	}

	return (
		<div className="gap-y-8">
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
	);
};
