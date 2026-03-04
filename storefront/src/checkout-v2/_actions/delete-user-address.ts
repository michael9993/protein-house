"use server";

import { executeGraphQL } from "@/lib/graphql";
import { AccountAddressDeleteDocument } from "@/gql/graphql";

interface DeleteUserAddressResult {
	success: boolean;
	errors: { field: string | null; message: string | null; code: string }[];
}

/**
 * Delete an address from the user's account.
 */
export async function deleteUserAddress(
	addressId: string,
): Promise<DeleteUserAddressResult> {
	const result = await executeGraphQL(AccountAddressDeleteDocument, {
		variables: { id: addressId },
		revalidate: 0,
	});

	const data = result.accountAddressDelete;
	const errors = (data?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	return {
		success: errors.length === 0 && !!data?.address,
		errors,
	};
}
