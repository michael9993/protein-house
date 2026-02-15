import { compact } from "lodash-es";
import { stripeV2GatewayId } from "./StripeV2DropIn/types";
import {
	type CheckoutAuthorizeStatusEnum,
	type CheckoutChargeStatusEnum,
	type OrderAuthorizeStatusEnum,
	type OrderChargeStatusEnum,
	type PaymentGateway,
} from "@/checkout/graphql";
import { type MightNotExist } from "@/checkout/lib/globalTypes";
import { getUrl, type ParamBasicValue } from "@/checkout/lib/utils/url";
import { type PaymentStatus } from "@/checkout/sections/PaymentSection/types";

export const supportedPaymentGateways = [stripeV2GatewayId] as const;

/**
 * Check if a gateway ID matches Stripe (supports multiple ID formats)
 */
const isStripeGateway = (id: string): boolean => {
	// Support both old format (saleor.app.payment.stripe) and new format (app:stripe:stripe or app.stripe.stripe)
	// Also support raw "stripe" ID that Saleor might return before transformation
	return (
		id === stripeV2GatewayId ||
		id === "app:stripe:stripe" ||
		id === "app.stripe.stripe" ||
		id === "stripe" || // Raw ID from webhook (before Saleor transformation)
		id.startsWith("app:stripe:") ||
		id.startsWith("app.stripe.")
	);
};

export const getFilteredPaymentGateways = (
	paymentGateways: MightNotExist<PaymentGateway[]>,
): PaymentGateway[] => {
	if (!paymentGateways) {
		return [];
	}

	// we want to use only payment apps, not plugins
	return compact(paymentGateways).filter(({ id }) => {
		// Check if it's in the supported list OR if it's a Stripe gateway (flexible matching)
		return supportedPaymentGateways.includes(id) || isStripeGateway(id);
	});
};

export const getUrlForTransactionInitialize = (extraQuery?: Record<string, ParamBasicValue>) =>
	getUrl({
		query: {
			processingPayment: true,
			...extraQuery,
		},
	});

export const usePaymentStatus = ({
	chargeStatus,
	authorizeStatus,
}: {
	chargeStatus: CheckoutChargeStatusEnum | OrderChargeStatusEnum;
	authorizeStatus: CheckoutAuthorizeStatusEnum | OrderAuthorizeStatusEnum;
}): PaymentStatus => {
	if (chargeStatus === "NONE" && authorizeStatus === "FULL") {
		return "authorized";
	}

	if (chargeStatus === "FULL") {
		return "paidInFull";
	}

	if (chargeStatus === "OVERCHARGED") {
		return "overpaid";
	}

	return "none";
};
