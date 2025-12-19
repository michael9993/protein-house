import { redirect } from "next/navigation";

/**
 * OAuth Callback Page
 * This page is deprecated - OAuth callbacks are now handled by API routes:
 * - /api/auth/google/callback
 * - /api/auth/facebook/callback
 * 
 * This page redirects to the login page with an error message
 */
export default async function OAuthCallbackPage({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ code?: string; state?: string; provider?: string; redirect?: string; error?: string }>;
}) {
	const { channel } = await params;
	const { error: oauthError } = await searchParams;

	// Handle OAuth errors
	if (oauthError) {
		redirect(`/${channel}/login?error=${encodeURIComponent(oauthError)}`);
	}

	// If we reach here, something went wrong
	redirect(`/${channel}/login?error=${encodeURIComponent("OAuth callback failed")}`);
}

