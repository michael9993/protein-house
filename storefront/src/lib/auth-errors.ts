/**
 * Errors that mean "treat as unauthenticated" in RSC/layout context:
 * - Invalid/expired token, inactive user, UNAUTHENTICATED
 * - Next.js "Cookies can only be modified in a Server Action or Route Handler"
 *   (auth SDK may try to refresh/write cookies during RSC render)
 * - Normalized AUTH_UNAVAILABLE_RSC thrown by executeGraphQL
 */
export function isAuthOrRscContextError(error: unknown): boolean {
	const msg = error instanceof Error ? error.message : String(error);
	return (
		msg.includes("Invalid token") ||
		msg.includes("does not exist") ||
		msg.includes("is inactive") ||
		msg.includes("UNAUTHENTICATED") ||
		msg.includes("Cookies can only be modified") ||
		msg.includes("AUTH_UNAVAILABLE_RSC")
	);
}
