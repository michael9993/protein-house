"use server";

import { executeGraphQL } from "@/lib/graphql";
import { TransactionProcessDocument } from "@/gql/graphql";

interface ProcessTransactionResult {
	transactionId: string | null;
	data: unknown;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function processTransaction(
	transactionId: string,
	data?: unknown,
): Promise<ProcessTransactionResult> {
	const result = await executeGraphQL(TransactionProcessDocument, {
		variables: {
			id: transactionId,
			data: data ?? null,
		},
		revalidate: 0,
	});

	const tp = result.transactionProcess;
	const errors = (tp?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	return {
		transactionId: tp?.transaction?.id ?? null,
		data: tp?.data ?? null,
		errors,
	};
}
