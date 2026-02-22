import { NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import {
	MeForConsentDocument,
	UpdateUserConsentMetadataDocument,
} from "@/gql/graphql";
import { getClientIp, rateLimitResponse, strictLimiter } from "@/lib/rate-limit";

type ConsentLogBody = {
	categories: {
		essential: boolean;
		analytics: boolean;
		marketing: boolean;
	};
	channel: string;
};

const CONSENT_VERSION = "1";

export async function POST(request: Request): Promise<Response> {
	const { allowed, resetAt } = strictLimiter(getClientIp(request));
	if (!allowed) return rateLimitResponse(resetAt);

	let body: ConsentLogBody;
	try {
		body = (await request.json()) as ConsentLogBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.categories || typeof body.channel !== "string") {
		return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
	}

	// Get the current user ID (requires auth cookies to be forwarded)
	let userId: string | undefined;
	try {
		const result = await executeGraphQL(MeForConsentDocument, {
			cache: "no-cache",
			withAuth: true,
		});
		userId = result.me?.id ?? undefined;
	} catch {
		// Auth unavailable (e.g. anonymous user, RSC cookie issue) — not an error
		return NextResponse.json({ ok: true, logged: false });
	}

	if (!userId) {
		// Anonymous user — consent only lives in localStorage, which is fine
		return NextResponse.json({ ok: true, logged: false });
	}

	// Write consent preferences to user metadata for GDPR audit trail
	try {
		await executeGraphQL(UpdateUserConsentMetadataDocument, {
			variables: {
				id: userId,
				input: [
					{
						key: "consent_analytics",
						value: String(body.categories.analytics),
					},
					{
						key: "consent_marketing",
						value: String(body.categories.marketing),
					},
					{
						key: "consent_timestamp",
						value: new Date().toISOString(),
					},
					{
						key: "consent_version",
						value: CONSENT_VERSION,
					},
					{
						key: "consent_channel",
						value: body.channel,
					},
				],
			},
			cache: "no-cache",
			withAuth: true,
		});
	} catch {
		// Metadata write failed — log but don't break the user experience
		console.error("[consent-log] Failed to write consent metadata for user", userId);
		return NextResponse.json({ ok: true, logged: false });
	}

	return NextResponse.json({ ok: true, logged: true });
}
