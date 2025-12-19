import { NextRequest, NextResponse } from "next/server";

/**
 * Get the correct origin when behind a proxy/tunnel
 * Checks forwarded headers, host header, and referer
 */
function getRequestOrigin(request: NextRequest): string {
	const forwardedHost = request.headers.get("x-forwarded-host");
	const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
	const host = request.headers.get("host");
	const referer = request.headers.get("referer");
	
	if (forwardedHost) {
		return `${forwardedProto}://${forwardedHost}`;
	} else if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
		return `https://${host}`;
	} else if (referer) {
		try {
			const refererUrl = new URL(referer);
			return refererUrl.origin;
		} catch {
			return request.nextUrl.origin;
		}
	} else {
		return request.nextUrl.origin;
	}
}

/**
 * Google OAuth - Step 1: Redirect to Google
 * GET /api/auth/google
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const finalRedirectUrl = searchParams.get("final_redirect") || "/default-channel";

	// Get the correct origin when behind a proxy/tunnel
	const callbackOrigin = getRequestOrigin(request);
	const callbackUrl = searchParams.get("redirect_uri") || 
		`${callbackOrigin}/api/auth/google/callback`;

	const clientId = process.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		return NextResponse.json(
			{ error: "Google OAuth is not configured. Missing GOOGLE_CLIENT_ID." },
			{ status: 500 }
		);
	}

	// Generate state for CSRF protection - store final redirect URL
	const state = Buffer.from(JSON.stringify({ finalRedirectUrl })).toString("base64");

	// Normalize callback URL - remove trailing slashes and ensure exact format
	const normalizedCallbackUrl = callbackUrl.replace(/\/$/, "");
	
	console.log(`[Google OAuth] Using callback URL: ${normalizedCallbackUrl}`);
	console.log(`[Google OAuth] Request origin: ${request.nextUrl.origin}`);
	console.log(`[Google OAuth] Calculated origin: ${callbackOrigin}`);

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: normalizedCallbackUrl,
		response_type: "code",
		scope: "openid email profile",
		state,
		access_type: "offline",
		prompt: "consent",
	});

	const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

	return NextResponse.redirect(googleAuthUrl);
}

