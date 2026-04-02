/**
 * Server-only newsletter helpers (no client state / no DOM).
 * Used e.g. on registration to add user to subscriber list as inactive.
 */

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

/**
 * Add email to newsletter subscriber list as inactive (e.g. on registration).
 * User can activate later via account settings or homepage/footer signup.
 */
export async function subscribeToNewsletterInactive(
	email: string,
	channel: string
): Promise<void> {
	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail || !normalizedEmail.includes("@")) return;

	const saleorApiUrl =
		process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
	if (!saleorApiUrl) return;

	const graphqlUrl = saleorApiUrl.endsWith("/graphql/") || saleorApiUrl.endsWith("/graphql")
		? saleorApiUrl
		: `${saleorApiUrl.replace(/\/+$/, "")}/graphql/`;

	const res = await fetch(graphqlUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: NEWSLETTER_SUBSCRIBE_MUTATION,
			variables: {
				email: normalizedEmail,
				source: "registration",
				channel: channel || null,
				isActive: false,
			},
		}),
	});

	if (!res.ok) {
		throw new Error(`Newsletter subscribe failed: ${res.status}`);
	}

	const json = (await res.json()) as any;
	const data = json?.data?.newsletterSubscribe;
	if (data?.errors?.length) {
		throw new Error(data.errors[0].message || "Newsletter subscribe failed");
	}
}
