import { NextRequest, NextResponse } from "next/server";

/**
 * Internal API endpoint to confirm a user account for OAuth users
 * This uses the confirmAccount mutation with a token
 * 
 * Note: This is a simplified version. For production, you should:
 * 1. Use a webhook to listen for CUSTOMER_CREATED events
 * 2. Auto-confirm OAuth users in the webhook handler
 * 3. Or disable email confirmation for OAuth users in Saleor settings
 */
export async function POST(request: NextRequest) {
	try {
		const { email, token } = await request.json();

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL!;

		// If token is provided, use confirmAccount mutation
		if (token) {
			const confirmResponse = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: `
						mutation ConfirmAccount($email: String!, $token: String!) {
							confirmAccount(email: $email, token: $token) {
								errors {
									message
									code
								}
								user {
									id
									email
									isConfirmed
								}
							}
						}
					`,
					variables: { email, token },
				}),
			});

			const confirmResult = await confirmResponse.json();
			
			if (confirmResult.errors || confirmResult.data?.confirmAccount?.errors) {
				console.error("[Confirm Account] Failed to confirm:", confirmResult.errors || confirmResult.data?.confirmAccount?.errors);
				return NextResponse.json(
					{ error: "Failed to confirm account" },
					{ status: 500 }
				);
			}

			return NextResponse.json({ 
				success: true, 
				message: "Account confirmed successfully",
				isConfirmed: confirmResult.data?.confirmAccount?.user?.isConfirmed || false,
			});
		}

		// If no token provided, we can't confirm without it
		// This endpoint is called from OAuth callback, but we don't have the token
		// The token is sent via email by Saleor
		// For now, return success but note that confirmation may still be needed
		console.warn("[Confirm Account] No token provided - account may still need email confirmation");
		return NextResponse.json({ 
			success: false, 
			message: "Confirmation token required. Please check your email for the confirmation link.",
			requiresToken: true,
		});
	} catch (error) {
		console.error("[Confirm Account] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

