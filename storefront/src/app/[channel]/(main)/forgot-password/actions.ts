"use server";

const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation requestPasswordReset($email: String!, $channel: String!, $redirectUrl: String!) {
    requestPasswordReset(email: $email, channel: $channel, redirectUrl: $redirectUrl) {
      errors {
        message
        field
        code
      }
    }
  }
`;

export type RequestPasswordResetResult = { success: true } | { error: string };

export async function requestPasswordResetAction(
	email: string,
	channel: string,
	redirectUrl: string,
): Promise<RequestPasswordResetResult> {
	if (!email?.trim()) {
		return { error: "Email is required" };
	}
	if (!redirectUrl?.startsWith("http")) {
		return { error: "Invalid redirect URL" };
	}

	const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
	if (!apiUrl) {
		return { error: "Server configuration error. Please try again later." };
	}

	try {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: REQUEST_PASSWORD_RESET_MUTATION,
				variables: { email: email.trim(), channel, redirectUrl },
			}),
		});

		const result = (await response.json()) as {
			data?: { requestPasswordReset?: { errors?: Array<{ message?: string; field?: string; code?: string }> } };
			errors?: Array<{ message?: string }>;
		};

		if (result.errors?.length) {
			return { error: "Something went wrong. Please try again later." };
		}

		const errors = result.data?.requestPasswordReset?.errors;
		if (errors?.length) {
			// Do not reveal whether the email exists; Saleor may still return success when user not found
			return { success: true };
		}

		return { success: true };
	} catch (err) {
		console.error("[forgot-password] requestPasswordReset failed:", err);
		return { error: "Something went wrong. Please try again later." };
	}
}
