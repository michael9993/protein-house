"use server";

const CONFIRM_EMAIL_CHANGE_MUTATION = `
  mutation ConfirmEmailChange($token: String!, $channel: String) {
    confirmEmailChange(token: $token, channel: $channel) {
      user { id email }
      errors { field message code }
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
 * Confirm email change with token from the link Saleor sent to the new email.
 * Called without auth - the token proves the request.
 */
export async function confirmEmailChange(
	token: string,
	channel: string
): Promise<{ success: boolean; error?: string }> {
	const t = token?.trim();
	if (!t) return { success: false, error: "Invalid or missing token." };
	try {
		const graphqlUrl = getGraphqlUrl();
		const res = await fetch(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: CONFIRM_EMAIL_CHANGE_MUTATION,
				variables: { token: t, channel: channel || null },
			}),
		});
		if (!res.ok) return { success: false, error: "Request failed. Please try again." };
		const json = (await res.json()) as {
			data?: { confirmEmailChange?: { user?: unknown; errors?: Array<{ message?: string }> } };
			errors?: Array<{ message?: string }>;
		};
		if (json.errors?.length) return { success: false, error: json.errors[0].message ?? "Request failed." };
		const data = json.data?.confirmEmailChange;
		if (data?.errors?.length) return { success: false, error: data.errors[0].message ?? "Confirmation failed." };
		if (data?.user) return { success: true };
		return { success: false, error: "Confirmation failed." };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}
