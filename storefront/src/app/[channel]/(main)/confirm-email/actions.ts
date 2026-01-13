"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import { ConfirmAccountDocument } from "@/gql/graphql";

/**
 * Confirm account and automatically log in the user.
 * This calls a custom Django endpoint that confirms the account and returns JWT tokens.
 */
import { DefaultChannelSlug } from "@/app/config";

export async function confirmAndLoginAction(email: string, token: string, channel: string = DefaultChannelSlug) {
	try {
		// Decode URL-encoded email and token
		let decodedEmail = email;
		let decodedToken = token;
		
		try {
			decodedEmail = decodeURIComponent(email);
			decodedToken = decodeURIComponent(token);
		} catch (e) {
			// If decoding fails, they might already be decoded - use as-is
			console.log("[Confirm And Login] URL decode not needed, using original values");
		}
		
		console.log("[Confirm And Login] Calling Django endpoint for:", decodedEmail);
		
		// Get base URL and remove /graphql/ if present
		let saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL!;
		saleorApiUrl = saleorApiUrl.replace(/\/+$/, "");
		if (saleorApiUrl.endsWith("/graphql")) {
			saleorApiUrl = saleorApiUrl.replace(/\/graphql$/, "");
		}
		
		const endpointUrl = `${saleorApiUrl}/confirm-and-login/`;
		
		const response = await fetch(endpointUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: decodedEmail,
				token: decodedToken,
			}),
		});
		
		// Check if response is JSON or HTML
		const contentType = response.headers.get("content-type") || "";
		let result: { 
			success?: boolean;
			error?: string;
			message?: string;
			token?: string;
			refresh_token?: string;
			csrf_token?: string;
			user?: {
				id: string;
				email: string;
				firstName?: string;
				lastName?: string;
			};
		};
		
		if (contentType.includes("application/json")) {
			result = await response.json() as typeof result;
		} else {
			const text = await response.text();
			console.error("[Confirm And Login] ❌ Received non-JSON response:", text.substring(0, 200));
			return {
				success: false,
				error: "Invalid response from server. Please try again.",
			};
		}
		
		if (!response.ok || !result.success) {
			console.error("[Confirm And Login] ❌ Error:", result.error);
			return {
				success: false,
				error: result.error || "Failed to confirm account",
			};
		}
		
		// Use the tokens to log the user in
		if (result.token && result.refresh_token && result.csrf_token) {
			console.log("[Confirm And Login] ✅ Account confirmed, setting tokens in cookies");
			
			// Set cookies manually (same pattern as OAuth callback)
			const cookieStore = await cookies();
			
			const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
			const cookiePrefix = saleorApiUrl.replace(/\/$/, "");
			
			// Set access token (non-httpOnly so SDK can read it for cross-domain requests)
			cookieStore.set(`${cookiePrefix}/+saleor_auth_access_token`, result.token, {
				httpOnly: false, // Must be false so SDK can read it from document.cookie
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 30, // 30 days
			});
			
			// Set auth state (same as OAuth callback)
			cookieStore.set(`${cookiePrefix}/+saleor_auth_module_auth_state`, "signedIn", {
				httpOnly: false, // Client needs to read this
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
			});
			
			// Set refresh token (same cookie name as OAuth callback)
			cookieStore.set(`${cookiePrefix}/+saleor_auth_module_refresh_token`, result.refresh_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 365, // 1 year
			});
			
			console.log("[Confirm And Login] ✅ Tokens set in cookies, user logged in successfully");
			
			// Restore user's cart and revalidate paths (same as login action)
			try {
				const { restoreUserCart } = await import("@/app/actions");
				await restoreUserCart(channel);
			} catch (restoreError) {
				console.error("[Confirm And Login] Cart restore failed (non-fatal):", restoreError);
				// Continue anyway - user is logged in, cart restore is best-effort
			}
			
			revalidatePath("/", "layout");
			
			return {
				success: true,
				message: result.message || "Account confirmed and logged in successfully!",
				user: result.user,
			};
		} else {
			console.error("[Confirm And Login] ❌ No tokens returned from endpoint");
			return {
				success: false,
				error: "Account confirmed but login failed. Please sign in manually.",
			};
		}
	} catch (error: any) {
		console.error("[Confirm And Login] ❌ Exception:", {
			message: error?.message || String(error),
			stack: error?.stack,
		});
		return {
			success: false,
			error: "An error occurred while confirming your account. Please try again.",
		};
	}
}

export async function confirmAccountAction(email: string, token: string) {
	try {
		// Decode URL-encoded email and token (they might be double-encoded)
		// Use try-catch in case they're already decoded
		let decodedEmail = email;
		let decodedToken = token;
		
		try {
			decodedEmail = decodeURIComponent(email);
			decodedToken = decodeURIComponent(token);
		} catch (e) {
			// If decoding fails, they might already be decoded - use as-is
			console.log("[Confirm Account Action] URL decode not needed, using original values");
		}
		
		console.log("[Confirm Account Action] Attempting confirmation:", {
			email: decodedEmail,
			tokenLength: decodedToken.length,
			tokenPreview: decodedToken.substring(0, 10) + "...",
		});

		const result = await executeGraphQL(ConfirmAccountDocument, {
			variables: { email: decodedEmail, token: decodedToken },
			cache: "no-store",
		});

		console.log("[Confirm Account Action] GraphQL result:", {
			hasErrors: !!result.confirmAccount?.errors,
			errorsCount: result.confirmAccount?.errors?.length || 0,
			hasUser: !!result.confirmAccount?.user,
			isConfirmed: result.confirmAccount?.user?.isConfirmed,
		});

		if (result.confirmAccount?.errors && result.confirmAccount.errors.length > 0) {
			const error = result.confirmAccount.errors[0];
			const errorMessage = error?.message || "Invalid confirmation link";
			const errorCode = error?.code || "UNKNOWN";
			
			console.error("[Confirm Account Action] Confirmation failed:", {
				message: errorMessage,
				code: errorCode,
				field: error?.field,
				allErrors: result.confirmAccount.errors,
			});
			
			return { 
				success: false, 
				error: errorMessage,
				errorCode,
			};
		}

		if (!result.confirmAccount?.user) {
			console.error("[Confirm Account Action] No user returned from confirmation");
			return { 
				success: false, 
				error: "Account confirmation failed. Please try again or request a new confirmation email.",
			};
		}

		console.log("[Confirm Account Action] ✅ Account confirmed successfully:", decodedEmail);
		return { 
			success: true, 
			isConfirmed: result.confirmAccount.user.isConfirmed || false,
			email: decodedEmail, // Return email for auto-login
		};
	} catch (error: any) {
		console.error("[Confirm Account Action] Exception during confirmation:", {
			error: error?.message || String(error),
			stack: error?.stack,
			name: error?.name,
			// If it's a GraphQL error, log the details
			graphqlErrors: error?.errorResponse?.errors,
		});
		
		// Check if it's a GraphQL error with specific message
		if (error?.errorResponse?.errors && error.errorResponse.errors.length > 0) {
			const graphqlError = error.errorResponse.errors[0];
			return {
				success: false,
				error: graphqlError.message || "Invalid confirmation link. The link may have expired or already been used.",
				errorCode: graphqlError.extensions?.code || "UNKNOWN",
			};
		}
		
		return { 
			success: false, 
			error: "Failed to confirm account. The link may have expired or already been used. Please request a new confirmation email.",
			errorCode: "UNKNOWN",
		};
	}
}

