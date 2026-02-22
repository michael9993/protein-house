import { NextRequest, NextResponse } from "next/server";
import * as Checkout from "@/lib/checkout";
import { executeGraphQL } from "@/lib/graphql";
import { getClientIp, rateLimitResponse, normalLimiter } from "@/lib/rate-limit";

// Lightweight query — only fetches line quantities, no variants/pricing/thumbnails
const CheckoutLineCountQuery = {
  toString: () => `query CheckoutLineCount($id: ID!) {
    checkout(id: $id) {
      lines { quantity }
    }
  }`,
} as any;

export async function GET(request: NextRequest) {
  const { allowed, resetAt } = normalLimiter(getClientIp(request));
  if (!allowed) return rateLimitResponse(resetAt);

  try {
    const channel = request.nextUrl.searchParams.get("channel");
    if (!channel) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const checkoutId = await Checkout.getIdFromCookies(channel);
    if (!checkoutId) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const result = await executeGraphQL(CheckoutLineCountQuery, {
      variables: { id: checkoutId },
      cache: "no-cache",
    });

    const checkout = (result as { checkout?: { lines?: Array<{ quantity: number }> } })?.checkout;
    if (!checkout?.lines) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const count = checkout.lines.reduce((sum, line) => sum + line.quantity, 0);
    return NextResponse.json(
      { count },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=10" },
      }
    );
  } catch {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
