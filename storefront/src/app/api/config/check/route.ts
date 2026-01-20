import { NextRequest, NextResponse } from "next/server";
import { isChannelStale, getStaleTimestamp } from "@/lib/storefront-control/cache";

/**
 * Check if a channel's config is stale (needs refresh).
 * 
 * GET /api/config/check?channel=usd
 * 
 * Returns:
 * { stale: boolean, staleSince?: number }
 * 
 * This endpoint is used by the client-side ConfigSync hook to check
 * if a webhook has marked the channel as stale, indicating that
 * fresh config should be fetched.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    
    if (!channel) {
      return NextResponse.json(
        { ok: false, error: "Missing channel parameter" },
        { status: 400 }
      );
    }

    const stale = isChannelStale(channel);
    const staleSince = getStaleTimestamp(channel);
    
    return NextResponse.json({
      ok: true,
      channel,
      stale,
      staleSince: staleSince ?? null,
    });
  } catch (error) {
    console.error("[api/config/check] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to check config status" },
      { status: 500 }
    );
  }
}
