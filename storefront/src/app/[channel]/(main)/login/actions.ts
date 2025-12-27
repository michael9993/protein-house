"use server";

import { getServerAuthClient } from "@/app/config";
import { revalidatePath } from "next/cache";
import { mergeGuestCartIntoUserCart } from "@/app/actions";

export async function loginAction(formData: FormData) {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const channel = formData.get("channel")?.toString() || "default-channel";

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
		return { error: "An error occurred during login. Please try again." };
	}
}

export async function registerAction(formData: FormData) {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const firstName = formData.get("firstName")?.toString();
	const lastName = formData.get("lastName")?.toString();
	const channel = formData.get("channel")?.toString() || "default-channel";

	if (!email || !password) {
		return { error: "Email and password are required" };
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
			const errorMessage = result.errors[0]?.message || "Registration failed";
			return { error: errorMessage };
		}
		
		// Check for mutation errors
		if (result.data?.accountRegister?.errors && result.data.accountRegister.errors.length > 0) {
			const errorMessage = result.data.accountRegister.errors[0]?.message || "Registration failed";
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
						hasUserFromToken: !!loginResult.data.tokenCreate.user,
						hasCurrentUser: !!currentUser,
						currentUserId: currentUser?.id,
						currentUserEmail: currentUser?.email,
						isConfirmed: currentUser?.isConfirmed,
					});
					
					if (currentUser?.isConfirmed) {
						// User already exists and is confirmed - this was a duplicate registration attempt
						console.warn("[Register] ❌ User already exists and is confirmed:", email);
						return { 
							error: "An account with this email already exists. Please sign in instead.",
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
			
			// Return success with email - password will be stored on client side
			return { 
				success: true, 
				requiresConfirmation: true,
				email: email,
			};
		}

		// If no confirmation required, auto-login (backwards compatibility)
		const authClient = await getServerAuthClient();
		const loginResult = await authClient.signIn({ email, password }, { cache: "no-store" });
		
		// Check if login succeeded - if user is already confirmed, this means email already exists
		if (loginResult.data?.tokenCreate?.token) {
			const user = loginResult.data.tokenCreate.user;
			
			if (user?.isConfirmed) {
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
		return { error: "An error occurred during registration. Please try again." };
	}
}

