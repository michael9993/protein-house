"use server";

import { getServerAuthClient } from "@/app/config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { DefaultChannelSlug } from "@/app/config";
import { mergeGuestCartIntoUserCart } from "@/app/actions";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { DEFAULT_CONTENT_CONFIG } from "@/providers/StoreConfigProvider";
import { subscribeToNewsletterInactive } from "@/lib/newsletter-server";

/** Hebrew account error messages when channel is ILS/he and config falls back to English defaults */
const ILS_ACCOUNT_ERROR_MESSAGES: Partial<Record<keyof typeof DEFAULT_CONTENT_CONFIG.account, string>> = {
	loginInvalidCredentialsError: "אנא הזן פרטי התחברות תקינים",
	loginEmailPasswordRequiredError: "נדרשים כתובת אימייל וסיסמה",
	loginGenericError: "אירעה שגיאה בהתחברות. אנא נסה שוב.",
	registerEmailPasswordRequiredError: "נדרשים כתובת אימייל וסיסמה",
	registerFailedError: "ההרשמה נכשלה",
	registerAccountExistsError: "כבר קיים חשבון עם אימייל זה. אנא התחבר.",
	registerGenericError: "אירעה שגיאה בהרשמה. אנא נסה שוב.",
	passwordMismatchError: "הסיסמאות אינן תואמות. אנא נסה שוב.",
	passwordTooShortError: "הסיסמה חייבת להכיל לפחות 8 תווים.",
};

/**
 * Extract channel from request URL or formData
 */
async function getChannelFromRequest(formData: FormData): Promise<string> {
	// First try to get from formData
	const channelFromForm = formData.get("channel")?.toString();
	if (channelFromForm) {
		return channelFromForm;
	}
	
	// Try to extract from URL headers
	try {
		const headersList = await headers();
		const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
		const pathParts = pathname.split("/");
		const channelFromPath = pathParts.find((part, index) => 
			index > 0 && pathParts[index - 1] === "" && part && part !== "api" && part !== "_next"
		);
		if (channelFromPath) {
			return channelFromPath;
		}
	} catch {
		// Headers not available, fallback to default
	}
	
	// Fallback to config default
	return DefaultChannelSlug;
}

export async function loginAction(formData: FormData) {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const channel = await getChannelFromRequest(formData);

	// Get configurable error messages (from API/fallback or defaults)
	const config = await fetchStorefrontConfig(channel);
	const baseMessages = config.content?.account || DEFAULT_CONTENT_CONFIG.account;
	// When channel is ILS/he, use Hebrew messages if config fell back to English defaults
	const errorMessages =
		channel === "ils" || channel === "he"
			? { ...baseMessages, ...ILS_ACCOUNT_ERROR_MESSAGES }
			: baseMessages;

	if (!email || !password) {
		return { error: errorMessages.loginEmailPasswordRequiredError };
	}

	try {
		const authClient = await getServerAuthClient();
		const { data } = await authClient.signIn({ email, password }, { cache: "no-store" });

		if (data?.tokenCreate?.errors && data.tokenCreate.errors.length > 0) {
			// Use configurable error message, fallback to API message if available
			const apiMessage = data.tokenCreate.errors[0]?.message;
			const errorMessage = apiMessage && apiMessage !== "Invalid credentials"
				? apiMessage
				: errorMessages.loginInvalidCredentialsError;
			return { error: errorMessage };
		}

		// Restore user's cart from Saleor database on login
		// This queries Saleor directly for the user's checkout - the source of truth
		const { restoreUserCart } = await import("@/app/actions");
		try {
			await restoreUserCart(channel);
		} catch (restoreError) {
			console.error("[Login] Cart restore failed (non-fatal):", restoreError);
			// Continue anyway - user is logged in, cart restore is best-effort
		}

		revalidatePath("/", "layout");
		return { success: true };
	} catch (error) {
		console.error("Login error:", error);
		const genericMsg =
			channel === "ils" || channel === "he"
				? "אירעה שגיאה בהתחברות. אנא נסה שוב."
				: "An error occurred during login. Please try again.";
		return { error: genericMsg };
	}
}

export async function registerAction(formData: FormData) {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const firstName = formData.get("firstName")?.toString();
	const lastName = formData.get("lastName")?.toString();
	const channel = await getChannelFromRequest(formData);

	// Get configurable error messages (from API/fallback or defaults)
	const config = await fetchStorefrontConfig(channel);
	const baseMessages = config.content?.account || DEFAULT_CONTENT_CONFIG.account;
	const errorMessages =
		channel === "ils" || channel === "he"
			? { ...baseMessages, ...ILS_ACCOUNT_ERROR_MESSAGES }
			: baseMessages;

	if (!email || !password) {
		return { error: errorMessages.registerEmailPasswordRequiredError };
	}

	try {
		const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3001";
		const confirmEmailUrl = `${storefrontUrl}/${channel}/confirm-email`;
		
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
								code
							}
							requiresConfirmation
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
						redirectUrl: confirmEmailUrl,
						channel: channel,
					},
				},
			}),
		});

		const result = await response.json() as {
			data?: {
				accountRegister?: {
					errors?: Array<{ message?: string; field?: string; code?: string }>;
					requiresConfirmation?: boolean;
					user?: {
						id?: string;
						email?: string;
					};
				};
			};
					errors?: Array<{ message?: string }>;
				};
		
		// Check for GraphQL errors
		if (result.errors && result.errors.length > 0) {
			const apiMessage = result.errors[0]?.message;
			const errorMessage = apiMessage || errorMessages.registerFailedError;
			return { error: errorMessage };
		}
		
		// Check for mutation errors
		if (result.data?.accountRegister?.errors && result.data.accountRegister.errors.length > 0) {
			const apiMessage = result.data.accountRegister.errors[0]?.message;
			const errorMessage = apiMessage || errorMessages.registerFailedError;
			return { error: errorMessage };
		}

		const requiresConfirmation = result.data?.accountRegister?.requiresConfirmation ?? false;

		// If email confirmation is required, try to auto-login first (if allowed)
		// This enables the resend functionality without requiring credentials
		if (requiresConfirmation) {
			try {
				// Try to login even if confirmation is required (if allow_login_without_confirmation is enabled)
				const authClient = await getServerAuthClient();
				const loginResult = await authClient.signIn({ email, password }, { cache: "no-store" });
				
				// Check if login succeeded and user is already confirmed
				// This indicates the email already exists
				if (loginResult.data?.tokenCreate?.token) {
					// Login succeeded - check if user is confirmed
					// The tokenCreate user might not have isConfirmed, so query it separately
					const { getCurrentUser } = await import("@/app/actions");
					const currentUser = await getCurrentUser();
					
					console.log("[Register] Login result and user check:", {
						hasToken: !!loginResult.data.tokenCreate.token,
						hasCurrentUser: !!currentUser,
						currentUserId: currentUser?.id,
						currentUserEmail: currentUser?.email,
						isConfirmed: currentUser?.isConfirmed,
					});
					
					if (currentUser?.isConfirmed) {
						// User already exists and is confirmed - this was a duplicate registration attempt
						console.warn("[Register] ❌ User already exists and is confirmed:", email);
						return { 
							error: errorMessages.registerAccountExistsError,
						};
					}
					
					// User exists but not confirmed - this is fine, they can resend email
					console.log("[Register] ✅ Auto-login successful - user can now resend confirmation email (user not confirmed yet)");
				}
			} catch (loginError) {
				// If login fails, it could mean:
				// 1. allow_login_without_confirmation is false (expected)
				// 2. User already exists but password is wrong (user enumeration protection - don't reveal)
				// 3. User doesn't exist (new registration - this is fine)
				console.log("[Register] Auto-login failed (expected if allow_login_without_confirmation is false or user doesn't exist):", loginError);
				
				// Check if login failed due to wrong password for existing user
				// This helps detect the case where someone tries to register with existing email but wrong password
				// We still don't reveal if the email exists, but we can provide a helpful message
				const errorMessage = (loginError as any)?.message || String(loginError);
				if (errorMessage.includes("credentials") || errorMessage.includes("password") || errorMessage.includes("Invalid")) {
					// Login failed - could be wrong password for existing user
					// For security, we don't reveal if email exists, but we should still allow the flow
					// The user will get an error when they try to confirm (if account already exists and is confirmed)
					console.log("[Register] Login failed - may be wrong password for existing user, but continuing registration flow for security");
				}
			}
			
			// Auto-add user to newsletter subscriber list as inactive (can activate in settings or via homepage/footer)
			subscribeToNewsletterInactive(email, channel).catch((err) =>
				console.warn("[Register] Newsletter inactive subscribe failed (non-fatal):", err)
			);

			// Return success with email - password will be stored on client side
			return { 
				success: true, 
				requiresConfirmation: true,
				email: email,
			};
		}

		// Auto-add user to newsletter subscriber list as inactive (can activate in settings or via homepage/footer)
		subscribeToNewsletterInactive(email, channel).catch((err) =>
			console.warn("[Register] Newsletter inactive subscribe failed (non-fatal):", err)
		);

		// If no confirmation required, auto-login (backwards compatibility)
		const authClient = await getServerAuthClient();
		const loginResult = await authClient.signIn({ email, password }, { cache: "no-store" });
		
		// Check if login succeeded - if user is already confirmed, this means email already exists
		if (loginResult.data?.tokenCreate?.token) {
			// Query user separately to check isConfirmed
			const { getCurrentUser } = await import("@/app/actions");
			const currentUser = await getCurrentUser();
			
			if (currentUser?.isConfirmed) {
				// User already exists and is confirmed - this was a duplicate registration attempt
				console.warn("[Register] User already exists and is confirmed:", email);
				return { 
					error: "An account with this email already exists. Please sign in instead.",
				};
			}
		} else if (loginResult.data?.tokenCreate?.errors && loginResult.data.tokenCreate.errors.length > 0) {
			// Login failed - could be wrong password for existing user or user doesn't exist
			// For security, we don't reveal which case it is
			// But if registration "succeeded" but login fails, it's suspicious
			// This might indicate the user already exists with a different password
			console.warn("[Register] Registration succeeded but login failed - user may already exist");
			// Still return success - Saleor doesn't reveal if user exists, so we shouldn't either
		}

		// Professional cart merge: merge guest cart into user cart on signup
		// This is the ONLY allowed case of cart merge (guest → user on signup/login)
		try {
			await mergeGuestCartIntoUserCart(channel);
		} catch (mergeError) {
			console.error("[Register] Cart merge failed (non-fatal):", mergeError);
			// Continue anyway - user is registered, cart merge is best-effort
		}

		revalidatePath("/", "layout");
		return { success: true, requiresConfirmation: false };
	} catch (error) {
		console.error("Registration error:", error);
		const config = await fetchStorefrontConfig(channel);
		const errorMessages = config.content?.account || DEFAULT_CONTENT_CONFIG.account;
		return { error: errorMessages.registerGenericError };
	}
}

