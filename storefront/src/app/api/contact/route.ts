import { NextRequest, NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import { ContactSubmissionCreateDocument } from "@/gql/graphql";

// Simple rate limiting using in-memory store (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const record = rateLimitMap.get(ip);

	if (!record || now > record.resetTime) {
		rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return true;
	}

	if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
		return false;
	}

	record.count++;
	return true;
}

export async function POST(request: NextRequest) {
	try {
		// Get client IP for rate limiting
		const forwarded = request.headers.get("x-forwarded-for");
		const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";

		// Check rate limit
		if (!checkRateLimit(ip)) {
			return NextResponse.json(
				{ success: false, error: "Too many requests. Please try again later." },
				{ status: 429 }
			);
		}

		const body = (await request.json()) as { channel?: string; name?: string; email?: string; subject?: string; message?: string };
		const { channel, name, email, subject, message } = body;

		// Validate required fields
		if (!channel || !name || !email || !subject || !message) {
			return NextResponse.json(
				{ success: false, error: "All fields are required." },
				{ status: 400 }
			);
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ success: false, error: "Please provide a valid email address." },
				{ status: 400 }
			);
		}

		// Validate field lengths
		if (name.trim().length < 2) {
			return NextResponse.json(
				{ success: false, error: "Name must be at least 2 characters." },
				{ status: 400 }
			);
		}

		if (subject.trim().length < 3) {
			return NextResponse.json(
				{ success: false, error: "Subject must be at least 3 characters." },
				{ status: 400 }
			);
		}

		if (message.trim().length < 10) {
			return NextResponse.json(
				{ success: false, error: "Message must be at least 10 characters." },
				{ status: 400 }
			);
		}

		// Call Saleor GraphQL mutation
		const result = await executeGraphQL(ContactSubmissionCreateDocument, {
			variables: {
				input: {
					channel: channel.trim(),
					name: name.trim(),
					email: email.trim().toLowerCase(),
					subject: subject.trim(),
					message: message.trim(),
				},
			},
			cache: "no-cache",
			withAuth: false, // Public mutation - no authentication required
		});

		// Check for GraphQL errors
		if (result.contactSubmissionCreate?.accountErrors && result.contactSubmissionCreate.accountErrors.length > 0) {
			const error = result.contactSubmissionCreate.accountErrors[0];
			return NextResponse.json(
				{ success: false, error: error.message || "Failed to submit contact form." },
				{ status: 400 }
			);
		}

		if (!result.contactSubmissionCreate?.contactSubmission) {
			return NextResponse.json(
				{ success: false, error: "Failed to submit contact form." },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			submission: result.contactSubmissionCreate.contactSubmission,
		});
	} catch (error) {
		console.error("Contact form submission error:", error);
		return NextResponse.json(
			{ success: false, error: "An error occurred while submitting your message. Please try again later." },
			{ status: 500 }
		);
	}
}
