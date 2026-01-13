import { ConfirmEmailClient } from "./ConfirmEmailClient";

export const metadata = {
	title: "Confirm Your Email | SportZone",
	description: "Confirm your email address to activate your account.",
};

export default async function ConfirmEmailPage({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ email?: string; token?: string }>;
}) {
	const { channel } = await params;
	const { email, token } = await searchParams;

	// If email and token are provided, try to confirm the account on the server
	// However, we'll let the client handle it to show better error messages
	// The server-side confirmation can fail silently, so we'll pass through to client
	if (email && token) {
		// Decode URL parameters (they might be encoded)
		const decodedEmail = decodeURIComponent(email);
		const decodedToken = decodeURIComponent(token);
		
		// Pass decoded values to client component
		return <ConfirmEmailClient channel={channel} email={decodedEmail} token={decodedToken} />;
	}

	// If no email/token, show the confirmation form
	return <ConfirmEmailClient channel={channel} email={email} token={token} />;
}

