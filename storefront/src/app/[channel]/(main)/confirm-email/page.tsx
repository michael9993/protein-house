import { redirect } from "next/navigation";
import { executeGraphQL } from "@/lib/graphql";
import { ConfirmAccountDocument } from "@/gql/graphql";
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

	// If email and token are provided, confirm the account
	if (email && token) {
		try {
			const result = await executeGraphQL(ConfirmAccountDocument, {
				variables: { email, token },
				cache: "no-store",
			});

			if (result.confirmAccount?.errors && result.confirmAccount.errors.length > 0) {
				// Redirect to login with error message
				const errorMessage = result.confirmAccount.errors[0]?.message || "Invalid confirmation link";
				redirect(`/${channel}/login?error=${encodeURIComponent(errorMessage)}`);
			}

			// Account confirmed successfully
			// Redirect to login with success message
			redirect(`/${channel}/login?confirmed=true`);
		} catch (error) {
			console.error("[Confirm Email] Error:", error);
			redirect(`/${channel}/login?error=${encodeURIComponent("Failed to confirm account. Please try again.")}`);
		}
	}

	// If no email/token, show the confirmation form
	return <ConfirmEmailClient channel={channel} email={email} token={token} />;
}

