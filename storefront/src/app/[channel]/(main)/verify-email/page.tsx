import { VerifyEmailClient } from "./VerifyEmailClient";

export const metadata = {
	title: "Verify Your Email | SportZone",
	description: "Please verify your email address to complete your registration.",
};

export default async function VerifyEmailPage({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ email?: string; autoResend?: string }>;
}) {
	const { channel } = await params;
	const { email, autoResend } = await searchParams;

	// Decode email in case it's URL-encoded
	const decodedEmail = email ? decodeURIComponent(email) : "";

	return <VerifyEmailClient channel={channel} email={decodedEmail} autoResend={autoResend === "true"} />;
}

