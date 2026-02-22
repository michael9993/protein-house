import { draftMode } from "next/headers";
import { getClientIp, rateLimitResponse, relaxedLimiter } from "@/lib/rate-limit";

export async function GET(request: Request) {
	const { allowed, resetAt } = relaxedLimiter(getClientIp(request));
	if (!allowed) return rateLimitResponse(resetAt);
	(await draftMode()).disable();
	return new Response("Draft mode disabled. Redirecting back.", {
		status: 200,
		headers: {
			"content-type": "text/plain",
			refresh: "1; url=/",
		},
	});
}
