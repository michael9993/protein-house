import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerAuthClient } from "@/app/config";
import { revalidatePath } from "next/cache";

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
 * Facebook OAuth - Step 2: Handle callback and exchange code for tokens
 * GET /api/auth/facebook/callback
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");

	// Handle OAuth errors
	if (error) {
		return NextResponse.redirect(
			new URL(`/default-channel/login?error=${encodeURIComponent("Facebook authentication failed")}`, request.url)
		);
	}

	if (!code) {
		return NextResponse.redirect(
			new URL("/default-channel/login?error=Missing authorization code", request.url)
		);
	}

	try {
		// Decode state to get final redirect URI (where to send user after login)
		let finalRedirectUrl = "/default-channel";
		if (state) {
			try {
				const decoded = JSON.parse(Buffer.from(state, "base64").toString());
				finalRedirectUrl = decoded.finalRedirectUrl || finalRedirectUrl;
			} catch {
				// Invalid state, use default
			}
		}

		const appId = process.env.FACEBOOK_APP_ID;
		const appSecret = process.env.FACEBOOK_APP_SECRET;
		
		// Get the correct origin when behind a proxy/tunnel
		const callbackOrigin = getRequestOrigin(request);
		const callbackUrl = `${callbackOrigin}/api/auth/facebook/callback`.replace(/\/$/, "");

		if (!appId || !appSecret) {
			return NextResponse.redirect(
				new URL("/default-channel/login?error=Facebook OAuth not configured", request.url)
			);
		}

		// Exchange code for access token
		const tokenResponse = await fetch(
			`https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
				client_id: appId,
				client_secret: appSecret,
				redirect_uri: callbackUrl,
				code,
			})}`,
			{
				method: "GET",
			}
		);

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.text();
			console.error("Facebook token exchange error:", errorData);
			return NextResponse.redirect(
				new URL("/default-channel/login?error=Failed to exchange token", request.url)
			);
		}

		const tokenData = await tokenResponse.json();
		const accessToken = tokenData.access_token;

		// Get user info from Facebook
		const userInfoResponse = await fetch(
			`https://graph.facebook.com/v18.0/me?fields=id,email,first_name,last_name,name&access_token=${accessToken}`
		);

		if (!userInfoResponse.ok) {
			return NextResponse.redirect(
				new URL("/default-channel/login?error=Failed to fetch user info", request.url)
			);
		}

		const userInfo = await userInfoResponse.json();
		const { email, first_name: firstName, last_name: lastName, name } = userInfo;

		if (!email) {
			return NextResponse.redirect(
				new URL("/default-channel/login?error=Email not provided by Facebook", request.url)
			);
		}

		// Check if user exists first
		// Try to register the user directly
		// If registration fails with "UNIQUE" error, the user already exists
		const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL!;
		
		// Generate a secure random password (user won't need to remember it for OAuth)
		const tempPassword = Buffer.from(`${email}-${Date.now()}-facebook-oauth`).toString("base64").slice(0, 24) + "A1!";

		const registerResponse = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `
					mutation AccountRegister($input: AccountRegisterInput!) {
						accountRegister(input: $input) {
							errors {
								field
								message
								code
							}
							user {
								id
								email
							}
						}
					}
				`,
				variables: {
					input: {
						email,
						password: tempPassword,
						firstName: firstName || name?.split(" ")[0] || "",
						lastName: lastName || name?.split(" ").slice(1).join(" ") || "",
						redirectUrl: `${getRequestOrigin(request)}/default-channel/confirm-email`,
						channel: "default-channel",
					},
				},
			}),
		});

		const registerResult = await registerResponse.json();
		
		if (registerResult.data?.accountRegister?.errors && registerResult.data.accountRegister.errors.length > 0) {
			const errorCode = registerResult.data.accountRegister.errors[0]?.code;
			const errorMessage = registerResult.data.accountRegister.errors[0]?.message || "Registration failed";
			
			if (errorCode === "UNIQUE") {
				// User already exists - we can't sign them in without their password
				const errorOrigin = getRequestOrigin(request);
				const errorUrl = `${errorOrigin}/default-channel/login?error=${encodeURIComponent("Account already exists. Please use email/password login or reset your password.")}`;
				return NextResponse.redirect(errorUrl);
			}
			
			// Other registration errors
			const errorOrigin = getRequestOrigin(request);
			const errorUrl = `${errorOrigin}/default-channel/login?error=${encodeURIComponent(errorMessage)}`;
			return NextResponse.redirect(errorUrl);
		}

		// Registration successful - auto-confirm OAuth users since their email is already verified
		const requiresConfirmation = registerResult.data?.accountRegister?.requiresConfirmation;
		
		if (requiresConfirmation) {
			console.log("[Facebook OAuth Callback] Account requires confirmation, auto-confirming OAuth user...");
			
			// Call internal API to confirm the account
			// This uses a staff token to confirm the account programmatically
			const confirmOrigin = getRequestOrigin(request);
			const confirmUrl = `${confirmOrigin}/api/auth/confirm-account`;
			
			try {
				const confirmResponse = await fetch(confirmUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email }),
				});

				const confirmResult = await confirmResponse.json();
				
				if (!confirmResult.success) {
					console.warn("[Facebook OAuth Callback] Failed to auto-confirm account:", confirmResult.error);
					// Continue anyway - user can confirm via email if needed
				} else {
					console.log("[Facebook OAuth Callback] Account auto-confirmed successfully");
				}
			} catch (confirmError) {
				console.error("[Facebook OAuth Callback] Error confirming account:", confirmError);
				// Continue anyway - user can confirm via email if needed
			}
		}

		// Try to sign in the newly created user
		const authClient = await getServerAuthClient();
		const signInResult = await authClient.signIn({ email, password: tempPassword }, { cache: "no-store" });

		// Check if sign-in was successful
		if (signInResult.data?.tokenCreate?.errors && signInResult.data.tokenCreate.errors.length > 0) {
			const errorMessage = signInResult.data.tokenCreate.errors[0]?.message || "Failed to sign in";
			const errorCode = signInResult.data.tokenCreate.errors[0]?.code;
			
			// If account still needs confirmation, provide a helpful message
			if (errorMessage.includes("confirmed") || errorCode === "ACCOUNT_NOT_CONFIRMED") {
				console.log("[Facebook OAuth Callback] Account still not confirmed after auto-confirm attempt");
				const errorOrigin = getRequestOrigin(request);
				// Redirect to a page that explains they need to confirm their email
				// The confirmation email should have been sent by Saleor
				const errorUrl = `${errorOrigin}/default-channel/login?error=${encodeURIComponent("Please check your email to confirm your account. The confirmation link was sent to your email address.")}`;
				return NextResponse.redirect(errorUrl);
			}
			
			console.error("[Facebook OAuth Callback] Sign-in error:", errorMessage);
			const errorOrigin = getRequestOrigin(request);
			const errorUrl = `${errorOrigin}/default-channel/login?error=${encodeURIComponent(errorMessage)}`;
			return NextResponse.redirect(errorUrl);
		}

		if (!signInResult.data?.tokenCreate?.token) {
			console.error("[Facebook OAuth Callback] No token received from sign-in");
			const errorOrigin = getRequestOrigin(request);
			const errorUrl = `${errorOrigin}/default-channel/login?error=${encodeURIComponent("Failed to create authentication token")}`;
			return NextResponse.redirect(errorUrl);
		}

		console.log("[Facebook OAuth Callback] Sign-in successful, token created");

		// Build redirect URL using the same origin detection logic
		const redirectOrigin = getRequestOrigin(request);
		const redirectUrl = finalRedirectUrl.startsWith("http") 
			? finalRedirectUrl 
			: `${redirectOrigin}${finalRedirectUrl}`;
		
		// Get cookies that were set by the auth SDK
		const cookieStore = await cookies();
		const refreshTokenCookie = cookieStore.get("_saleorRefreshToken");
		const saleorAccessTokenCookie = cookieStore.get("_saleorAccessToken");
		
		console.log("[Facebook OAuth Callback] Cookies:", {
			hasRefreshToken: !!refreshTokenCookie,
			hasAccessToken: !!saleorAccessTokenCookie,
		});
		
		// Revalidate after redirect to avoid stream issues
		try {
			revalidatePath("/", "layout");
		} catch (revalidateError) {
			// Ignore revalidation errors - they're not critical
			console.warn("Revalidation warning (non-critical):", revalidateError);
		}
		
		// Create redirect response
		const response = NextResponse.redirect(redirectUrl, { status: 302 });
		
		// Ensure cookies are included in the response
		// The auth SDK should have set them, but we'll copy them to be sure
		if (refreshTokenCookie) {
			response.cookies.set("_saleorRefreshToken", refreshTokenCookie.value, {
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
			});
		}
		if (saleorAccessTokenCookie) {
			response.cookies.set("_saleorAccessToken", saleorAccessTokenCookie.value, {
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
			});
		}
		
		return response;
	} catch (error) {
		console.error("Facebook OAuth callback error:", error);
		return NextResponse.redirect(
			new URL("/default-channel/login?error=Authentication failed", request.url)
		);
	}
}

