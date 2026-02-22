import { NextRequest, NextResponse } from "next/server";
import { markChannelStale } from "@/lib/storefront-control/cache";
import { refreshConfig } from "@/lib/storefront-control/fetch-config";
import { updateFallbackConfigFile } from "@/lib/storefront-control/fallback-updater";
import { getClientIp, rateLimitResponse, relaxedLimiter } from "@/lib/rate-limit";

/**
 * Webhook endpoint for Storefront Control app to invalidate cache.
 * 
 * POST /api/config/refresh
 * 
 * Body: { channelSlug: string, updatedAt?: string, version?: number }
 * 
 * This:
 * 1. Marks the channel as stale
 * 2. Triggers immediate background refresh
 * 3. Updates the fallback config file
 * 4. Client-side components will detect stale status and fetch fresh config
 */
export async function POST(request: NextRequest) {
  const { allowed, resetAt } = relaxedLimiter(getClientIp(request));
  if (!allowed) return rateLimitResponse(resetAt);

  try {
    const body = (await request.json()) as {
      channelSlug?: string;
      updatedAt?: string;
      version?: number;
    };

    if (!body.channelSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing channelSlug" },
        { status: 400 }
      );
    }

    const channelSlug = body.channelSlug;

    // Mark channel as stale - this will trigger background refresh
    markChannelStale(channelSlug);

    // Trigger immediate background refresh (non-blocking)
    refreshConfig(channelSlug)
      .then((config) => {
        if (config) {
          // Update fallback config file in background (non-blocking)
          updateFallbackConfigFile(channelSlug, config).catch((err) => {
            console.error(`[config/refresh] Failed to update fallback config file:`, err);
          });
        }
      })
      .catch((err) => {
        console.error(`[config/refresh] Background refresh failed for channel "${channelSlug}":`, err);
      });

    return NextResponse.json({
      ok: true,
      channelSlug,
      message: "Cache invalidated, refresh initiated",
    });
  } catch (error) {
    console.error("[config/refresh] Error processing webhook:", error);
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
