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
 * Facebook OAuth - Step 1: Redirect to Facebook
 * GET /api/auth/facebook
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const finalRedirectUrl = searchParams.get("final_redirect") || "/default-channel";

	// Get the correct origin when behind a proxy/tunnel
	const callbackOrigin = getRequestOrigin(request);
	const callbackUrl = searchParams.get("redirect_uri") || 
		`${callbackOrigin}/api/auth/facebook/callback`;

	const appId = process.env.FACEBOOK_APP_ID;
	if (!appId) {
		return NextResponse.json(
			{ error: "Facebook OAuth is not configured. Missing FACEBOOK_APP_ID." },
			{ status: 500 }
		);
	}

	// Generate state for CSRF protection - store final redirect URL
	const state = Buffer.from(JSON.stringify({ finalRedirectUrl })).toString("base64");

	const params = new URLSearchParams({
		client_id: appId,
		redirect_uri: callbackUrl,
		response_type: "code",
		scope: "email,public_profile",
		state,
	});

	const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;

	return NextResponse.redirect(facebookAuthUrl);
}

