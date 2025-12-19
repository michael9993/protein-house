"use server";

import { executeGraphQL } from "@/lib/graphql";
import { ConfirmAccountDocument } from "@/gql/graphql";

export async function confirmAccountAction(email: string, token: string) {
	try {
		const result = await executeGraphQL(ConfirmAccountDocument, {
			variables: { email, token },
			cache: "no-store",
		});

		if (result.confirmAccount?.errors && result.confirmAccount.errors.length > 0) {
			const errorMessage = result.confirmAccount.errors[0]?.message || "Invalid confirmation link";
			return { success: false, error: errorMessage };
		}

		return { 
			success: true, 
			isConfirmed: result.confirmAccount?.user?.isConfirmed || false,
		};
	} catch (error) {
		console.error("[Confirm Account Action] Error:", error);
		return { 
			success: false, 
			error: "Failed to confirm account. Please try again." 
		};
	}
}

