"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	AccountSetDefaultAddressDocument,
	AddressTypeEnum,
} from "@/gql/graphql";

export async function setDefaultAddress(
	addressId: string,
	type: "SHIPPING" | "BILLING",
) {
	const result = await executeGraphQL(AccountSetDefaultAddressDocument, {
		variables: { id: addressId, type: type as AddressTypeEnum },
		revalidate: 0,
	});

	const data = result.accountSetDefaultAddress;
	const errors = (data?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	return { success: errors.length === 0, errors };
}
