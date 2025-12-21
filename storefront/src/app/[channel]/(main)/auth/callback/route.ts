import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/app/[channel]/(main)/login/oauth-actions";
import { getServerAuthClient } from "@/app/config";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ channel: string }> }
) {
	const { channel } = await params;
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const oauthError = searchParams.get("error");
	const redirectParam = searchParams.get("redirect");

	// Handle OAuth errors
	if (oauthError) {
		const errorMessage = oauthError || "OAuth authentication failed";
		return NextResponse.redirect(
			new URL(`/${channel}/login?error=${encodeURIComponent(errorMessage)}`, request.url)
		);
	}

	// Require code parameter
	if (!code) {
		return NextResponse.redirect(
			new URL(`/${channel}/login?error=${encodeURIComponent("Missing authorization code")}`, request.url)
		);
	}

	try {
		// Handle the OAuth callback
		const result = await handleOAuthCallback(code, state || undefined);

		if (!result.success) {
			const errorMessage = result.error || "Failed to complete OAuth login";
			return NextResponse.redirect(
				new URL(`/${channel}/login?error=${encodeURIComponent(errorMessage)}`, request.url)
			);
		}

		// Create response with redirect
		// Use Host header or environment variable to get the correct base URL
		// This ensures we redirect to the tunneled URL, not localhost
		const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
		const protocol = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
		const baseUrl = host ? `${protocol}://${host}` : new URL(request.url).origin;
		
		const redirectPath = redirectParam || result.redirectUrl || `/${channel}`;
		// Ensure redirectPath starts with /
		const finalRedirectPath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
		const redirectUrl = `${baseUrl}${finalRedirectPath}`;
		
		console.log("[OAuth Callback] Redirect URL:", redirectUrl);
		console.log("[OAuth Callback] Host header:", host);
		console.log("[OAuth Callback] Request URL:", request.url);
		
		// Use Saleor auth SDK to store tokens properly
		// The SDK handles cookie naming with API URL prefix
		if (result.token) {
			const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
			// Construct cookie names like the SDK does: {apiUrl}/+saleor_auth_*
			// IMPORTANT: The SDK uses {apiUrl}/+saleor_auth_* (with / before +)
			// Remove trailing slash if present, then add /+saleor_auth_*
			const cookiePrefix = saleorApiUrl.replace(/\/$/, ""); // Remove trailing slash
			
			// Add query parameter to trigger wishlist reload on client side
			const redirectUrlWithEvent = new URL(redirectUrl);
			redirectUrlWithEvent.searchParams.set("wishlist_reload", "true");
			const finalRedirectUrl = redirectUrlWithEvent.toString();
			
			// Create redirect response
			const response = NextResponse.redirect(finalRedirectUrl);
			
			// Set cookies with the SDK's naming convention
			// Access token cookie: {apiUrl}/+saleor_auth_access_token (note the / before +)
			response.cookies.set(`${cookiePrefix}/+saleor_auth_access_token`, result.token, {
				httpOnly: true,
				secure: protocol === "https",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 30, // 30 days
			});
			
			// Auth state cookie: {apiUrl}/+saleor_auth_module_auth_state = "signedIn"
			response.cookies.set(`${cookiePrefix}/+saleor_auth_module_auth_state`, "signedIn", {
				httpOnly: false, // Client needs to read this
				secure: protocol === "https",
				sameSite: "lax",
				path: "/",
			});
			
			// Refresh token cookie: {apiUrl}/+saleor_auth_module_refresh_token
			if (result.refreshToken) {
				response.cookies.set(`${cookiePrefix}/+saleor_auth_module_refresh_token`, result.refreshToken, {
					httpOnly: true,
					secure: protocol === "https",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 365, // 1 year
				});
			}
			
			console.log("[OAuth Callback] Cookies set with prefix:", cookiePrefix);
			console.log("[OAuth Callback] Cookie names:", {
				accessToken: `${cookiePrefix}/+saleor_auth_access_token`,
				authState: `${cookiePrefix}/+saleor_auth_module_auth_state`,
				refreshToken: result.refreshToken ? `${cookiePrefix}/+saleor_auth_module_refresh_token` : "none",
			});
			
			return response;
		}

		// Fallback if no token
		return NextResponse.redirect(redirectUrl);
	} catch (error) {
		console.error("[OAuth Callback] Error:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to process OAuth callback";
		return NextResponse.redirect(
			new URL(`/${channel}/login?error=${encodeURIComponent(errorMessage)}`, request.url)
		);
	}
}

