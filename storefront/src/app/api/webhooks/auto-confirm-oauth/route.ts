import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook handler to auto-confirm OAuth users
 * This listens for ACCOUNT_CONFIRMATION_REQUESTED events from Saleor
 * and auto-confirms users who registered via OAuth
 * 
 * The webhook payload includes the confirmation token, which we can use
 * to confirm the account immediately.
 * 
 * To set up:
 * 1. Go to Saleor Dashboard -> Webhooks
 * 2. Create a new webhook
 * 3. Event: ACCOUNT_CONFIRMATION_REQUESTED
 * 4. Target URL: https://your-tunnel-url/api/webhooks/auto-confirm-oauth
 * 5. Secret: (optional, for security)
 */
export async function POST(request: NextRequest) {
	try {
		const payload = await request.json();
		
		// Verify webhook signature if secret is configured
		const webhookSecret = process.env.SALEOR_WEBHOOK_SECRET;
		if (webhookSecret) {
			// TODO: Implement webhook signature verification
			// For now, we'll trust the request (not recommended for production)
		}

		// Check if this is an ACCOUNT_CONFIRMATION_REQUESTED event
		// This event is sent when a user registers and needs confirmation
		if (payload.event_type !== "ACCOUNT_CONFIRMATION_REQUESTED") {
			return NextResponse.json({ message: "Event type not handled" }, { status: 200 });
		}

		const user = payload.data?.user;
		const token = payload.data?.token;
		
		if (!user || !token) {
			console.warn("[Auto-Confirm Webhook] Missing user or token data");
			return NextResponse.json({ error: "Missing required data" }, { status: 400 });
		}

		const email = user.email;
		if (!email) {
			return NextResponse.json({ error: "Missing email" }, { status: 400 });
		}

		// Check if this is an OAuth user (you can add metadata check here)
		// For now, we'll auto-confirm all users
		// In production, you might want to check user metadata to only confirm OAuth users
		console.log(`[Auto-Confirm Webhook] Auto-confirming user: ${email}`);

		// Use the token from the webhook to confirm the account
		const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL!;
		
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
			console.error("[Auto-Confirm Webhook] Failed to confirm:", confirmResult.errors || confirmResult.data?.confirmAccount?.errors);
			return NextResponse.json(
				{ error: "Failed to confirm account" },
				{ status: 500 }
			);
		}

		const isConfirmed = confirmResult.data?.confirmAccount?.user?.isConfirmed;
		console.log(`[Auto-Confirm Webhook] Account confirmed successfully: ${email} (Confirmed: ${isConfirmed})`);

		return NextResponse.json({ 
			message: "Account auto-confirmed successfully",
			user: { email, isConfirmed },
		}, { status: 200 });
	} catch (error) {
		console.error("[Auto-Confirm Webhook] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

