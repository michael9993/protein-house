"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CheckoutEmailUpdateDocument } from "@/gql/graphql";

interface UpdateEmailInput {
	checkoutId: string;
	email: string;
}

interface UpdateEmailResult {
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function updateEmail({ checkoutId, email }: UpdateEmailInput): Promise<UpdateEmailResult> {
	const result = await executeGraphQL(CheckoutEmailUpdateDocument, {
		variables: { id: checkoutId, email },
		revalidate: 0,
	});

	const errors = (result.checkoutEmailUpdate?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));
	return { errors };
}
