"use server";

import { getServerAuthClient } from "@/app/config";
import { revalidatePath } from "next/cache";

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

