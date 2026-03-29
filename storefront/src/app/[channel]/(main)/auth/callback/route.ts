import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/app/[channel]/(main)/login/oauth-actions";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ channel: string }> }
) {
	const { channel } = await params;
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const oauthError = searchParams.get("error");

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
		// Handle the OAuth callback — exchange code for tokens
		const result = await handleOAuthCallback(code, state || undefined);

		if (!result.success) {
			const errorMessage = result.error || "Failed to complete OAuth login";
			return NextResponse.redirect(
				new URL(`/${channel}/login?error=${encodeURIComponent(errorMessage)}`, request.url)
			);
		}

		const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
		const protocol = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
		const baseUrl = host ? `${protocol}://${host}` : new URL(request.url).origin;
		const fallbackUrl = `${baseUrl}/${channel}`;

		// Build response that sets auth cookies and then redirects client-side.
		// We return an HTML page (not a 302) so JavaScript can read sessionStorage
		// for the original page the user was on (e.g. checkout).
		const response = new NextResponse(
			oauthRedirectHtml(fallbackUrl),
			{ status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
		);

		if (result.token) {
			const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
			const cookiePrefix = saleorApiUrl.replace(/\/$/, "");

			response.cookies.set(`${cookiePrefix}/+saleor_auth_access_token`, result.token, {
				httpOnly: false,
				secure: protocol === "https",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 30,
			});

			response.cookies.set(`${cookiePrefix}/+saleor_auth_module_auth_state`, "signedIn", {
				httpOnly: false,
				secure: protocol === "https",
				sameSite: "lax",
				path: "/",
			});

			if (result.refreshToken) {
				response.cookies.set(`${cookiePrefix}/+saleor_auth_module_refresh_token`, result.refreshToken, {
					httpOnly: true,
					secure: protocol === "https",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 365,
				});
			}
		}

		return response;
	} catch (error) {
		console.error("[OAuth Callback] Error:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to process OAuth callback";
		return NextResponse.redirect(
			new URL(`/${channel}/login?error=${encodeURIComponent(errorMessage)}`, request.url)
		);
	}
}

/**
 * Minimal HTML that reads the stored redirect from sessionStorage,
 * clears it, and navigates. Cookies are already set via Set-Cookie headers.
 */
function oauthRedirectHtml(fallbackUrl: string): string {
	return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body>
<p style="font-family:system-ui;text-align:center;margin-top:40vh">Signing in…</p>
<script>
(function(){
  var dest;
  // Try cookie first (works in WebViews where sessionStorage is cleared)
  try {
    var m = document.cookie.match(/(?:^|;\\s*)oauth_redirect=([^;]*)/);
    if (m && m[1]) {
      dest = decodeURIComponent(m[1]);
      document.cookie = "oauth_redirect=; path=/; max-age=0";
    }
  } catch(e){}
  // Fallback to sessionStorage (legacy)
  if (!dest) {
    try {
      dest = sessionStorage.getItem("oauth_redirect");
      sessionStorage.removeItem("oauth_redirect");
    } catch(e){}
  }
  if (!dest) dest = ${JSON.stringify(fallbackUrl)};
  // Append cache-busters so the page reloads with fresh auth state
  var url = new URL(dest, location.origin);
  url.searchParams.set("wishlist_reload","true");
  url.searchParams.set("restore_cart","true");
  location.replace(url.toString());
})();
</script>
</body></html>`;
}
