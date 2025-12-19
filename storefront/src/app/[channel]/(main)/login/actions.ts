"use server";

import { getServerAuthClient } from "@/app/config";
import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import { ExternalAuthenticationUrlDocument, ExternalObtainAccessTokensDocument } from "@/gql/graphql";
import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();

	if (!email || !password) {
		return { error: "Email and password are required" };
	}

	try {
		const authClient = await getServerAuthClient();
		const { data } = await authClient.signIn({ email, password }, { cache: "no-store" });

		if (data?.tokenCreate?.errors && data.tokenCreate.errors.length > 0) {
			const errorMessage = data.tokenCreate.errors[0]?.message || "Invalid credentials";
			return { error: errorMessage };
		}

		revalidatePath("/", "layout");
		return { success: true };
	} catch (error) {
		console.error("Login error:", error);
		return { error: "An error occurred during login. Please try again." };
	}
}

export async function registerAction(formData: FormData) {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const firstName = formData.get("firstName")?.toString();
	const lastName = formData.get("lastName")?.toString();

	if (!email || !password) {
		return { error: "Email and password are required" };
	}

	try {
		// Note: Saleor requires account registration through GraphQL mutation
		// For now, we'll use a basic implementation
		// In production, you would call the accountRegister mutation
		
		const response = await fetch(process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL!, {
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
						password,
						firstName: firstName || "",
						lastName: lastName || "",
						redirectUrl: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3001"}/default-channel/confirm-email`,
						channel: "default-channel",
					},
				},
			}),
		});

		const result = await response.json() as {
			data?: {
				accountRegister?: {
					errors?: Array<{ message?: string }>;
				};
			};
		};
		
		if (result.data?.accountRegister?.errors && result.data.accountRegister.errors.length > 0) {
			const errorMessage = result.data.accountRegister.errors[0]?.message || "Registration failed";
			return { error: errorMessage };
		}

		// Auto-login after registration
		const authClient = await getServerAuthClient();
		await authClient.signIn({ email, password }, { cache: "no-store" });

		revalidatePath("/", "layout");
		return { success: true };
	} catch (error) {
		console.error("Registration error:", error);
		return { error: "An error occurred during registration. Please try again." };
	}
}

/**
 * Get OAuth authentication URL for Google or Facebook
 * Uses direct OAuth implementation (no plugins required)
 * @param provider - "google" or "facebook"
 * @param callbackUrl - OAuth callback URL (must match API route)
 * @param finalRedirectUrl - Where to redirect user after successful OAuth login
 */
export async function getOAuthUrl(provider: "google" | "facebook", callbackUrl: string, finalRedirectUrl?: string) {
	try {
		// Check if OAuth credentials are configured
		const googleClientId = process.env.GOOGLE_CLIENT_ID;
		const facebookAppId = process.env.FACEBOOK_APP_ID;

		if (provider === "google" && !googleClientId) {
			return { 
				error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
			};
		}

		if (provider === "facebook" && !facebookAppId) {
			return { 
				error: "Facebook OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables." 
			};
		}

		// Build OAuth URL using our API route
		const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 
			(process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
		
		const oauthUrl = new URL(`/api/auth/${provider}`, baseUrl);
		oauthUrl.searchParams.set("redirect_uri", callbackUrl);
		
		// Add final redirect URL if provided (where to send user after login)
		if (finalRedirectUrl) {
			oauthUrl.searchParams.set("final_redirect", finalRedirectUrl);
		}

		return { success: true, url: oauthUrl.toString() };
	} catch (error) {
		console.error("[OAuth] Error:", error);
		return { 
			error: `Failed to initiate ${provider} login. Please try again.` 
		};
	}
}

/**
 * Handle OAuth callback - This is now handled by API routes
 * Kept for backwards compatibility but redirects to API route
 * @param provider - "google" or "facebook"
 * @param code - OAuth authorization code
 * @param state - OAuth state parameter
 */
export async function handleOAuthCallback(provider: "google" | "facebook", code: string, state?: string) {
	// OAuth callback is now handled by API routes:
	// /api/auth/google/callback
	// /api/auth/facebook/callback
	// This function is kept for backwards compatibility
	return { 
		error: "OAuth callback should be handled by API routes. This function is deprecated." 
	};
}

