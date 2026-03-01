"use server";

import { executeGraphQL } from "@/lib/graphql";
import { PaymentGatewayInitializeDocument } from "@/gql/graphql";

export async function initializePaymentGateway(checkoutId: string) {
	const result = await executeGraphQL(PaymentGatewayInitializeDocument, {
		variables: { checkoutId, paymentGateways: [] },
		revalidate: 0,
	});
	return result.paymentGatewayInitialize ?? null;
}
