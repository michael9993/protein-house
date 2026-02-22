import { draftMode } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { getClientIp, rateLimitResponse, relaxedLimiter } from "@/lib/rate-limit";

export async function GET(request: Request) {
	const { allowed, resetAt } = relaxedLimiter(getClientIp(request));
	if (!allowed) return rateLimitResponse(resetAt);
	(await draftMode()).enable();
	redirect("/", RedirectType.replace);
}
