"use server";

import { getServerAuthClient } from "@/app/config";

const ACCOUNT_CONFIRM_DELETION_MUTATION = `
  mutation AccountConfirmDeletion($token: String!) {
    accountDelete(token: $token) {
      errors {
        field
        code
        message
      }
    }
  }
`;

function getGraphqlUrl(): string {
	const url =
		process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
	if (!url) throw new Error("Missing SALEOR_API_URL");
	return url.endsWith("/graphql/") || url.endsWith("/graphql")
		? url
		: `${url.replace(/\/+$/, "")}/graphql/`;
}

/**
 * Confirm account deletion using the token from the email link.
 * This is the second step of the GDPR 2-step deletion process.
 * The user clicked the link in their email, which brings them to the
 * delete-confirm page with a token in the URL query params.
 */
export async function confirmAccountDeletion(
	token: string
): Promise<{ success: boolean; error?: string }> {
	const trimmedToken = token?.trim();
	if (!trimmedToken) {
		return { success: false, error: "Token is required." };
	}
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		const res = await authClient.fetchWithAuth(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: ACCOUNT_CONFIRM_DELETION_MUTATION,
				variables: { token: trimmedToken },
			}),
		}, { allowPassingTokenToThirdPartyDomains: true });
		if (!res.ok) {
			return { success: false, error: "Request failed. Please try again." };
		}
		const json = (await res.json()) as {
			data?: {
				accountDelete?: {
					errors?: Array<{ message?: string; code?: string }>;
				};
			};
			errors?: Array<{ message?: string }>;
		};
		if (json.errors?.length) {
			return {
				success: false,
				error: json.errors[0].message ?? "Request failed.",
			};
		}
		const data = json.data?.accountDelete;
		if (data?.errors?.length) {
			return {
				success: false,
				error:
					data.errors[0].message ?? "Account deletion failed.",
			};
		}
		return { success: true };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}
