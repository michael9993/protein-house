import { AdyenDropIn } from "./AdyenDropIn/AdyenDropIn";
import { adyenGatewayId } from "./AdyenDropIn/types";
import { DummyComponent } from "./DummyDropIn/dummyComponent";
import { dummyGatewayId } from "./DummyDropIn/types";
import { StripeComponent } from "./StripeV2DropIn/stripeComponent";
import { stripeV2GatewayId } from "./StripeV2DropIn/types";

/**
 * Check if a gateway ID is a Stripe gateway (supports multiple ID formats)
 */
const isStripeGatewayId = (id: string): boolean => {
	return (
		id === stripeV2GatewayId ||
		id === "app:stripe:stripe" ||
		id === "app.stripe.stripe" ||
		id === "stripe" || // Raw ID from webhook (before Saleor transformation)
		id.startsWith("app:stripe:") ||
		id.startsWith("app.stripe.")
	);
};

export const paymentMethodToComponent = {
	[adyenGatewayId]: AdyenDropIn,
	[stripeV2GatewayId]: StripeComponent,
	[dummyGatewayId]: DummyComponent,
} as const;

/**
 * Get the component for a payment gateway ID
 * Supports flexible Stripe gateway ID matching
 */
export const getPaymentComponent = (gatewayId: string) => {
	// Direct lookup first
	if (gatewayId in paymentMethodToComponent) {
		return paymentMethodToComponent[gatewayId as keyof typeof paymentMethodToComponent];
	}
	
	// Flexible Stripe matching
	if (isStripeGatewayId(gatewayId)) {
		return StripeComponent;
	}
	
	return undefined;
};
