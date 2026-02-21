import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { VerifyEmailClient } from "./VerifyEmailClient";

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const storeName = config.store?.name || "Store";
	const verifyTitle = config.content?.account?.verifyEmailTitle || "Verify Your Email";
	return {
		title: `${verifyTitle} | ${storeName}`,
		description: "Please verify your email address to complete your registration.",
		robots: { index: false, follow: false },
	};
}

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

