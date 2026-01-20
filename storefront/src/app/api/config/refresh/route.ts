import { NextRequest, NextResponse } from "next/server";
import { markChannelStale } from "@/lib/storefront-control/cache";
import { refreshConfig } from "@/lib/storefront-control/fetch-config";
import { updateFallbackConfigFile } from "@/lib/storefront-control/fallback-updater";

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

    console.log(`[config/refresh] 🔔 Webhook received for channel "${channelSlug}"`);
    console.log(`[config/refresh]    Version: ${body.version ?? 'N/A'}, Updated: ${body.updatedAt ?? 'N/A'}`);

    // Trigger immediate background refresh (non-blocking)
    refreshConfig(channelSlug)
      .then((config) => {
        if (config) {
          console.log(`[config/refresh] ✅ Refreshed config for channel "${channelSlug}"`);
          console.log(`[config/refresh]    Store name: ${config.store.name}`);
          console.log(`[config/refresh]    Primary color: ${config.branding.colors.primary}`);
          console.log(`[config/refresh]    Client-side polling will detect stale status and fetch immediately`);
          
          // Update fallback config file in background (non-blocking)
          updateFallbackConfigFile(channelSlug, config).catch((err) => {
            console.error(`[config/refresh] ⚠️  Failed to update fallback config file:`, err);
          });
        } else {
          console.warn(`[config/refresh] ⚠️  Config refresh returned null for channel "${channelSlug}"`);
        }
      })
      .catch((err) => {
        console.error(`[config/refresh] ❌ Background refresh failed for channel "${channelSlug}":`, err);
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
