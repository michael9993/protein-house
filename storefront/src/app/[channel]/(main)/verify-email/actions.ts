"use server";

/**
 * Resend confirmation email WITHOUT requiring authentication.
 * This calls a custom Django endpoint that sends the email directly,
 * just like the initial registration email.
 */
export async function resendConfirmationEmail(email: string, channel: string) {
	try {
		// Get base URL and remove /graphql/ if present (since this is a custom endpoint, not GraphQL)
		let saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL!;
		// Remove trailing slashes
		saleorApiUrl = saleorApiUrl.replace(/\/+$/, "");
		// Remove /graphql if it's at the end
		if (saleorApiUrl.endsWith("/graphql")) {
			saleorApiUrl = saleorApiUrl.replace(/\/graphql$/, "");
		}
		
		const endpointUrl = `${saleorApiUrl}/resend-confirmation-email/`;
		const redirectUrl = `${process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3001"}/${channel}/confirm-email`;
		
		const response = await fetch(endpointUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email,
				channel: channel,
				redirect_url: redirectUrl,
			}),
		});
		
		// Check if response is JSON or HTML (404 page, etc.)
		const contentType = response.headers.get("content-type") || "";
		let result: { error?: string; message?: string };
		
		if (contentType.includes("application/json")) {
			result = await response.json() as { error?: string; message?: string };
		} else {
			// If we get HTML (like a 404 page), the endpoint might not exist
			const text = await response.text();
			console.error("[Resend Confirmation Email] ❌ Received non-JSON response:", {
				status: response.status,
				statusText: response.statusText,
				contentType,
				url: endpointUrl,
				preview: text.substring(0, 200)
			});
			
			// Provide a more helpful error message
			if (response.status === 404) {
				return {
					success: false,
					error: `The resend confirmation email endpoint was not found. Please ensure the Django server is running and the endpoint is configured. (URL: ${endpointUrl})`,
				};
			}
			
			return {
				success: false,
				error: `Server returned an unexpected response (Status: ${response.status}). Please try again or contact support.`,
			};
		}
		
		if (!response.ok) {
			console.error("[Resend Confirmation Email] ❌ Error:", result.error);
			return {
				success: false,
				error: result.error || "Failed to resend confirmation email",
			};
		}
		
		return {
			success: true,
			message: result.message || "Confirmation email has been sent.",
		};
	} catch (error: any) {
		console.error("[Resend Confirmation Email] ❌ Exception:", {
			message: error?.message || String(error),
			stack: error?.stack,
		});
		
		// Check if it's a JSON parse error (likely got HTML instead)
		if (error?.message?.includes("JSON") || error?.message?.includes("DOCTYPE")) {
			return {
				success: false,
				error: "The resend confirmation email endpoint is not available. Please check your Saleor backend configuration.",
			};
		}
		
		return {
			success: false,
			error: "An error occurred while resending the confirmation email. Please try again.",
		};
	}
}

