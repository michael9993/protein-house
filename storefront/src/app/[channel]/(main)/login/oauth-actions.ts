"use server";

import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import { ExternalAuthenticationUrlDocument, ExternalObtainAccessTokensDocument } from "@/gql/graphql";

/**
 * Get OAuth URL from Saleor for Google authentication
 * Uses Saleor's OpenID Connect plugin
 */
export async function getOAuthUrl(
	provider: "google",
	redirectUri: string,
	finalRedirectUrl?: string
): Promise<{ url?: string; error?: string }> {
	try {
		const pluginId = "mirumee.authentication.openidconnect";
		
		// IMPORTANT: The redirectUri passed to Saleor is what Google will use as redirect_uri
		// It MUST be the storefront callback URL (where Google will redirect)
		// The redirect_uri must NOT include query parameters - Google requires exact match
		// Store the finalRedirectUrl in the state instead (Saleor will include it in state)
		// Build storefront callback URL WITHOUT query parameters for OAuth redirect_uri
		const storefrontCallbackUrl = new URL(redirectUri);
		// Remove any existing query parameters - Google requires exact redirect_uri match
		storefrontCallbackUrl.search = "";
		
		console.log("[OAuth] Storefront callback URL (for OAuth redirect_uri):", storefrontCallbackUrl.toString());
		console.log("[OAuth] Final redirect URL (will be stored in state):", finalRedirectUrl);
		
		// Pass storefront callback URL WITHOUT query params as redirectUri
		// The finalRedirectUrl will be handled by the callback page after OAuth completes
		const input = JSON.stringify({
			redirectUri: storefrontCallbackUrl.toString(),
		});

		const result = await executeGraphQL(ExternalAuthenticationUrlDocument, {
			variables: {
				pluginId,
				input,
			},
			withAuth: false, // OAuth URL request doesn't require authentication
			cache: "no-store",
		});

		// Debug: Log the full result
		console.log("[OAuth] Full GraphQL result:", JSON.stringify(result, null, 2));

		if (result.externalAuthenticationUrl?.errors && result.externalAuthenticationUrl.errors.length > 0) {
			const errorMessage = result.externalAuthenticationUrl.errors[0]?.message || "Failed to get OAuth URL";
			console.error("[OAuth] GraphQL errors:", result.externalAuthenticationUrl.errors);
			return { error: errorMessage };
		}

		// Extract the authentication URL from the response
		// The authenticationData is a JSONString (string | null) that needs to be parsed
		const authDataRaw = result.externalAuthenticationUrl?.authenticationData;
		
		// Debug logging
		console.log("[OAuth] Raw authenticationData:", authDataRaw);
		console.log("[OAuth] Type of authenticationData:", typeof authDataRaw);
		console.log("[OAuth] Full result.externalAuthenticationUrl:", result.externalAuthenticationUrl);
		
		if (!authDataRaw) {
			console.error("[OAuth] No authenticationData in response. Full result:", JSON.stringify(result, null, 2));
			return { error: "No authentication data received from server. Plugin may not be active or configured correctly." };
		}

		// Parse the JSON string - JSONString type is always a string (or null, which we checked above)
		let authData: { authorizationUrl?: string };
		try {
			if (typeof authDataRaw === "string") {
				// Parse as JSON string
				authData = JSON.parse(authDataRaw);
				console.log("[OAuth] Parsed JSON string to object:", authData);
			} else {
				// Should not happen, but handle gracefully
				console.error("[OAuth] Unexpected authenticationData type (expected string):", typeof authDataRaw, authDataRaw);
				return { error: `Invalid authentication data format: expected string, got ${typeof authDataRaw}` };
			}
		} catch (parseError) {
			console.error("[OAuth] Failed to parse authentication data as JSON:", parseError);
			console.error("[OAuth] Raw value that failed to parse:", authDataRaw);
			return { error: `Invalid authentication data format: ${parseError instanceof Error ? parseError.message : "parse error"}` };
		}

		// The URL is in authData.authorizationUrl
		const authUrl = authData?.authorizationUrl;
		
		if (!authUrl || typeof authUrl !== "string") {
			console.error("[OAuth] Missing authorizationUrl in parsed data. Parsed authData:", authData);
			return { error: "No authentication URL received from server. Check plugin configuration." };
		}

		console.log("[OAuth] Successfully extracted authorizationUrl:", authUrl);
		return { url: authUrl };
	} catch (error) {
		console.error("[OAuth] Error getting OAuth URL:", error);
		return { error: "Failed to initiate OAuth login. Please try again." };
	}
}

/**
 * Handle OAuth callback from Saleor
 * Exchanges OAuth code for Saleor tokens
 */
export async function handleOAuthCallback(
	code: string,
	state?: string
): Promise<{ success: boolean; error?: string; token?: string; refreshToken?: string; csrfToken?: string; redirectUrl?: string }> {
	try {
		const pluginId = "mirumee.authentication.openidconnect";
		
		// Parse state if provided (contains redirect URL)
		// Note: Saleor signs the state, which contains the redirectUri
		// We don't need to parse it - Saleor handles it internally
		// The redirectUrl will be determined by the callback page
		let redirectUrl: string | undefined;

		// Build input for externalObtainAccessTokens mutation
		const input = JSON.stringify({
			code,
			...(state && { state }),
		});

		const result = await executeGraphQL(ExternalObtainAccessTokensDocument, {
			variables: {
				pluginId,
				input,
			},
			withAuth: false, // Initial token exchange doesn't require auth
			cache: "no-store",
		});

		console.log("[OAuth] externalObtainAccessTokens result:", JSON.stringify(result, null, 2));

		if (result.externalObtainAccessTokens?.errors && result.externalObtainAccessTokens.errors.length > 0) {
			const errorMessage = result.externalObtainAccessTokens.errors[0]?.message || "OAuth authentication failed";
			console.error("[OAuth] externalObtainAccessTokens errors:", result.externalObtainAccessTokens.errors);
			return { success: false, error: errorMessage };
		}

		// Extract tokens from response
		const token = result.externalObtainAccessTokens?.token;
		const refreshToken = result.externalObtainAccessTokens?.refreshToken;
		const csrfToken = result.externalObtainAccessTokens?.csrfToken;

		if (!token) {
			return { success: false, error: "No token received from OAuth provider" };
		}

		// Return tokens to be stored in cookies by the callback page
		// Cookies can only be set in Route Handlers or Server Components, not Server Actions
		return { 
			success: true, 
			token,
			refreshToken: refreshToken || undefined,
			csrfToken: csrfToken || undefined,
			redirectUrl: redirectUrl || undefined,
		};
	} catch (error) {
		console.error("[OAuth] Error handling callback:", error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[OAuth] Error details:", errorMessage);
		return { success: false, error: `Failed to complete OAuth login: ${errorMessage}` };
	}
}

