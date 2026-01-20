import { NextRequest, NextResponse } from "next/server";
import { clearChannelStale } from "@/lib/storefront-control/cache";

/**
 * Clear stale flag for a channel (called by client after fetching fresh config).
 * 
 * POST /api/config/clear-stale?channel=usd
 * 
 * This allows the client-side to clear the stale flag after it has
 * successfully fetched and applied the new config.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json(
        { ok: false, error: "Missing channel parameter" },
        { status: 400 }
      );
    }

    clearChannelStale(channel);
    console.log(`[api/config/clear-stale] ✅ Cleared stale flag for channel "${channel}"`);

    return NextResponse.json({
      ok: true,
      channel,
      message: "Stale flag cleared",
    });
  } catch (error) {
    console.error("[api/config/clear-stale] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to clear stale flag" },
      { status: 500 }
    );
  }
}
