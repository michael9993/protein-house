"use server";

import { getServerAuthClient } from "@/app/config";

const PASSWORD_CHANGE_MUTATION = `
  mutation PasswordChange($oldPassword: String!, $newPassword: String!) {
    passwordChange(oldPassword: $oldPassword, newPassword: $newPassword) {
      user { id }
      errors { field message code }
    }
  }
`;

const ACCOUNT_UPDATE_MUTATION = `
  mutation AccountUpdate($input: AccountInput!) {
    accountUpdate(input: $input) {
      user { id firstName lastName email }
      errors { field message code }
    }
  }
`;

const REQUEST_EMAIL_CHANGE_MUTATION = `
  mutation RequestEmailChange($newEmail: String!, $password: String!, $redirectUrl: String!, $channel: String) {
    requestEmailChange(newEmail: $newEmail, password: $password, redirectUrl: $redirectUrl, channel: $channel) {
      user { id email }
      errors { field message code }
    }
  }
`;

const NEWSLETTER_STATUS_QUERY = `
  query NewsletterSubscriptionStatus($email: String!) {
    newsletterSubscriptionStatus(email: $email) {
      email
      isActive
    }
  }
`;

const NEWSLETTER_SUBSCRIBE_MUTATION = `
  mutation NewsletterSubscribe($email: String!, $source: String, $channel: String, $isActive: Boolean) {
    newsletterSubscribe(email: $email, source: $source, channel: $channel, isActive: $isActive) {
      subscribed
      alreadySubscribed
      wasReactivated
      errors {
        field
        message
        code
      }
    }
  }
`;

const NEWSLETTER_UNSUBSCRIBE_MUTATION = `
  mutation NewsletterUnsubscribe($email: String!) {
    newsletterUnsubscribe(email: $email) {
      unsubscribed
      errors {
        field
        message
        code
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
 * Get newsletter subscription status for the given email (must be current user's email; enforced by Saleor).
 */
export async function getNewsletterStatus(
	email: string
): Promise<{ isActive: boolean } | null> {
	const normalized = email?.trim().toLowerCase();
	if (!normalized || !normalized.includes("@")) return null;
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		const res = await authClient.fetchWithAuth(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: NEWSLETTER_STATUS_QUERY,
				variables: { email: normalized },
			}),
		}, { allowPassingTokenToThirdPartyDomains: true });
		if (!res.ok) return null;
		const json = (await res.json()) as any;
		const node = json?.data?.newsletterSubscriptionStatus;
		if (!node) return null;
		return { isActive: !!node.isActive };
	} catch {
		return null;
	}
}

/**
 * Set newsletter subscription active state (toggle in account settings).
 * Activates via newsletterSubscribe(..., isActive: true), deactivates via newsletterUnsubscribe.
 */
export async function setNewsletterActive(
	email: string,
	active: boolean,
	channel: string
): Promise<{ success: boolean; error?: string }> {
	const normalized = email?.trim().toLowerCase();
	if (!normalized || !normalized.includes("@")) {
		return { success: false, error: "Invalid email" };
	}
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		if (active) {
			const res = await authClient.fetchWithAuth(graphqlUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: NEWSLETTER_SUBSCRIBE_MUTATION,
					variables: {
						email: normalized,
						source: "settings",
						channel: channel || null,
						isActive: true,
					},
				}),
			}, { allowPassingTokenToThirdPartyDomains: true });
			const json = (await res.json()) as any;
			const data = json?.data?.newsletterSubscribe;
			if (data?.errors?.length) {
				return { success: false, error: data.errors[0].message };
			}
			return { success: !!data?.subscribed };
		} else {
			const res = await authClient.fetchWithAuth(graphqlUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: NEWSLETTER_UNSUBSCRIBE_MUTATION,
					variables: { email: normalized },
				}),
			}, { allowPassingTokenToThirdPartyDomains: true });
			const json = (await res.json()) as any;
			const data = json?.data?.newsletterUnsubscribe;
			if (data?.errors?.length) {
				return { success: false, error: data.errors[0].message };
			}
			return { success: !!data?.unsubscribed };
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}

/**
 * Change the authenticated user's password (Saleor passwordChange mutation).
 */
export async function changePassword(
	oldPassword: string,
	newPassword: string
): Promise<{ success: boolean; error?: string }> {
	const trimmedOld = oldPassword?.trim();
	const trimmedNew = newPassword?.trim();
	if (!trimmedOld || !trimmedNew) {
		return { success: false, error: "Current password and new password are required." };
	}
	if (trimmedNew.length < 8) {
		return { success: false, error: "New password must be at least 8 characters." };
	}
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		const res = await authClient.fetchWithAuth(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: PASSWORD_CHANGE_MUTATION,
				variables: { oldPassword: trimmedOld, newPassword: trimmedNew },
			}),
		}, { allowPassingTokenToThirdPartyDomains: true });
		if (!res.ok) {
			return { success: false, error: "Request failed. Please try again." };
		}
		const json = (await res.json()) as {
			data?: { passwordChange?: { user?: unknown; errors?: Array<{ message?: string }> } };
			errors?: Array<{ message?: string }>;
		};
		const gqlErrors = json.errors;
		if (gqlErrors?.length) {
			return { success: false, error: gqlErrors[0].message ?? "Request failed." };
		}
		const data = json.data?.passwordChange;
		const accountErrors = data?.errors;
		if (accountErrors?.length) {
			return { success: false, error: accountErrors[0].message ?? "Password change failed." };
		}
		if (data?.user) {
			return { success: true };
		}
		return { success: false, error: "Password change failed." };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}

/**
 * Update authenticated user's first name and last name (Saleor accountUpdate).
 * Does not change email; use requestEmailChange for that.
 */
export async function updateProfile(
	firstName: string,
	lastName: string
): Promise<{ success: boolean; error?: string }> {
	const trimmedFirst = firstName?.trim() ?? "";
	const trimmedLast = lastName?.trim() ?? "";
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		const res = await authClient.fetchWithAuth(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: ACCOUNT_UPDATE_MUTATION,
				variables: {
					input: { firstName: trimmedFirst || null, lastName: trimmedLast || null },
				},
			}),
		}, { allowPassingTokenToThirdPartyDomains: true });
		if (!res.ok) return { success: false, error: "Request failed. Please try again." };
		const json = (await res.json()) as {
			data?: { accountUpdate?: { user?: unknown; errors?: Array<{ message?: string }> } };
			errors?: Array<{ message?: string }>;
		};
		if (json.errors?.length) return { success: false, error: json.errors[0].message ?? "Request failed." };
		const data = json.data?.accountUpdate;
		if (data?.errors?.length) return { success: false, error: data.errors[0].message ?? "Update failed." };
		if (data?.user) return { success: true };
		return { success: false, error: "Update failed." };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}

/**
 * Request email change: sends confirmation to the new email; user must click link to confirm.
 * Saleor sends an email with a link that includes a token; our confirm-email-change page handles the token.
 */
const ACCOUNT_REQUEST_DELETION_MUTATION = `
  mutation AccountRequestDeletion($redirectUrl: String!, $channel: String) {
    accountRequestDeletion(redirectUrl: $redirectUrl, channel: $channel) {
      errors {
        field
        code
        message
      }
    }
  }
`;

/**
 * Request account deletion: Saleor sends a confirmation email with a token link.
 * The user must click the link to confirm deletion (2-step GDPR process).
 */
export async function requestAccountDeletion(
	redirectUrl: string,
	channel: string
): Promise<{ success: boolean; error?: string }> {
	if (!redirectUrl?.trim()) {
		return { success: false, error: "Redirect URL is required." };
	}
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		const res = await authClient.fetchWithAuth(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: ACCOUNT_REQUEST_DELETION_MUTATION,
				variables: {
					redirectUrl: redirectUrl.trim(),
					channel: channel || null,
				},
			}),
		}, { allowPassingTokenToThirdPartyDomains: true });
		if (!res.ok) return { success: false, error: "Request failed. Please try again." };
		const json = (await res.json()) as {
			data?: { accountRequestDeletion?: { errors?: Array<{ message?: string }> } };
			errors?: Array<{ message?: string }>;
		};
		if (json.errors?.length) {
			return { success: false, error: json.errors[0].message ?? "Request failed." };
		}
		const data = json.data?.accountRequestDeletion;
		if (data?.errors?.length) {
			return { success: false, error: data.errors[0].message ?? "Account deletion request failed." };
		}
		return { success: true };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}

export async function requestEmailChange(
	newEmail: string,
	password: string,
	channel: string
): Promise<{ success: boolean; error?: string }> {
	const trimmed = newEmail?.trim().toLowerCase();
	if (!trimmed || !trimmed.includes("@")) {
		return { success: false, error: "Please enter a valid email address." };
	}
	if (!password?.trim()) {
		return { success: false, error: "Password is required to change email." };
	}
	const origin = process.env.NEXT_PUBLIC_STOREFRONT_URL
		? process.env.NEXT_PUBLIC_STOREFRONT_URL.replace(/\/$/, "")
		: process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`.replace(/\/$/, "")
			: "";
	const redirectUrl = origin
		? `${origin}/${channel}/confirm-email-change`
		: `${process.env.NEXT_PUBLIC_STORE_URL || ""}/${channel}/confirm-email-change`.replace(/\/$/, "");
	try {
		const authClient = await getServerAuthClient();
		const graphqlUrl = getGraphqlUrl();
		const res = await authClient.fetchWithAuth(graphqlUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: REQUEST_EMAIL_CHANGE_MUTATION,
				variables: {
					newEmail: trimmed,
					password: password.trim(),
					redirectUrl,
					channel: channel || null,
				},
			}),
		}, { allowPassingTokenToThirdPartyDomains: true });
		if (!res.ok) return { success: false, error: "Request failed. Please try again." };
		const json = (await res.json()) as {
			data?: { requestEmailChange?: { user?: unknown; errors?: Array<{ message?: string }> } };
			errors?: Array<{ message?: string }>;
		};
		if (json.errors?.length) return { success: false, error: json.errors[0].message ?? "Request failed." };
		const data = json.data?.requestEmailChange;
		if (data?.errors?.length) return { success: false, error: data.errors[0].message ?? "Email change failed." };
		if (data?.user) return { success: true };
		return { success: false, error: "Email change request failed." };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Request failed";
		return { success: false, error: msg };
	}
}
