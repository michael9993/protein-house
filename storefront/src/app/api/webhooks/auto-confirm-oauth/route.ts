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
		const rawBody = await request.text();

		// Verify webhook signature — REQUIRED for security
		const webhookSecret = process.env.SALEOR_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error("[Auto-Confirm Webhook] SALEOR_WEBHOOK_SECRET not configured — rejecting request");
			return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
		}

		const signature = request.headers.get("saleor-signature") || request.headers.get("x-saleor-signature") || "";
		if (!signature) {
			console.error("[Auto-Confirm Webhook] Missing signature header");
			return NextResponse.json({ error: "Missing signature" }, { status: 401 });
		}

		// Saleor signs webhooks with HMAC-SHA256
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(webhookSecret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
		const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		if (signature !== expectedSignature) {
			console.error("[Auto-Confirm Webhook] Invalid signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const payload = JSON.parse(rawBody) as any;

		// Check if this is an ACCOUNT_CONFIRMATION_REQUESTED event
		// This event is sent when a user registers and needs confirmation
		if (payload.event_type !== "ACCOUNT_CONFIRMATION_REQUESTED") {
			return NextResponse.json({ message: "Event type not handled" }, { status: 200 });
		}

		const user = payload.data?.user;
		const token = payload.data?.token;
		
		if (!user || !token) {
			console.error("[Auto-Confirm Webhook] Missing user or token data");
			return NextResponse.json({ error: "Missing required data" }, { status: 400 });
		}

		const email = user.email;
		if (!email) {
			return NextResponse.json({ error: "Missing email" }, { status: 400 });
		}

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

		const confirmResult = (await confirmResponse.json()) as { errors?: any[]; data?: { confirmAccount?: { errors?: any[]; user?: { isConfirmed?: boolean } } } };
		
		if (confirmResult.errors || confirmResult.data?.confirmAccount?.errors) {
			console.error("[Auto-Confirm Webhook] Failed to confirm:", confirmResult.errors || confirmResult.data?.confirmAccount?.errors);
			return NextResponse.json(
				{ error: "Failed to confirm account" },
				{ status: 500 }
			);
		}

		const isConfirmed = confirmResult.data?.confirmAccount?.user?.isConfirmed;

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

