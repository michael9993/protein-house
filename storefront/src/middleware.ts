import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: redirects channelless storefront paths to /{defaultChannel}/{path}.
 *
 * When a user visits /products, /cart, /about, etc. without a channel prefix,
 * this middleware redirects them to /{DEFAULT_CHANNEL}/products, etc.
 * This prevents 404s and provides a seamless experience.
 */

const DEFAULT_CHANNEL = process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "default-channel";

// Known storefront page segments that should be prefixed with a channel.
// If the first path segment matches one of these, we know the channel is missing.
const KNOWN_PAGES = new Set([
  "products",
  "cart",
  "checkout",
  "search",
  "account",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "about",
  "contact",
  "faq",
  "categories",
  "collections",
  "privacy-policy",
  "terms-of-service",
  "returns-policy",
  "shipping-policy",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get the first path segment
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    // Root "/" → redirect to /{defaultChannel}
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_CHANNEL}`;
    return NextResponse.redirect(url, 308);
  }

  const firstSegment = segments[0].toLowerCase();

  // If the first segment is a known page name (not a channel), redirect with channel prefix
  if (KNOWN_PAGES.has(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_CHANNEL}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
