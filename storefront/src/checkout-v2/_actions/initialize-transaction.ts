"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	TransactionInitializeDocument,
	type TransactionFlowStrategyEnum,
} from "@/gql/graphql";

interface InitializeTransactionResult {
	transactionId: string | null;
	/** Raw JSON data returned by the payment app (e.g. Stripe clientSecret) */
	data: unknown;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function initializeTransaction(
	checkoutId: string,
	{
		gatewayId,
		paymentMethod,
		amount,
		action,
	}: {
		gatewayId: string;
		paymentMethod?: string;
		amount?: number;
		action?: TransactionFlowStrategyEnum;
	},
): Promise<InitializeTransactionResult> {
	const result = await executeGraphQL(TransactionInitializeDocument, {
		variables: {
			checkoutId,
			paymentGateway: {
				id: gatewayId,
				data: paymentMethod ? { paymentIntent: { paymentMethod } } : undefined,
			},
			...(amount !== undefined && { amount }),
			...(action !== undefined && { action }),
		},
		revalidate: 0,
	});

	const ti = result.transactionInitialize;
	const errors = (ti?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	return {
		transactionId: ti?.transaction?.id ?? null,
		data: ti?.data ?? null,
		errors,
	};
}
