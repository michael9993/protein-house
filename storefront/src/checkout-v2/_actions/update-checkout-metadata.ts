"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CheckoutMetadataUpdateDocument } from "@/gql/graphql";

export async function updateCheckoutMetadata(
	checkoutId: string,
	metadata: Array<{ key: string; value: string }>,
): Promise<{ errors: { message: string }[] }> {
	const result = await executeGraphQL(CheckoutMetadataUpdateDocument, {
		variables: { id: checkoutId, input: metadata },
		revalidate: 0,
	});

	const errors = (result.updateMetadata?.errors ?? []).map((e) => ({
		message: e.message ?? "Unknown error",
	}));

	return { errors };
}
