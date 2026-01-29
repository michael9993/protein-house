import { redirect } from "next/navigation";
import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { isAuthOrRscContextError } from "@/lib/auth-errors";
import { LoginClient } from "./LoginClient";

export const metadata = {
	title: "Sign In | SportZone",
	description: "Sign in to your SportZone account to access your orders, wishlist, and more.",
};

export default async function LoginPage({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ redirect?: string; error?: string; confirmed?: string; email?: string; resend?: string }>;
}) {
	const { channel } = await params;
	const { redirect: redirectPath, error, confirmed, email, resend } = await searchParams;

	let user: Awaited<ReturnType<typeof executeGraphQL<typeof CurrentUserDocument>>>["me"] = null;
	try {
		const result = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		user = result.me;
	} catch (e) {
		if (isAuthOrRscContextError(e)) {
			user = null;
		} else {
			throw e;
		}
	}

	if (user) {
		// If user is logged in and resend was requested, redirect to verify-email to trigger resend
		if (resend === "true" && email) {
			redirect(`/${channel}/verify-email?email=${encodeURIComponent(email)}&autoResend=true`);
		}
		redirect(redirectPath || `/${channel}`);
	}

	return <LoginClient channel={channel} redirectUrl={redirectPath} initialError={error} confirmed={!!confirmed} initialEmail={email} autoResend={resend === "true"} />;
}
